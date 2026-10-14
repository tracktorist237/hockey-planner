"""Actual Linux flock/subprocess fault injection. No network/VPS/staging writes.

Linux fixture directories live under the user's protected home, not shared /tmp.
Only npm's build output is synthetic; Git, tar, processes, signals, flock, fsync,
marker creation, supervision, copying and admission are real.
"""
import importlib.util
import json
import os
from pathlib import Path
import signal
import stat
import subprocess
import sys
import tempfile
import time
import unittest

ROOT = Path(__file__).resolve().parents[2]
HELPER = ROOT / 'scripts/staging/deploy_frontend.py'
TRANSPORT = ROOT / 'scripts/quality/deploy_frontend_ssh.py'
SHA = 'a' * 40


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class TransportTests(unittest.TestCase):
    def test_fixed_bootstrap_pins_host_and_streams_code_without_remote_write(self):
        module = load(TRANSPORT, 'transport')
        args = module.arguments('staging.example', 'deploy', Path('/key'), Path('/pins'), SHA)
        self.assertIn('StrictHostKeyChecking=yes', args)
        self.assertIn('IdentityAgent=none', args)
        self.assertIn('ClearAllForwardings=yes', args)
        self.assertIn('GlobalKnownHostsFile=/dev/null', args)
        self.assertIn('ProxyCommand=none', args)
        self.assertIn('/usr/bin/python3 -I -B', args[-1])
        self.assertIn('sys.stdin.buffer.read(', args[-1])
        for mutation in ('git ', 'mkdir', 'scp ', 'curl ', 'flock ', ' > '):
            self.assertNotIn(mutation, args[-1])
        for host, user, expected in (('-oProxyCommand=x', 'deploy', SHA),
                                      ('example', 'root;id', SHA), ('example', 'deploy', 'develop')):
            with self.assertRaises(ValueError):
                module.arguments(host, user, Path('/key'), Path('/pins'), expected)

    def test_missing_activation_blocks_before_connection(self):
        result = subprocess.run([sys.executable, str(TRANSPORT), '--expected-sha', SHA],
                                env={name: value for name, value in os.environ.items()
                                     if name not in ('HP93_APPROVED_HEAD', 'VPS_HOST', 'VPS_USER', 'VPS_SSH_KEY', 'STAGING_KNOWN_HOSTS')},
                                capture_output=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn(b'BLOCKED', result.stderr)
        self.assertNotIn(b'Traceback', result.stderr)


@unittest.skipUnless(sys.platform == 'linux', 'Linux lifetime regressions require Linux; mandatory PR CI runs them')
class LinuxDeploymentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='hp93-test-', dir=Path.home())
        self.root = Path(self.temp.name)
        self.lockdir = self.root / 'deploy'
        self.lockdir.mkdir(mode=0o700)
        self.lock = self.lockdir / 'deploy.lock'
        self.lock.touch(mode=0o600)
        self.barrier = self.lockdir / 'recovery-required'
        self.ready = self.root / 'ready'
        self.release = self.root / 'release'
        self.processes = []
        self.orphans = []
        self.original = self.lock.stat().st_ino

    def tearDown(self):
        for process in self.processes:
            if process.poll() is None:
                process.kill()
            process.communicate(timeout=10)
        for pid in self.orphans:
            try:
                os.kill(pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
        self.temp.cleanup()

    def wait_file(self, path):
        deadline = time.monotonic() + 10
        while not path.exists():
            if time.monotonic() > deadline:
                self.fail('Fixture handshake timed out')
            time.sleep(0.01)

    def start(self, body, *, begin=True, expected=SHA, environment=None, watch=False):
        script = f'''
import importlib.util, os, sys, time, signal, json, shutil, traceback
from pathlib import Path
spec = importlib.util.spec_from_file_location('frontend', {str(HELPER)!r})
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
t = m.Transaction({expected!r}, Path({str(self.lock)!r}))
try:
    t.admit()
    if {watch!r}: t.watch_connection()
    if {begin!r}: t.begin()
    {body}
    if {begin!r}: t.finish()
except (Exception, m.Cancelled) as failure:
    # Fixture-only diagnostics: code locations/exit status, never environments,
    # command payloads, captured child output or exception messages.
    frames = []
    for frame, lineno in traceback.walk_tb(failure.__traceback__):
        item = {{'file': Path(frame.f_code.co_filename).name, 'line': lineno,
                 'function': frame.f_code.co_name}}
        if frame.f_code.co_name == 'run':
            command = frame.f_locals.get('args', [])
            item['tool'] = Path(command[0]).name if command else None
            process = frame.f_locals.get('process')
            item['exit'] = process.returncode if process else None
        frames.append(item)
    Path({str(self.root / 'fixture-diagnostic.json')!r}).write_text(json.dumps(frames))
    try: t.stop_descendants()
    except (Exception, m.Cancelled): pass
    print('BLOCKED', flush=True); sys.exit(1)
finally:
    t.close()
print('PASS', flush=True)
'''
        process = subprocess.Popen([sys.executable, '-I', '-B', '-c', script],
                                   stdin=subprocess.PIPE if watch else subprocess.DEVNULL,
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                   env=environment)
        self.processes.append(process)
        return process

    def completed(self, body='pass', **kwargs):
        process = self.start(body, **kwargs)
        stdout, stderr = process.communicate(timeout=15)
        self.assertEqual(stderr, b'', stderr.decode())
        return process.returncode, stdout

    def backend_probe(self):
        # Backend-style all-writer cooperation: SAME inode + exclusive flock,
        # then lexists barrier BEFORE any writer admission.
        code = '''import fcntl, os, sys
fd = os.open(sys.argv[1], os.O_RDONLY | os.O_NOFOLLOW)
try:
    fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
except BlockingIOError:
    print('BUSY'); sys.exit(1)
if os.path.lexists(sys.argv[2]):
    print('RECOVERY'); sys.exit(2)
print('ADMITTED')
'''
        result = subprocess.run([sys.executable, '-c', code, str(self.lock), str(self.barrier)], capture_output=True, timeout=10)
        self.assertEqual(result.stderr, b'')
        return result.stdout.strip().decode()

    def waiting_child(self, *, escaped=False, close_fd=False):
        child_ready = self.root / 'child-ready'
        pidfile = self.root / 'child-pid'
        escape = '''if os.getsid(0) == os.getpid():
    if os.fork(): os._exit(0)
os.setsid()''' if escaped else ''
        child = f'''import os, signal, time
from pathlib import Path
signal.signal(signal.SIGTERM, signal.SIG_IGN)
{escape}
{'os.closerange(3, 1024)' if close_fd else ''}
Path({str(pidfile)!r}).write_text(str(os.getpid()))
Path({str(child_ready)!r}).touch()
while not Path({str(self.release)!r}).exists(): time.sleep(0.01)
Path({str(self.root / 'child-wrote')!r}).touch()
'''
        return child, child_ready, pidfile

    def test_valid_lock_success_preserves_inode_and_releases_admission(self):
        code, output = self.completed()
        self.assertEqual((code, output), (0, b'PASS\n'))
        self.assertEqual(self.lock.stat().st_ino, self.original)
        self.assertFalse(self.barrier.exists())
        self.assertEqual(self.backend_probe(), 'ADMITTED')
        self.assertEqual(list(self.lockdir.iterdir()), [self.lock])

    def test_missing_lock_blocks_without_creation_or_marker(self):
        self.lock.unlink()  # Fixture setup only; implementation must never do this.
        self.assertEqual(self.completed()[0], 1)
        self.assertFalse(self.lock.exists())
        self.assertFalse(self.barrier.exists())

    def test_symlink_lock_and_unsafe_permissions_block(self):
        other = self.root / 'other'; other.touch(mode=0o600)
        self.lock.unlink(); self.lock.symlink_to(other)
        self.assertEqual(self.completed()[0], 1)
        self.assertFalse(self.barrier.exists())
        self.lock.unlink(); self.lock.touch(mode=0o644)
        self.assertEqual(self.completed()[0], 1)
        self.lock.chmod(0o600); self.lockdir.chmod(0o755)
        self.assertEqual(self.completed()[0], 1)

    def test_replaced_lock_is_detected_during_transaction(self):
        body = f"Path({str(self.ready)!r}).touch();\n    while not Path({str(self.release)!r}).exists(): time.sleep(0.01)\n    t.check_lock()"
        owner = self.start(body)
        self.wait_file(self.ready)
        # Rename retains old inode so allocator cannot reuse it.
        self.lock.rename(self.lockdir / 'old-lock')
        self.lock.touch(mode=0o600)
        self.release.touch()
        self.assertEqual(owner.communicate(timeout=10)[0], b'BLOCKED\n')
        self.assertTrue(self.barrier.exists())
        self.assertEqual(self.backend_probe(), 'RECOVERY')

    def test_backend_writer_blocks_frontend_before_mutation(self):
        code = f'''import fcntl, os, time
from pathlib import Path
fd = os.open({str(self.lock)!r}, os.O_RDONLY)
fcntl.flock(fd, fcntl.LOCK_EX)
Path({str(self.ready)!r}).touch()
while not Path({str(self.release)!r}).exists(): time.sleep(0.01)
'''
        owner = subprocess.Popen([sys.executable, '-c', code], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        self.processes.append(owner)
        self.wait_file(self.ready)
        self.assertEqual(self.completed()[0], 1)
        self.assertFalse(self.barrier.exists())
        self.assertEqual(list(self.lockdir.iterdir()), [self.lock])
        self.release.touch(); owner.communicate(timeout=10)

    def test_frontend_writer_blocks_backend_then_releases_safely(self):
        child, ready, _ = self.waiting_child()
        owner = self.start(f't.run([sys.executable, "-c", {child!r}])')
        self.wait_file(ready)
        self.assertEqual(self.backend_probe(), 'BUSY')
        self.assertEqual(self.barrier.stat().st_mode & 0o777, 0o600)
        self.release.touch()
        self.assertEqual(owner.communicate(timeout=10)[0], b'PASS\n')
        self.assertEqual(self.backend_probe(), 'ADMITTED')

    def test_existing_barrier_never_overwritten_or_removed(self):
        self.barrier.write_text('operator-owned evidence')
        self.assertEqual(self.completed()[0], 1)
        self.assertEqual(self.barrier.read_text(), 'operator-owned evidence')
        self.assertEqual(set(self.lockdir.iterdir()), {self.lock, self.barrier})

    def test_dangling_symlink_barrier_blocks(self):
        self.barrier.symlink_to(self.root / 'absent')
        self.assertEqual(self.completed()[0], 1)
        self.assertTrue(self.barrier.is_symlink())
        self.assertEqual(self.backend_probe(), 'RECOVERY')

    def test_sigterm_mutating_child_retains_barrier_and_prevents_admission(self):
        child, ready, pidfile = self.waiting_child()
        owner = self.start(f't.run([sys.executable, "-c", {child!r}])')
        self.wait_file(ready)
        self.assertEqual(self.backend_probe(), 'BUSY')
        owner.send_signal(signal.SIGTERM)
        self.assertEqual(owner.communicate(timeout=10)[0], b'BLOCKED\n')
        self.assertEqual(self.backend_probe(), 'RECOVERY')
        self.assertFalse((self.root / 'child-wrote').exists())
        with self.assertRaises(ProcessLookupError): os.kill(int(pidfile.read_text()), 0)

    def test_sighup_ssh_loss_retains_barrier(self):
        child, ready, _ = self.waiting_child()
        owner = self.start(f't.run([sys.executable, "-c", {child!r}])')
        self.wait_file(ready); owner.send_signal(signal.SIGHUP)
        self.assertEqual(owner.communicate(timeout=10)[0], b'BLOCKED\n')
        self.assertEqual(self.backend_probe(), 'RECOVERY')

    def test_transport_eof_during_mutation_cancels_and_retains_barrier(self):
        child, ready, pidfile = self.waiting_child()
        owner = self.start(f't.run([sys.executable, "-c", {child!r}])', watch=True)
        owner.stdin.write(b'\n'); owner.stdin.flush()
        self.wait_file(ready)
        self.assertEqual(self.backend_probe(), 'BUSY')
        owner.stdin.close(); owner.stdin = None
        self.assertEqual(owner.communicate(timeout=10)[0], b'BLOCKED\n')
        self.assertEqual(self.backend_probe(), 'RECOVERY')
        with self.assertRaises(ProcessLookupError): os.kill(int(pidfile.read_text()), 0)

    def test_sigkill_owner_inherited_fd_and_durable_barrier_both_protect(self):
        child, ready, pidfile = self.waiting_child()
        owner = self.start(f't.run([sys.executable, "-c", {child!r}])')
        self.wait_file(ready)
        pid = int(pidfile.read_text()); self.orphans.append(pid)
        owner.kill(); owner.wait(timeout=10)
        self.assertEqual(self.backend_probe(), 'BUSY')  # Child still owns description.
        self.assertTrue(self.barrier.exists())
        self.release.touch(); self.wait_file(self.root / 'child-wrote')
        deadline = time.monotonic() + 10
        while self.backend_probe() == 'BUSY' and time.monotonic() < deadline: time.sleep(0.01)
        self.assertEqual(self.backend_probe(), 'RECOVERY')

    def test_sigkill_fd_closing_escaped_child_cannot_overlap_second_writer(self):
        child, ready, pidfile = self.waiting_child(escaped=True, close_fd=True)
        owner = self.start(f't.run([sys.executable, "-c", {child!r}])')
        self.wait_file(ready)
        self.orphans.append(int(pidfile.read_text()))
        owner.kill(); owner.wait(timeout=10)
        self.assertEqual(self.backend_probe(), 'RECOVERY')  # flock gone; marker is essential.
        self.assertEqual(self.completed()[0], 1)
        self.release.touch(); self.wait_file(self.root / 'child-wrote')
        self.assertEqual(self.backend_probe(), 'RECOVERY')

    def test_successful_leader_with_escaped_orphan_is_not_completion(self):
        child, ready, pidfile = self.waiting_child(escaped=True, close_fd=True)
        leader = f'''import subprocess, sys, time
from pathlib import Path
subprocess.Popen([sys.executable, '-c', {child!r}], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
while not Path({str(ready)!r}).exists(): time.sleep(0.01)
'''
        owner = self.start(f't.run([sys.executable, "-c", {leader!r}])')
        self.assertEqual(owner.communicate(timeout=10)[0], b'BLOCKED\n')
        self.assertEqual(self.backend_probe(), 'RECOVERY')
        self.assertFalse((self.root / 'child-wrote').exists())
        with self.assertRaises(ProcessLookupError): os.kill(int(pidfile.read_text()), 0)

    def test_command_timeout_cleans_children_but_not_barrier(self):
        child, ready, pidfile = self.waiting_child()
        owner = self.start(f't.run([sys.executable, "-c", {child!r}], timeout=0.3)')
        self.wait_file(ready)
        self.assertEqual(owner.communicate(timeout=10)[0], b'BLOCKED\n')
        self.assertEqual(self.backend_probe(), 'RECOVERY')
        with self.assertRaises(ProcessLookupError): os.kill(int(pidfile.read_text()), 0)

    def fixture_build(self):
        build = self.root / 'output'; build.mkdir()
        (build / 'static/js').mkdir(parents=True)
        main = build / 'static/js/main.abc.js'; main.write_text('verified-bundle')
        (build / 'index.html').write_text('new-index')
        import hashlib
        data = {'schemaVersion': 1, 'commit': SHA, 'environment': 'Staging',
                'mainJs': {'path': '/static/js/main.abc.js', 'sha256': hashlib.sha256(main.read_bytes()).hexdigest()}}
        (build / 'build-meta.json').write_text(json.dumps(data))
        destination = self.root / 'live'; destination.mkdir()
        (destination / 'index.html').write_text('old-index')
        (destination / 'old-hashed.js').write_text('old-assets')
        return build, destination

    def test_partial_publication_retains_barrier_and_old_index(self):
        build, destination = self.fixture_build()
        body = f'''original = m.os.replace
    count = 0
    def partial(source, target):
        global count
        count += 1
        if count == 2: raise OSError('injected copy failure')
        return original(source, target)
    m.os.replace = partial
    m.publish(t, Path({str(build)!r}), Path({str(destination)!r}))'''
        self.assertEqual(self.completed(body)[0], 1)
        self.assertEqual((destination / 'index.html').read_text(), 'old-index')
        self.assertEqual((destination / 'static/js/main.abc.js').read_text(), 'verified-bundle')
        self.assertEqual(self.backend_probe(), 'RECOVERY')

    def test_completion_hash_mismatch_never_reports_success(self):
        build, destination = self.fixture_build()
        body = f'''original = m.os.replace
    def corrupt(source, target):
        original(source, target)
        Path(target).write_text('corrupted-publication')
    m.os.replace = corrupt
    m.publish(t, Path({str(build)!r}), Path({str(destination)!r}))'''
        self.assertEqual(self.completed(body)[0], 1)
        self.assertEqual(self.backend_probe(), 'RECOVERY')

    def test_uncertain_cleanup_retains_barrier_after_publication(self):
        build, destination = self.fixture_build()
        body = f'''m.publish(t, Path({str(build)!r}), Path({str(destination)!r}))
    def failure(path): raise OSError('injected cleanup failure')
    m.shutil.rmtree = failure'''
        self.assertEqual(self.completed(body)[0], 1)
        self.assertEqual((destination / 'index.html').read_text(), 'new-index')
        self.assertEqual(self.backend_probe(), 'RECOVERY')

    def test_marker_replacement_before_finish_is_rejected(self):
        body = f"Path({str(self.barrier)!r}).rename(Path({str(self.lockdir / 'original-marker')!r})); Path({str(self.barrier)!r}).write_text('replacement')"
        self.assertEqual(self.completed(body)[0], 1)
        self.assertEqual(self.barrier.read_text(), 'replacement')

    def test_barrier_fsync_failure_prevents_any_command(self):
        # Fault injection at durability boundary; flock and O_EXCL are real.
        body = '''def failure(fd): raise OSError('injected fsync failure')
    m.os.fsync = failure
    t.begin()'''
        self.assertEqual(self.completed(body, begin=False)[0], 1)
        self.assertTrue(self.barrier.exists())
        self.assertEqual(self.backend_probe(), 'RECOVERY')

    def test_marker_removal_fsync_failure_reestablishes_barrier(self):
        body = f'''original = m.os.fsync
    def failure(fd):
        if not Path({str(self.barrier)!r}).exists(): raise OSError('injected final fsync failure')
        return original(fd)
    m.os.fsync = failure'''
        self.assertEqual(self.completed(body)[0], 1)
        self.assertTrue(self.barrier.exists())
        self.assertEqual(self.backend_probe(), 'RECOVERY')

    def prepare_source(self):
        staging = self.root / 'staging'; staging.mkdir()
        repo = staging / 'frontend-src'; repo.mkdir()
        remote = self.root / 'origin.git'
        def git(*args):
            subprocess.run(['git', *args], cwd=repo, check=True, capture_output=True)
        subprocess.run(['git', 'init', '--bare', str(remote)], check=True, capture_output=True)
        git('init', '-b', 'develop'); git('config', 'user.email', 'fixture@example.invalid'); git('config', 'user.name', 'Fixture')
        (repo / 'VERSION').write_text('0.5.0\n')
        (repo / 'package.json').write_text('{"version":"0.5.0"}')
        (repo / 'package-lock.json').write_text('{"version":"0.5.0"}')
        git('add', '.'); git('commit', '-m', 'fixture'); git('remote', 'add', 'origin', str(remote)); git('push', 'origin', 'develop')
        expected = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=repo).decode().strip()
        (repo / 'VERSION').write_text('9.9.9\n')  # Existing generated checkout changes preserved.
        destination = staging / 'frontend/build'; destination.mkdir(parents=True)
        (destination / 'index.html').write_text('old-index')
        (destination / 'old-hashed.js').write_text('retained')
        tools = self.root / 'bin'; tools.mkdir()
        npm = tools / 'npm'
        npm.write_text('''#!/usr/bin/python3
import hashlib, json, os, sys
from pathlib import Path
root = Path.cwd()
with open(os.environ['FIXTURE_LOG'], 'a') as output:
    output.write(json.dumps({'args': sys.argv[1:], 'cwd': str(root), 'commit': os.environ.get('REACT_APP_COMMIT'), 'api': os.environ.get('REACT_APP_API_BASE'), 'version': os.environ.get('REACT_APP_VERSION')}) + '\\n')
if sys.argv[1:] == ['ci']: sys.exit(0)
if sys.argv[1:] == ['run', 'version:sync']:
    (root / 'package.json').write_text('synchronized-only-in-export'); sys.exit(0)
if os.environ.get('FIXTURE_BUILD_FAIL'): print('SECRET_CHILD_OUTPUT'); sys.exit(1)
build = root / 'build'; (build / 'static/js').mkdir(parents=True)
main = build / 'static/js/main.abc.js'; main.write_text('bundle')
(build / 'index.html').write_text('new-index')
(build / 'build-meta.json').write_text(json.dumps({'schemaVersion': 1, 'commit': os.environ['REACT_APP_COMMIT'], 'environment': os.environ['REACT_APP_DEPLOY_ENV'], 'mainJs': {'path': '/static/js/main.abc.js', 'sha256': hashlib.sha256(main.read_bytes()).hexdigest()}}))
''')
        npm.chmod(0o755)
        # Runtime node presence is a read-only preflight; fixture never uses it.
        node = tools / 'node'; node.symlink_to(sys.executable)
        environment = {**os.environ, 'PATH': str(tools) + ':' + os.environ['PATH'], 'FIXTURE_LOG': str(self.root / 'npm-log')}
        return staging, repo, destination, expected, environment

    def test_real_git_archive_success_preserves_checkout_and_frontend_behavior(self):
        staging, repo, destination, expected, environment = self.prepare_source()
        inode = destination.stat().st_ino
        code, output = self.completed(f'm.deploy(t, Path({str(staging)!r})); t.finish()', begin=False, expected=expected, environment=environment)
        diagnostic = self.root / 'fixture-diagnostic.json'
        self.assertEqual((code, output), (0, b'PASS\n'), diagnostic.read_text() if diagnostic.exists() else '')
        self.assertFalse(self.barrier.exists())
        self.assertEqual(self.backend_probe(), 'ADMITTED')
        self.assertEqual((repo / 'VERSION').read_text(), '9.9.9\n')
        self.assertEqual((repo / 'package.json').read_text(), '{"version":"0.5.0"}')
        self.assertEqual(destination.stat().st_ino, inode)
        self.assertEqual((destination / 'old-hashed.js').read_text(), 'retained')
        self.assertEqual(json.loads((destination / 'build-meta.json').read_text())['commit'], expected)
        commands = [json.loads(line) for line in (self.root / 'npm-log').read_text().splitlines()]
        self.assertEqual([row['args'] for row in commands], [['ci'], ['run', 'version:sync'], ['run', 'build']])
        self.assertTrue(all(row['cwd'] != str(repo) for row in commands))
        self.assertEqual((commands[-1]['commit'], commands[-1]['api'], commands[-1]['version']), (expected, '/api', '0.5.0'))

    def test_real_build_failure_never_publishes_or_leaks_output(self):
        staging, repo, destination, expected, environment = self.prepare_source()
        environment['FIXTURE_BUILD_FAIL'] = '1'
        code, output = self.completed(f'm.deploy(t, Path({str(staging)!r})); t.finish()', begin=False, expected=expected, environment=environment)
        self.assertEqual((code, output), (1, b'BLOCKED\n'))
        self.assertNotIn(b'SECRET_CHILD_OUTPUT', output)
        self.assertEqual((destination / 'index.html').read_text(), 'old-index')
        self.assertEqual(self.backend_probe(), 'RECOVERY')

    def test_missing_tool_blocks_before_marker_or_fetch(self):
        staging, repo, destination, expected, environment = self.prepare_source()
        environment['PATH'] = ''
        code, _ = self.completed(f'm.deploy(t, Path({str(staging)!r}))', begin=False, expected=expected, environment=environment)
        self.assertEqual(code, 1)
        self.assertFalse(self.barrier.exists())
        self.assertFalse((self.root / 'npm-log').exists())


if __name__ == '__main__':
    unittest.main()
