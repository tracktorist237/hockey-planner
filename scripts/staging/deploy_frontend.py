"""HP-93 dedicated Linux supervisor, streamed on stdin; no VPS helper install.

Only verified completion clears recovery-required. Exceptions retain it, even
when child teardown succeeds. No credentials or child output reach diagnostics.
"""
import argparse
import ctypes
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import select
import shutil
import signal
import stat
import subprocess
import sys
import tempfile
import threading
import time

LOCK = Path('/var/lib/hockeyplanner-staging/deploy/deploy.lock')
ROOT = Path('/opt/hockeyplanner-staging')
BARRIER = 'recovery-required'


def require(condition):
    if not condition:
        raise ValueError('Unsafe or unsupported staging state')


def identity(metadata):
    return metadata.st_dev, metadata.st_ino


def directory(path):
    metadata = path.lstat()
    require(stat.S_ISDIR(metadata.st_mode))
    require(metadata.st_uid in (0, os.geteuid()))
    require(not metadata.st_mode & 0o022)
    return metadata


def ancestors(path):
    require(path.is_absolute())
    for parent in reversed((path, *path.parents)):
        directory(parent)


def sync_directory(path):
    fd = os.open(path, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


class Cancelled(BaseException):
    pass


class Transaction:
    def __init__(self, expected, lock=LOCK):
        require(re.fullmatch('[0-9a-f]{40}', expected) is not None)
        self.expected, self.lock = expected, lock
        self.fd = self.parent_fd = None
        self.private = self.marker_identity = None
        self.groups = set()
        self.handlers = {}
        self.connection_stop = threading.Event()
        self.connection_thread = None

    def children(self):
        return [int(pid) for pid in Path(f'/proc/self/task/{os.getpid()}/children').read_text().split()]

    def check_lock(self):
        ancestors(self.lock.parent)
        parent = self.lock.parent.lstat()
        require(parent.st_uid == os.geteuid() and stat.S_IMODE(parent.st_mode) == 0o700)
        require(identity(parent) == identity(os.fstat(self.parent_fd)))
        current = self.lock.lstat()
        require(stat.S_ISREG(current.st_mode) and current.st_nlink == 1)
        require(current.st_uid == os.geteuid() and stat.S_IMODE(current.st_mode) == 0o600)
        require(identity(current) == identity(os.fstat(self.fd)))

    def admit(self):
        require(sys.platform == 'linux' and not self.children())
        # Probe required runtime before marker/temp/source mutation.
        libc = ctypes.CDLL(None, use_errno=True)
        require(libc.prctl(36, 1, 0, 0, 0) == 0)  # PR_SET_CHILD_SUBREAPER
        probe = os.pidfd_open(os.getpid())
        os.close(probe)
        require(callable(signal.pidfd_send_signal))
        require(shutil.rmtree.avoids_symlink_attacks)
        for sig in (signal.SIGTERM, signal.SIGINT, signal.SIGHUP):
            self.handlers[sig] = signal.signal(sig, self.cancel)
        ancestors(self.lock.parent)
        self.parent_fd = os.open(self.lock.parent, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        # Deliberately NO O_CREAT, truncation, replacement or LOCK_UN anywhere.
        self.fd = os.open(self.lock.name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK,
                          dir_fd=self.parent_fd)
        self.check_lock()
        import fcntl
        fcntl.flock(self.fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        self.check_lock()  # Detect replacement while waiting/opening.
        try:
            os.stat(BARRIER, dir_fd=self.parent_fd, follow_symlinks=False)
        except FileNotFoundError:
            return
        raise ValueError('Operator recovery required')

    def cancel(self, signum, frame):
        raise Cancelled()

    def watch_connection(self):
        # The runner keeps stdin open and sends heartbeats AFTER the framed code.
        # SSH EOF or missing heartbeats cancel mutation/cleanup, preserving marker.
        def monitor():
            try:
                poll = select.poll()
                poll.register(0, select.POLLIN | select.POLLHUP | select.POLLERR)
                last = time.monotonic()
                while not self.connection_stop.is_set():
                    events = poll.poll(250)
                    if events:
                        data = os.read(0, 4096)
                        if not data or data.strip(b'\n'):
                            break
                        last = time.monotonic()
                    if time.monotonic() - last > 90:
                        break
            except OSError:
                pass  # A failed transport monitor must also fail closed.
            finally:
                if not self.connection_stop.is_set():
                    os.kill(os.getpid(), signal.SIGTERM)
        self.connection_thread = threading.Thread(target=monitor, daemon=True)
        self.connection_thread.start()

    def begin(self):
        self.check_lock()
        marker = os.open(BARRIER, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
                         0o600, dir_fd=self.parent_fd)
        try:
            os.fchmod(marker, 0o600)
            self.marker_identity = identity(os.fstat(marker))
            data = json.dumps({'protocol': 'hp93-flock-recovery-v1', 'pid': os.getpid(),
                               'expectedSha': self.expected}).encode() + b'\n'
            with os.fdopen(marker, 'wb', closefd=False) as output:
                output.write(data)
                output.flush()
                os.fsync(marker)
            os.fsync(self.parent_fd)
        finally:
            os.close(marker)
        self.private = Path(tempfile.mkdtemp(prefix='frontend-', dir=self.lock.parent))
        os.chmod(self.private, 0o700)
        os.fsync(self.parent_fd)

    def quiescent(self):
        require(not self.children())
        for group in self.groups:
            try:
                os.killpg(group, 0)
            except ProcessLookupError:
                continue
            raise ValueError('Command descendants remain')

    def run(self, args, *, cwd=None, env=None, output=None, timeout=1800):
        self.check_lock()
        self.quiescent()
        process = subprocess.Popen(args, cwd=cwd, env=env, stdin=subprocess.DEVNULL,
                                   stdout=output if output is not None else subprocess.PIPE,
                                   stderr=subprocess.DEVNULL, pass_fds=(self.fd,), start_new_session=True)
        self.groups.add(process.pid)
        result, _ = process.communicate(timeout=timeout)
        require(process.returncode == 0)
        self.quiescent()
        self.check_lock()
        self.groups.discard(process.pid)
        return result

    def stop_descendants(self):
        # Ignore further cancellation only during bounded teardown. Never clear
        # the marker here. Adopted setsid/FD-closing workers are also killed/reaped.
        for sig in self.handlers:
            signal.signal(sig, signal.SIG_IGN)
        for group in self.groups:
            try:
                os.killpg(group, signal.SIGKILL)
            except ProcessLookupError:
                pass
        deadline = time.monotonic() + 5
        while children := self.children():
            require(len(children) <= 512)
            for pid in children:
                try:
                    descriptor = os.pidfd_open(pid)
                except ProcessLookupError:
                    continue
                try:
                    # pidfd avoids signalling a reused numeric PID.
                    signal.pidfd_send_signal(descriptor, signal.SIGKILL)
                    poll = select.poll()
                    poll.register(descriptor, select.POLLIN)
                    require(poll.poll(max(0, int((deadline - time.monotonic()) * 1000))))
                    os.waitpid(pid, 0)
                finally:
                    os.close(descriptor)
            require(time.monotonic() < deadline)
        self.quiescent()

    def finish(self):
        self.check_lock()
        self.quiescent()
        # rmtree uses fd-relative symlink-safe traversal; never chmod through
        # node_modules symlinks. Failed/unverified cleanup leaves the marker.
        shutil.rmtree(self.private)
        require(not os.path.lexists(self.private))
        os.fsync(self.parent_fd)
        self.check_lock()
        self.quiescent()
        marker = os.stat(BARRIER, dir_fd=self.parent_fd, follow_symlinks=False)
        require(stat.S_ISREG(marker.st_mode) and marker.st_uid == os.geteuid())
        require(stat.S_IMODE(marker.st_mode) == 0o600 and marker.st_nlink == 1)
        require(identity(marker) == self.marker_identity)
        try:
            os.unlink(BARRIER, dir_fd=self.parent_fd)
            os.fsync(self.parent_fd)
        except BaseException:
            # A failed durability check is not success. Re-establish admission
            # protection if removal happened; never overwrite another entry.
            if os.path.lexists(self.lock.parent / BARRIER):
                raise
            fd = os.open(BARRIER, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
                         0o600, dir_fd=self.parent_fd)
            try:
                os.fsync(fd)
                os.fsync(self.parent_fd)
            finally:
                os.close(fd)
            raise

    def close(self):
        self.connection_stop.set()
        if self.connection_thread is not None:
            self.connection_thread.join(timeout=1)
        # Close only; inherited open-file descriptions must keep their flock.
        for fd in (self.fd, self.parent_fd):
            if fd is not None:
                os.close(fd)
        for sig, handler in self.handlers.items():
            signal.signal(sig, handler)


def regular(path):
    require(stat.S_ISREG(path.lstat().st_mode))


def digest(path):
    regular(path)
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def inventory(build):
    files = {}
    directory(build)
    for path in build.rglob('*'):
        if stat.S_ISDIR(path.lstat().st_mode):
            continue
        regular(path)  # Reject symlinks/devices, including dangling entries.
        files[path.relative_to(build)] = digest(path)
    require(Path('index.html') in files and Path('build-meta.json') in files)
    return files


def verify_metadata(build, expected):
    regular(build / 'build-meta.json')
    data = json.loads((build / 'build-meta.json').read_text())
    require(data['schemaVersion'] == 1 and data['commit'] == expected and data['environment'] == 'Staging')
    main = data['mainJs']['path']
    require(re.fullmatch(r'/static/js/main\.[a-zA-Z0-9_-]+\.js', main) is not None)
    require(digest(build / main.lstrip('/')) == data['mainJs']['sha256'])


def publish(transaction, build, destination):
    ancestors(destination)
    original = identity(destination.lstat())
    files = inventory(build)
    verify_metadata(build, transaction.expected)
    # New hashed assets first, HTML entry last. Individual replacements avoid
    # truncation, but this multi-file publication is NOT an atomic site switch.
    order = sorted(files, key=lambda path: (path == Path('index.html'), path.parts[0] != 'static', str(path)))
    for relative in order:
        transaction.check_lock()
        transaction.quiescent()
        target = destination / relative
        for parent in reversed((target.parent, *target.parent.parents)):
            if not parent.exists():
                parent.mkdir(mode=0o755)
                sync_directory(parent.parent)
        ancestors(target.parent)
        if os.path.lexists(target):
            regular(target)
        fd, temporary = tempfile.mkstemp(prefix='.hp93-', dir=target.parent)
        # Any copy/replace/fsync error retains both barrier and recovery evidence.
        with os.fdopen(fd, 'wb') as output, (build / relative).open('rb') as source:
            shutil.copyfileobj(source, output)
            output.flush()
            os.fchmod(output.fileno(), 0o644)
            os.fsync(output.fileno())
        require(digest(Path(temporary)) == files[relative])
        os.replace(temporary, target)
        sync_directory(target.parent)
    for relative, expected_hash in files.items():
        require(digest(destination / relative) == expected_hash)
    verify_metadata(destination, transaction.expected)
    require(identity(destination.lstat()) == original)
    sync_directory(destination)
    transaction.check_lock()
    transaction.quiescent()


def deploy(transaction, root=ROOT):
    # Read-only preconditions while locked; never provision source/live paths.
    for path in (root / 'frontend-src', root / 'frontend' / 'build'):
        ancestors(path)
    for tool in ('git', 'tar', 'npm', 'node'):
        require(shutil.which(tool) is not None)
    transaction.begin()
    repo = root / 'frontend-src'
    # Git may detach automatic maintenance after a successful fetch. Do not
    # launch an asynchronous writer; preserve strict descendant completion.
    transaction.run(['git', 'fetch', '--no-auto-maintenance', 'origin', 'develop'], cwd=repo)
    resolved = transaction.run(['git', 'rev-parse', transaction.expected + '^{commit}'], cwd=repo)
    require(resolved.decode().strip() == transaction.expected)
    archive = transaction.private / 'source.tar'
    with archive.open('xb') as output:
        transaction.run(['git', 'archive', '--format=tar', transaction.expected], cwd=repo, output=output)
        output.flush()
        os.fsync(output.fileno())
    source = transaction.private / 'source'
    source.mkdir(mode=0o700)
    transaction.run(['tar', '-xf', str(archive), '-C', str(source)])
    transaction.run(['npm', 'ci'], cwd=source)
    transaction.run(['npm', 'run', 'version:sync'], cwd=source)
    regular(source / 'VERSION')
    version = (source / 'VERSION').read_text().strip()
    require(re.fullmatch(r'[0-9]+\.[0-9]+\.[0-9]+', version) is not None)
    env = {**os.environ, 'REACT_APP_API_BASE': '/api', 'REACT_APP_VERSION': version,
           'REACT_APP_BUILD_TIME': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
           'REACT_APP_COMMIT': transaction.expected, 'REACT_APP_DEPLOY_ENV': 'Staging'}
    transaction.run(['npm', 'run', 'build'], cwd=source, env=env)
    publish(transaction, source / 'build', root / 'frontend' / 'build')


def main():
    os.umask(0o022)  # Public static directories; private transaction stays 0700.
    parser = argparse.ArgumentParser()
    parser.add_argument('--expected-sha', required=True)
    args = parser.parse_args()
    transaction = Transaction(args.expected_sha)
    try:
        transaction.admit()
        transaction.watch_connection()
        deploy(transaction)
        transaction.finish()
    except (Exception, Cancelled):
        try:
            transaction.stop_descendants()
        except (Exception, Cancelled):
            pass  # Durable barrier remains; teardown is not recovery.
        print('BLOCKED: frontend staging transaction failed; operator recovery may be required.', file=sys.stderr)
        return 1
    finally:
        transaction.close()
    print(json.dumps({'status': 'PASS', 'commit': args.expected_sha}))
    return 0


if __name__ == '__main__':
    sys.exit(main())
