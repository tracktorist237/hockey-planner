# Contributing to HockeyPlanner frontend

## Canonical workflow

1. Identify the issue, approved scope and explicit non-goals.
2. Start from clean, current develop and create `<type>/<issue>-short-description`,
   for example `quality/hp-76-pr-workflow` or `fix/hp-70-attendance-conflict`.
   Reuse an already prepared task branch without discarding its history. A task
   request under this process authorizes its branch; do not switch over unknown
   local changes. Read-only reviews need no new branch.
3. Make a small complete change only in that branch; preserve unrelated behavior.
4. Run local checks and self-review the complete diff.
5. Commit and push the task branch, never force-push.
6. Open a **Draft PR to develop** using the PR template.
7. Wait for mandatory PR CI to pass. Failed CI cannot be bypassed.
8. Request independent review from a **new Codex session or separate review
   agent**, not the implementation session.
9. Author fixes findings in the task branch and records their resolution.
10. Require green CI and independent `APPROVE` evidence for the final head SHA.
    Any new commits require re-review, not reuse of the previous head approval.
11. A human decides whether to mark ready and merge after checking review,
    resolved conversations and actual develop protection. Codex does not merge
    as part of implementation/review.
12. Require develop validation after merge.
13. Wait for staging deployment, dependent on validation.
14. Require HP-75 post-deploy smoke and record any remaining manual checks.
15. Only then mark the issue Done. Do not start adjacent work automatically.

Master, production, VERSION and release policy are outside this workflow's
authorization. HP-76 itself follows this full process despite being docs-only.

## Substantial changes and exceptions

Substantial work includes runtime/business code, API contracts, auth/security,
DB/migrations, background jobs, concurrency/idempotency/retries, notifications,
integrations, dependencies, CI/CD, infrastructure, cross-cutting refactors and
non-trivial test architecture. Direct substantial pushes to develop are
prohibited by default.

Only explicitly named typo/docs-only corrections, obvious mechanical metadata
corrections, or emergency hotfixes explicitly authorized by Sergey qualify as
narrow exceptions. Record the scope and authorization in the issue/PR. They
cannot bypass failing CI or repository protection, nor change master/release
policy. Emergency work needs retrospective independent review and tests.

## Independent review and handoff

Author handoff: issue, scope/non-goals, base/head SHAs, changed files, API/DB/config
impact, test commands/results, known warnings, risks and rollback. No secrets.

Reviewer must independently verify base/head SHAs and inspect the complete diff,
affected production code, tests and workflows. Do not trust only the author's
summary or passing tests. Assess correctness, security, contracts,
database/migrations, concurrency/races, idempotency/retries, test quality/flakiness
and CI/deploy safety. Explain N/A dimensions; report actionable findings with
severity, file/line evidence and impact.

Record exactly one verdict, with no score/ranking:

- `APPROVE`
- `CHANGES REQUIRED`
- `BLOCKED / NEEDS HUMAN DECISION`

The PR must link the separate reviewer session/report and identify reviewed head
SHA and verdict. A draft can say review is pending, but self-review is never
independent approval. This evidence is procedural, not a fabricated required
status check or a second human GitHub approval.

## Local verification and contracts

For runtime changes run focused tests, full Jest and production build:

```text
npm test -- --watchAll=false --runInBand
npm run build
git diff --check
```

For critical browser journeys or validation changes also run `npm run e2e:ci`;
see [isolated Playwright setup](e2e/README.md). Never run write-heavy tests on
shared staging or production. For API/parser changes use the actual backend
serialized contract and [contract tests](docs/quality-contracts.md), including
negative/malformed cases; do not hand-edit generated fixtures to hide drift.
Coordinate cross-repository contract PRs and declare compatibility explicitly.

For workflow/helper changes run
`python -m unittest discover -s scripts/quality -p "test_*.py"` and relevant
[HP-75 local smoke tests](docs/quality-staging-smoke.md). Test trigger/dependency
and secret-isolation behavior, not meaningless YAML snapshots.

Docs-only local checks can be limited to link/rule consistency, relevant
governance/workflow tests and diff checks, with omissions justified in the PR.
Follow stricter issue-specific requirements. Mandatory remote CI still runs the
complete quality gate; local risk-based selection never exempts it. Report
commands, counts, skipped checks and existing warnings truthfully.

## Develop protection: operator setup

Actual required Actions check: **`validation / Frontend quality gate`** from
`github-actions`, emitted by `frontend-pr-checks.yml` -> `validate.yml`.
Do not use a guessed workflow title as the status context.

If admin API/CLI credentials are unavailable, do not work around access. Report
`READY FOR OPERATOR SETTINGS` and ask Sergey to perform these exact steps:

1. Repository **Settings -> Branches**: inspect existing protections/rulesets;
   edit the matching rule or choose **Add classic branch protection rule**.
   Pattern: exactly `develop`. Do not edit master rules.
2. Enable **Require a pull request before merging**. Leave **Require approvals**
   unchecked so a second human reviewer does not block solo development.
3. Enable **Require status checks to pass before merging**; select
   `validation / Frontend quality gate` from GitHub Actions. Enable **Require
   branches to be up to date before merging**. If missing, wait for the real
   PR check to publish; never substitute a made-up context.
4. Enable **Require conversation resolution before merging** and **Do not allow
   bypassing the above settings**. Do not add PR bypass actors.
5. Keep **Allow force pushes** and **Allow deletions** unchecked. Save and reopen
   the rule to verify its exact develop-only scope and settings.
6. Verify the check is required on a real PR and record evidence. Codex review
   evidence is checked by the human merger, not a second human approval count.

An existing ruleset can enforce equivalent controls; avoid overlapping conflicting
rules. These docs and the template do not enable GitHub protection themselves.

## Workflow safety

PR validation uses `pull_request`, read-only contents permissions, no staging
environment and no staging secrets. Never introduce `pull_request_target` to
execute untrusted code with privileged credentials. Task branch pushes do not
deploy. Develop pushes run validation -> deploy (`needs: validation`) -> HP-75
smoke (`needs: deploy`), with protected `staging-smoke` diagnostics secrets.
Both prerequisites must succeed; do not bypass them with `always()`.

Each repository's smoke checks its own SHA, not the other repository's SHA.
See [staging smoke](docs/quality-staging-smoke.md). Master/production workflow
semantics are unchanged. A green PR alone does not prove a deployment or make
the issue Done.
