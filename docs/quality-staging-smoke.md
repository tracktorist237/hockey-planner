# HP-75: frontend post-deploy verification

Status until remote verification: **READY FOR REMOTE VALIDATION**, not Done.

`validation -> deploy -> smoke` is mandatory on trusted develop pushes. A failed
install is TEST INFRA FAILURE; a failed SSH deploy is DEPLOY FAILURE; smoke
distinguishes POST-DEPLOY HEALTH FAILURE and ENVIRONMENT STATE FAILURE. No smoke
secrets are used by PR validation. The existing HP-73 isolated write suite remains
mandatory, separate from this anonymous, GET-only staging browser project.

## Identity and publication

`npm run build` writes ignored `build/build-meta.json` with full git commit,
environment and SHA-256 of the main JS asset. Staging supplies `REACT_APP_COMMIT`
and `REACT_APP_DEPLOY_ENV=Staging`; local builds default to Local. VERSION semantics
are unchanged. The smoke checks metadata, HTML script reference and actual JS hash.
This catches a new metadata marker paired with stale HTML/assets.

Static publication preserves the existing build-directory inode (nginx bind mount)
and old hashed assets. It does not restart the shared nginx or access production.
Operator must confirm the staging nginx mount points at this directory before the
first remote run. Retained hashed assets need eventual bounded maintenance; HP-75
does not add remote cleanup or broad permissions.

## Read-only browser

`playwright.staging.config.ts`: one Desktop Chromium project, fresh anonymous
context, blocked service workers, no business API and no writes. Checks login
controls, loaded JS, public health/version, pageerror and AppErrorBoundary. No test
account, credentials, cookies or storageState. This is boot smoke, not offline/PWA
or authenticated business-flow coverage.

Raw traces stay in an ephemeral temp directory. Sanitizer exports only action
structure, safe URL paths, response status and timings. Bodies, headers, cookies,
DOM snapshots, resources, console and error text are discarded. Screenshots are
restricted to the known login form (inputs/errors masked) or ErrorBoundary heading;
arbitrary reverse-proxy HTML is never captured. Only sanitized-marker artifacts
are uploaded, with seven-day retention. No raw runner stdout is uploaded.

Local proof (no staging network):

```sh
python -m unittest discover -s scripts/quality -p 'test_*.py'
npm run build
node scripts/staging/test-local.cjs --production-build
```

The browser proof injects ErrorBoundary, thrown JS error and unhealthy health;
each must fail. The real production bundle must boot. Full HP-73 E2E still runs
against the real local backend/PostgreSQL independently.

## Shared gate and first remote validation

The common stdlib orchestrator and strict wrapper JSON v1 contract are in backend
`scripts/staging/smoke.py` and `docs/quality-staging-smoke.md`. Frontend checks its
own expected SHA only. Backend SHA is observed, never compared to frontend SHA;
migrations are resolved from that observed backend commit. Both HP-75 companion
commits must be available before smoke can work; missing companion tooling fails
closed rather than skipping checks.

After separate authorization only:

1. Operator confirms/adopts backend's narrow wrapper contract, pinned host key,
   staging bind mount and environment secrets. No broad sudo or deploy key for smoke.
2. Publish the paired quality branches through the agreed integration process;
   do not accidentally push develop until staging auto-deploy is authorized.
3. In both repos configure protected `staging-smoke` environment with
   `STAGING_DIAGNOSTIC_HOST`, `STAGING_DIAGNOSTIC_KEY`, `STAGING_KNOWN_HOSTS`.
   Key belongs only to restricted `codex`; known_hosts comes from a trusted channel.
4. Authorize develop deployment, inspect validation -> deploy -> smoke for each
   repo. Verify each own SHA, summary, migration count and queue. Do not compare
   the two repo SHAs to one another.
5. Inspect sanitized failure artifacts if red; do not broaden permissions or
   mutate staging from smoke. Only after remote success may HP-75 be Done.

No remote Actions/deploy verification has been claimed by the local tests.
