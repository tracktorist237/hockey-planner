# HP-95 automatic frontend staging

Implementation is **DISABLED / READY FOR SEPARATE OWNER SETTINGS**, not activation
or post-merge proof. No GitHub settings, secrets, VPS state or backend code were
changed. Independent review is separate; this implementation cannot approve itself.

## Delivery flow and trust boundary

Previously every develop SHA required `HP93_APPROVED_HEAD`, then environment
review for deploy and again for smoke. After the one-time cutover below:

`Draft PR → PR validation + security → independent exact-head review → human merge`

`develop push → validation → admission (wait for exact-SHA security) → deploy → real HP-75 smoke`

Human merge is the only recurring manual delivery action. Independent Codex
review remains part of implementation/review, not another owner approval button.
There is no dispatch, workflow-run deployment trigger, approval bot, new status
check, broad token, new key or separate recurring release authorization.

Only the exact repository `tracktorist237/hockey-planner` (ID 1146646574), a
non-forced existing protected develop push, and owner `tracktorist237` (User ID
74918383) as sender/actor/merger are admitted. Owner reruns may only replay the
same eligible push; rerunning all jobs is required if attempt-specific validation
evidence is absent. No task/fork/PR/master/dispatch event can deploy.

The source must be a verified GitHub web-flow signed **merge commit**, with exactly
two parents: push `before`, and the merged PR's reviewed head. Its unique associated
closed, merged, non-draft PR must target canonical develop, originate in the same
repository, and identify this exact merge SHA and base. Squash and rebase merges
fail closed. Use GitHub **Create a merge commit** for automatic staging; this does
not change repository merge settings. A direct push or unrelated PR is rejected.

The PR body must contain exactly one complete line, outside example code blocks:

```text
Independent-Review: APPROVE <full-40-character-PR-head-SHA> <https-report-or-session-URL>
```

Add it only after the separate reviewer has actually approved that head, using
the real report/session URL. New commits require re-review and replacement of
the line. Pending/failed/stale/duplicate evidence blocks admission. The line is
machine-readable **procedural evidence**, not authenticated proof of a separate
agent, a GitHub review submission or an enforced GitHub approval count. The human
merger must read the report, verify independent provenance and exact head, and
resolve findings. A forged assertion by the trusted owner/author cannot be detected
by parsing text. This is the existing human merge trust boundary, explicitly retained.

Admission uses only the job's read-only `GITHUB_TOKEN`: contents, Actions and PR
reads. It verifies both the Actions protected-ref context and live branch API:
current exact SHA, protection enabled, quality gate required from GitHub Actions
(app 15368), enforced for everyone. Actual admin-only PR/bypass/strict/conversation
and environment settings are verified once by the owner, not claimed verified by
the limited runtime token. Do not activate on UNKNOWN or weakened configuration.

It also requires:

* The current deploy workflow run/attempt and source identity match exactly; its
  validation job completed successfully for the source SHA.
* The newest PR validation and security workflow runs for the reviewed PR head
  succeeded before merge. Workflow paths, events, branches, canonical repository,
  run IDs, attempt-specific jobs, SHA and completion times must match.
* The newest develop **push** security run for the source SHA succeeded, including
  `Deterministic dependency audit` and `CodeQL`. Scheduled/dispatched scans and an
  older green run/attempt cannot substitute. Absent/pending push security is polled
  for at most 40 minutes; errors, skipped/cancelled/failed results block immediately.
* Develop still points to the admitted SHA after evidence collection. Queued stale
  runs cannot roll back a newer develop source. If merges arrive during an admitted
  transaction, the workflow concurrency queue serializes subsequent frontend runs.

Validation and security checkout immutable `github.sha`; build/publication metadata
and smoke use the same source SHA. No PR artifact or mutable branch build is
deployed. The existing VPS supervisor still exports/builds that SHA under the lock;
this is source-bound validation, not a claim of byte-identical CI/VPS builds.

Admission runs without an environment or staging secrets, again before the final
SSH step, and inside the transport before reading credentials. No passed receipt,
`HP93_APPROVED_HEAD` or caller-populated SHA can replace verification. Only the last
deploy step binds existing VPS credentials and the environment's trusted host pin.
GitHub releases environment secrets before job steps; step bindings restrict their
process exposure, not GitHub's environment-release semantics. No secret inheritance
is added to reusable/PR validation. The job token is removed from SSH child env.

The pinned backend smoke helper is
`662df5e4c03902df821385c50c424072a985c0a5`; it observes the backend's deployed SHA
for migration diagnostics without comparing it with the frontend SHA. Fetching
backend migration metadata does not execute newer helper code. HP-75 browser and
wrapper checks, sanitized artifacts and seven-day retention remain mandatory.

## Verified settings snapshot (read-only, 2026-11-27)

Source develop: `fae1b5aa8a38123c28ac1cbed4ece5c640c5a6b1`.
Prior real deploy/smoke: [run 41671065524, attempt 2](https://github.com/tracktorist237/hockey-planner/actions/runs/41671065524).

| Setting | Observed value |
| --- | --- |
| Classic develop protection | enabled; admins enforced |
| PR required / approving reviews | required / 0 (independent review is procedural) |
| Required status | `validation / Frontend quality gate`, app 15368; strict/up-to-date |
| Conversation resolution | required |
| PR bypass allowances | none returned |
| Force pushes / deletions | false / false |
| Repository rulesets | empty list |
| `staging-smoke` reviewers | owner required; prevent-self-review false |
| Environment admin bypass | false |
| Environment deployment policy | custom branch policy: branch `develop` only, no tags |
| Environment variables | none |
| Environment secret names | STAGING_DIAGNOSTIC_HOST, STAGING_DIAGNOSTIC_KEY, STAGING_KNOWN_HOSTS |
| Repository activation | HP95_STAGING_AUTODEPLOY absent; HP93_APPROVED_HEAD still contains baseline SHA |
| Backend legacy staging workflow | `disabled_manually` |

Read via authenticated `gh api` branch, protection, rulesets, environment,
deployment-branch-policies, variable and secret-name endpoints; no secret values
were read. The connector does not expose all settings APIs, so CLI read access was
used. Credential values, effective VPS account permissions, host state and future
settings drift are **UNKNOWN** in this implementation session. Recheck before
cutover; the table is evidence of inspection, not a configuration mechanism.

## One-time owner cutover — requires separate explicit authorization

Do not execute this procedure merely because HP-95 is merged. Keep the activation
variable absent while HP-95 goes through final exact-head CI, independent review,
and human merge. The merged HP-95 workflow validates but skips admission/deploy/
smoke when disabled. No per-SHA gate needs to be filled to merge this implementation.

1. Review this admission model and its merge-commit/owner restrictions. Confirm
   the independent review line has genuine final-head evidence and all mandatory
   PR CI/security are green. Re-read the live endpoints:

   ```text
   gh api repos/tracktorist237/hockey-planner/branches/develop/protection
   gh api repos/tracktorist237/hockey-planner/rulesets
   gh api repos/tracktorist237/hockey-planner/environments/staging-smoke
   gh api repos/tracktorist237/hockey-planner/environments/staging-smoke/deployment-branch-policies
   gh api repos/tracktorist237/hockey-planner/actions/variables
   gh api repos/tracktorist237/hockey-planner/environments/staging-smoke/variables
   gh api repos/tracktorist237/HockeyPlanner.Backend/actions/workflows
   ```

2. Retain the develop protections above: PR required, 0 human approvals, strict
   required quality gate from app 15368, conversations resolved, admins enforced,
   no bypass actors, force pushes or deletions. Do not weaken security scans.
   Recheck the existing HP-93 operator prerequisites and actual host/writer state
   using separately authorized evidence. Keep the old backend staging writer
   disabled until HP-92's separately authorized cutover. Never enable it here.
3. Confirm the existing deployment credential endpoint matches the environment's
   trusted SSH pin, fixed staging paths and restricted intended account. Preserve
   diagnostic credentials separately. Existing VPS_* bindings are inherited from
   repository secrets; their values/privileges cannot be established from names.
   Do not broaden or rotate credentials as a shortcut. Any necessary secret change
   also needs separate authorization. Never print values or put host pins in vars.
4. After explicit settings authorization, repository **Settings → Environments →
   staging-smoke**: remove **Required reviewers** for this environment, and ensure
   no wait timer/custom approval rule remains. Retain custom deployment branches:
   exactly branch `develop`, no wildcard or tag rules. Preserve environment secret
   values and admin-bypass prohibition where supported by GitHub. Reopen/read back
   the policy. Do not create another approval environment or change production.
   These changes remove recurring approval from both deploy and smoke.
5. Confirm there is no same-named environment/org variable overriding the repository
   switch and no active/queued/waiting legacy staging run. Cancel obsolete runs
   safely before activation; a cancellation with uncertain remote state requires
   HP-93 recovery, never removal of the lock/barrier to continue.
6. As the **last** one-time settings action, repository **Settings → Secrets and
   variables → Actions → Variables**: create `HP95_STAGING_AUTODEPLOY` with exact
   value `protected-develop-merged-pr-v1`. This revocable value asserts that the
   owner verified this runbook's settings and runtime prerequisites; do not set it
   speculatively. Missing/empty/other values disable admission. Remove obsolete
   `HP93_APPROVED_HEAD` only as part of the separately authorized cleanup; HP-95
   does not read it. Do not enable automatic deployment with unverified settings.
7. The next normally reviewed human merge using **Create a merge commit** triggers
   validation, security, admission, deploy and real smoke without further buttons.
   No manual dispatch or backfill/replay is needed for normal delivery. Observe
   that first automatic run and record exact source SHA, run URLs, transaction PASS
   and sanitized HP-75 PASS. A green implementation PR is not this acceptance proof.
   Keep HP-95 open until that later, separately authorized verification completes.

## Stop, recovery and rollback

Set `HP95_STAGING_AUTODEPLOY` to `disabled` or delete it to stop future admissions.
Variables are job/run snapshots, so this cannot revoke an already admitted process.
Also disable the frontend staging workflow and cancel queued/waiting/in-progress
runs when immediate containment is needed, under owner authority. Cancellation
retains HP-93's durable barrier on uncertain outcomes. A pending smoke may finish
read-only diagnostics; disabling the switch is not a filesystem rollback.

Never automatically retry a failed SSH deployment, clear `recovery-required`,
replace `deploy.lock`, repair permissions, restart containers or roll back files.
Use the [HP-93 exceptional recovery procedure](quality-frontend-staging-lock.md#exceptional-recovery--separate-operator-authorization):
same stable inode/flock, proven descendant/daemon quiescence, actual publication
inspection, approved reconciliation and durable barrier handling.

Before activation a reviewed code revert has no VPS impact. After activation,
disable admissions first. A normal application rollback is a reviewed revert PR,
exact-head review, green CI and human merge; it then follows the same automatic
flow. A pipeline rollback additionally requires review of shared-protocol
compatibility and separate authorization to restore old environment/SHA gates;
never reactivate an uncooperating writer. Failed smoke leaves the published site
for investigation, not an automatic unverified rollback.

GitHub semantics: [contexts](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts),
[workflow runs](https://docs.github.com/en/rest/actions/workflow-runs),
[attempt-specific jobs](https://docs.github.com/en/rest/actions/workflow-jobs),
[merged PR identity](https://docs.github.com/en/rest/pulls/pulls).
