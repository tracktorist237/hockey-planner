# HP-73 full-stack browser gate

Requires Node 20+, .NET 10 SDK, Python 3, Docker and the paired backend branch
with `tests/HockeyPlanner.Backend.E2EHost`. No staging/production URL is accepted.

```powershell
npm ci
npx playwright install chromium webkit
$env:HP_E2E_BACKEND = 'C:\Users\Sergey\source\repos\HockeyPlanner.Backend'
npm run e2e
npm run e2e:report
```

Linux CI installs browser system dependencies with `--with-deps`. Backend path
defaults to `~/source/repos/HockeyPlanner.Backend`; CI points it at the paired
checkout. `HP_E2E_SKIP_BUILD=1` is only for a production build just made with
`REACT_APP_API_BASE='/api'`. Ordinary `npm run e2e` rebuilds automatically.

## Isolation and lifetime

The runner starts a test-only .NET executable, a randomly named PostgreSQL 16
Testcontainer, the entire real migration chain and real WebAPI on loopback
Kestrel. A loopback static server serves the optimized CRA build and proxies
`/api`. Ports and JWT signing key are fresh for each run. Auth is never disabled.
The runner reads the Docker daemon API version rather than pinning the workstation's
Docker version into the Linux CI environment.
All users, teams, memberships and events are created through ordinary API calls.
Usernames and passwords are random and belong only to the disposable database.

The test host is not referenced by the production project, contains no test HTTP
endpoints and removes unattended hosted services only from its own test factory.
Notification enqueue and in-app storage remain real; external push/email and
league scraping are not part of this browser gate. Parent stdin EOF tears down
host/container; Testcontainers resource reaper is the crash fallback.

## Eleven journeys, three projects

Every journey runs on desktop Chromium, Pixel 7 Chromium and iPhone 13 WebKit.
All are mandatory in the existing reusable frontend validation/deploy gate.
No automatic retries mask flakes; a single worker limits resource use.

- Login / authenticated production boot.
- Genuinely expired, correctly signed local JWT: server rejects it, normal refresh
  rotates the real token before the AllowAnonymous events request.
- Rejected refresh: one attempt, controlled login, no infinite loop.
- Real API event creation -> browser list -> event details.
- Confirmed / cancel / Declined attendance and persisted reload.
- HP-70 real ProblemDetails 409 -> dates/render -> cancel -> confirm, including
  two same-task clicks and verification of exactly one force request.
- Real 409 response held at the browser boundary -> same-document browser back
  -> late response cannot open a dialog or mutate the new event.
- Real transfer preview -> explicit delete choice -> persisted target attendance.
- Another admin removes a member after preview: stale override gets real 400,
  human message and no partial transfer. No mocked error payload.
- Event publication -> another member's in-app notification -> event navigation.
- Production build/service-worker activation/reload with real API.

Only deterministic race tests intercept HTTP; they call the real backend with
`route.fetch()` and hold its unmodified response. Normal journeys do not mock API.
Core tests block service workers so interception is reliable; the dedicated PWA
journey enables them. No arbitrary UI sleeps; auth expiry is a test-process JWT
fixture signed by the ephemeral test key, not a production TTL/config change.

## Diagnostics and security

Unexpected `pageerror`, AppErrorBoundary or Invalid Date fail the test. Expected
HTTP errors may produce console noise; console.error is not blanket-fatal.
Failure-only screenshots and retain-on-failure traces feed the HTML report.
Video is disabled. No storageState files are generated.

Always run through the npm wrapper, not bare `playwright test`: after Playwright
exits it scrubs credentials collected from real auth responses, generated passwords
and JWTs from ZIP/text/embedded report archives. Raw outputs are gitignored.
CI uploads only reports carrying the sanitizer success marker, with 7-day retention.
Disposable credentials are still secrets: do not upload raw intermediate outputs.

The negative control temporarily injected a browser RangeError of the HP-70
failure class after real login. The shared runtime guard failed the otherwise
successful journey and retained diagnostics. The deliberate throw was removed
before committing; no failure injection is active in the committed suite.
Actual OS push/device behavior and full offline upgrades remain manual smoke.

## Local verification

All 11 journeys passed on all three projects (33 executions, approximately two
minutes excluding build/startup). The temporary RangeError control failed specifically
at the runtime guard; its trace contained credential redactions and no raw JWTs.
Artifact regression tests also cover JSON-escaped refresh tokens and nested trace
payloads. The normal suite must be green again after running the negative control.

WebKit reported a cancelled same-origin table-protocol GET as an access-control
pageerror when persistence reload interrupted post-attendance loading. That journey
waits for pending API requests and React frames before reload; no pageerror is excluded. The separate
stale-conflict journey still navigates while its real request is deliberately held.

CI requires both paired HP-73 commits to be available on the selected branch (or
later on develop). Missing test-host infrastructure fails the gate, never silently
falls back to a shared server. GitHub CI itself is not exercised by a local run.
