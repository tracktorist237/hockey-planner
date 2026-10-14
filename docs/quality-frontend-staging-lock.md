# HP-93 frontend staging admission and recovery

This is code/CI/documentation preparation only. **The current VPS has NOT been
verified or provisioned for this protocol. No VPS access or staging deployment
was performed.** Human merge/activation requires separately approved operator
preflight. HP-93 and HP-92 must not be marked Done on implementation evidence.

## Shared protocol and compatibility

All staging writers, including frontend, backend, maintenance and recovery, must
use these existing paths under the same deployment account:

* Lock: `/var/lib/hockeyplanner-staging/deploy/deploy.lock`
* Barrier: `/var/lib/hockeyplanner-staging/deploy/recovery-required`

The lock parent is deployment-owned 0700; the single-link regular lock file is
deployment-owned 0600. Ancestors must be real directories owned by root or that
account, without group/other write access. Symlink components, missing paths,
unsafe modes/owners and inode replacements block. This program opens the lock
read-only without O_CREAT, validates its identity before/after nonblocking
exclusive flock, and revalidates lock/parent throughout the transaction. It
never creates, truncates, replaces, unlinks or explicitly unlocks deploy.lock.

After acquiring flock, any recovery-required directory entry blocks, including
a dangling symlink. It is never overwritten or automatically removed by a new
transaction. Before git fetch or any source/temp/build/publication mutation,
the supervisor creates its own marker with O_EXCL/O_NOFOLLOW, enforces 0600,
writes public SHA/PID/protocol metadata, fsyncs the file and protected parent.
Only then can it create its private 0700 frontend-* directory and run commands.
PID metadata is a recovery hint, never evidence of quiescence or process identity.

This uses the admission semantics in backend
[PR #22](https://github.com/tracktorist237/HockeyPlanner.Backend/pull/22),
[PR #25](https://github.com/tracktorist237/HockeyPlanner.Backend/pull/25) and the
[operator runbook at f8a0270](https://github.com/tracktorist237/HockeyPlanner.Backend/blob/f8a027094e39ec7c1f9dc1c49ed61384f895986e/docs/operations/imagesharp-staging-operator.md).
The marker's contents need not match: backend admission rejects any entry, not
a frontend-specific JSON format. A writer using only flock without checking the
barrier is incompatible. All writers must retain barriers on unknown outcomes.
Backend helpers are not imported, invoked or assumed installed on the VPS.

## Bootstrap, supervision and completion

The develop workflow retains validation → deploy → HP-75 smoke ordering. PR
quality CI and task pushes have no deployment route or staging secrets. Before
granting connection secrets to the deploy step, an operator-controlled repository
variable `HP93_APPROVED_HEAD` must equal the exact develop source SHA. The same
check is enforced by the runner helper. This implementation does not set that
variable, configure environments or change existing secrets.

The runner checks out that exact SHA and streams the standalone Python supervisor
over pinned SSH. Bootstrap uses `/usr/bin/python3 -I -B`, reads a bounded code
frame in memory and performs no remote file creation, helper download or git
fetch. `STAGING_KNOWN_HOSTS` must already contain a trusted pin for VPS_HOST;
host checking is strict, with no keyscan/config/agent/proxy/forwarding fallback.
Credentials remain in private runner-temporary files and are removed from child
environments; child output and exception details are withheld from diagnostics.

The runner leaves stdin open and sends heartbeats every five seconds. Remote EOF,
invalid heartbeat input or 90 seconds without a heartbeat requests cancellation.
This covers SSH parent loss even when sshd does not deliver SIGHUP. A two-hour
runner deadline closes the connection; each remote command also has a 30-minute
deadline. No failure is treated as deployment success. Loss after a fully committed
transaction may leave a caller reporting BLOCKED although the remote completed;
the caller must not infer permission to recover or retry from its own status.

The dedicated Linux process requires `/proc`, subreaper prctl, pidfd_open,
pidfd_send_signal, and symlink-safe fd-based rmtree before mutation. Commands use
separate sessions and inherit the same lock open-file description. A successful
leader is insufficient: process-group and adopted-child checks must show no
survivors. On failure/cancellation the supervisor kills process groups, kills
and reaps adopted descendants through pidfds, and bounds teardown. A surviving
setsid/FD-closing descendant is never considered successful completion.

SIGKILL cannot execute cleanup. Inherited descriptors continue holding flock;
even if a child closes them or the supervisor dies, the durable marker prevents
another cooperating writer's admission. Exceptional teardown never removes a
barrier, including a determinate build failure. There is no automatic recovery.
The model requires trusted source/tooling and cooperating writers: arbitrary
privileged changes, delegated asynchronous external services, or malicious code
that disables the protocol are outside its protection.

## Frontend build and publication

The lock covers git fetch, exact-SHA commit verification, immutable git archive,
tar export, npm ci, version:sync in that export only, frontend build, publication,
postconditions and cleanup. The existing dirty/generated checkout is preserved.
Tracked VERSION is unchanged. Build variables retain `/api`, VERSION, UTC build
time, REACT_APP_COMMIT and Staging environment metadata. No public URL changes.

The existing `/opt/hockeyplanner-staging/frontend/build` directory must already
exist and pass path protection; it is never replaced. Old hashed assets remain.
New hashed assets are published first, index.html last. Each file is privately
copied, hashed, fsynced, then replaced in its existing parent; directories are
fsynced. **Multiple file replacements are not an atomic site publication.**
Readers may observe mixed metadata/manifests/service-worker files during the
operation. Failure after any publication leaves the barrier and requires operator
inspection; no automatic rollback or claim of an unchanged site is made.

Completion verifies every expected published file hash, build-meta exact SHA /
Staging identity / main bundle hash, and the original destination directory inode.
Only after commands and descendants have ended does it remove the private export,
verify removal, fsync the parent, and recheck lock/marker identity and quiescence.
It then removes only its own marker and fsyncs the protected parent. A failure
of that final durability check attempts exclusive barrier re-creation while the
lock is held. If filesystem durability itself is unavailable, admission and
recovery must remain an operator decision; no program can promise persistence
after storage failure.

## Operator activation prerequisites — all unverified

Before approving a develop SHA, the owner must independently confirm:

1. Existing protected lock directory, stable lock inode, owners, modes, ancestor
   protection, local filesystem flock/fsync semantics and no competing lock paths.
2. Reviewed backend participation, reviewed frontend participation, and **every**
   other staging writer using the same exclusive flock + barrier protocol.
3. Trusted Linux/Python runtime with the above kernel capabilities, stock git/tar,
   compatible Node/npm (CI uses Node20/Python3.12), sufficient private build space,
   and public static file/directory permissions compatible with existing nginx.
4. Existing frontend source and publication paths, immutable source/build metadata,
   current container/project and bind-mount identity, and an approved procedure
   for non-atomic static publication. No container restart is introduced here.
5. A trusted existing SSH host pin covering the deployment endpoint, an appropriate
   existing account/key, and trusted sshd/session/shell startup hooks that cannot
   mutate staging before Python admission. Require exact-head independent review
   and green mandatory CI.
6. Authorized recovery ownership and process/filesystem/daemon quiescence evidence;
   HP-92's separate runtime/container/Init/image-delivery prerequisites still apply.

No automatic provisioning, permission repair, lock replacement, container identity
reconciliation or environment/secret configuration is provided. Setting the SHA
variable is authorization following these checks, not proof generated by this code.

## Exceptional recovery — separate operator authorization

Stop new writers. Acquire the SAME exclusive lock without changing its inode and
keep the existing marker. A busy flock is not permission to unlink the lock.
Independently prove the old supervisor and all descendants/escaped groups have
ended; do not rely on a recorded PID or vanished SSH session. If a backend operation
may be involved, also establish Docker daemon/build/load/Compose quiescence using
the backend runbook: killing a CLI is insufficient evidence.

Inspect actual source/build/publication/container identity and retained private
frontend-* directories and .hp93-* publication files. Any mixed site, unexpected
state or uncertain cleanup needs separately approved reconciliation. Validate
non-symlink absolute cleanup paths/ownership and confine them to their intended
roots. Only after verified quiescence and approved cleanup/reconciliation may the
operator remove the verified recovery marker and fsync its parent, still under
the same lock. Never delete or recreate deploy.lock. Record sanitized evidence.

## Evidence and rollback

Linux tests use protected temporary home directories and real flock, fsync,
subprocesses, signals, git archive, tar and file publication. npm's output is a
synthetic fixture; the full Jest/build/isolated Playwright checks separately verify
the real frontend. HP-75 local smoke uses loopback fixtures only. None establishes
VPS readiness. Exact-head CI and independent review belong in the Draft PR/handoff.

Before activation, a reviewed revert removes this code without a VPS rollback.
After activation, never revert to an uncooperating writer while another writer
relies on shared admission; disable operator authorization and review protocol
compatibility first. Actual recovery/rollback is separately authorized operator work.

Lifetime references: [Linux flock](https://man7.org/linux/man-pages/man2/flock.2.html),
[Linux subreaper](https://man7.org/linux/man-pages/man2/PR_SET_CHILD_SUBREAPER.2const.html),
[Python subprocess](https://docs.python.org/3/library/subprocess.html).
