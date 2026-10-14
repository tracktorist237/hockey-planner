"""Send the reviewed supervisor in memory; no remote source bootstrap writes."""
import argparse
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time

HELPER = Path(__file__).resolve().parents[1] / 'staging' / 'deploy_frontend.py'
SECRETS = ('VPS_HOST', 'VPS_USER', 'VPS_SSH_KEY', 'STAGING_KNOWN_HOSTS')


def arguments(host, user, key, known_hosts, expected):
    if not re.fullmatch('[A-Za-z0-9][A-Za-z0-9.-]{0,252}', host):
        raise ValueError('Unsupported host')
    if not re.fullmatch('[a-z_][a-z0-9_-]{0,31}', user):
        raise ValueError('Unsupported account')
    if not re.fullmatch('[0-9a-f]{40}', expected):
        raise ValueError('Full SHA required')
    # Read only the reviewed code frame; leave stdin open for connection liveness.
    size = HELPER.stat().st_size
    command = '/usr/bin/python3 -I -B -c \'import sys; exec(compile(sys.stdin.buffer.read(' + str(size) + '), "<hp93>", "exec"))\' --expected-sha ' + expected
    return ['ssh', '-F', '/dev/null', '-T', '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes',
            '-o', 'IdentityAgent=none', '-o', 'StrictHostKeyChecking=yes',
            '-o', 'UserKnownHostsFile=' + str(known_hosts), '-o', 'GlobalKnownHostsFile=/dev/null',
            '-o', 'ForwardAgent=no', '-o', 'ClearAllForwardings=yes', '-o', 'ProxyCommand=none',
            '-o', 'ConnectTimeout=20', '-o', 'ServerAliveInterval=15', '-o', 'ServerAliveCountMax=3',
            '-i', str(key), user + '@' + host, command]


def deliver(expected):
    # Runner only. The workflow must approve exact SHA BEFORE granting secrets.
    if sys.platform != 'linux' or os.environ.get('HP93_APPROVED_HEAD') != expected:
        raise ValueError('Operator activation not approved')
    values = {name: os.environ[name] for name in SECRETS}
    if not all(values.values()):
        raise ValueError('Missing connection prerequisite')
    environment = {name: value for name, value in os.environ.items()
                   if name not in (*SECRETS, 'SSH_AUTH_SOCK', 'SSH_AGENT_PID')}
    with tempfile.TemporaryDirectory(prefix='hp93-ssh-') as private:
        directory = Path(private)
        os.chmod(directory, 0o700)
        key, pins = directory / 'key', directory / 'known_hosts'
        for path, data in ((key, values['VPS_SSH_KEY']), (pins, values['STAGING_KNOWN_HOSTS'])):
            fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, 'w') as output:
                output.write(data.rstrip() + '\n')
        args = arguments(values['VPS_HOST'], values['VPS_USER'], key, pins, expected)
        # Verify a trusted pin covers THIS endpoint; never keyscan/accept-new.
        match = subprocess.run(['ssh-keygen', '-F', values['VPS_HOST'], '-f', str(pins)],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=environment, timeout=20)
        if match.returncode:
            raise ValueError('Pinned endpoint absent')
        # -I -B and stdin exec avoid remote imports from cwd and bytecode writes.
        payload = HELPER.read_bytes()
        with subprocess.Popen(args, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                              stderr=subprocess.DEVNULL, env=environment) as process:
            try:
                process.stdin.write(payload)
                process.stdin.flush()
                deadline = time.monotonic() + 7200
                while process.poll() is None:
                    try:
                        process.stdin.write(b'\n')
                        process.stdin.flush()
                    except BrokenPipeError:
                        process.wait(timeout=10)
                        break  # Judge the bounded exact PASS response below.
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        raise TimeoutError('Unverified remote completion')
                    try:
                        process.wait(timeout=min(5, remaining))
                    except subprocess.TimeoutExpired:
                        continue
                response = process.stdout.read(4096)
                returncode = process.returncode
            finally:
                if process.poll() is None:
                    process.kill()  # SSH EOF cancels remote supervisor; marker survives.
                    process.wait(timeout=10)
        expected_response = '{"status": "PASS", "commit": "' + expected + '"}'
        if returncode or response.decode().strip() != expected_response:
            raise ValueError('Unverified transaction completion')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--expected-sha', required=True)
    args = parser.parse_args()
    try:
        deliver(args.expected_sha)
    except Exception:
        print('BLOCKED: frontend staging SSH transaction not verified.', file=sys.stderr)
        return 1
    print('PASS: frontend staging transaction verified.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
