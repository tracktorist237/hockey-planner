# HP-88: temporary braces stack-exhaustion acceptance

Implementation-author investigation, 2026-10-03. Independent review is pending.
Base: `aadcb40aa84f744081d7498a7c0e8b2ab4382e81`.
Branch: `security/hp-88-braces-baseline`. HP-81 is outside this change.

This is a real High advisory, temporarily accepted, **not fixed and not a false
positive**. HP-88 remains In Progress and owns durable remediation. No runtime,
dependency, audit-normalization, workflow, deployment or release changes are made.

## Current official state and remediation decision

[GitHub advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), independently
read from both the page and public advisory API (2026-10-03T20:22:03Z):

- GHSA-vfj7-8cjw-p6xm / CVE-2026-93687, High, affected `<= 3.0.3`.
- Published `2026-09-18T18:31:41Z`, updated `2026-10-02T22:36:34Z`, not withdrawn.
- `first_patched_version: null`. Deeply nested patterns can exhaust recursive
  AST walkers and terminate a Node process with an uncaught RangeError.
- npm registry queries during this assessment: braces latest **3.0.3**, with no
  later published version or alternative patched dist-tag. Micromatch latest
  **4.0.8** still depends on braces `^3.0.3`. React-scripts latest **5.0.1**.
- Latest chokidar 3 is **3.6.0**, still using braces `~3.0.2`. Webpack-dev-server
  4 latest is **4.15.2**, still using chokidar `^3.5.3`. Fast-glob latest **3.3.3**
  still uses micromatch `^4.0.8`.

Reproduce package-state queries with `npm view <package>@latest version
dependencies engines --json`, `npm view braces versions dist-tags --json`,
`npm view chokidar@3 version dependencies --json`, and
`npm view webpack-dev-server@4 version --json`.
Registry evidence: [braces](https://registry.npmjs.org/braces),
[micromatch](https://registry.npmjs.org/micromatch),
[chokidar](https://registry.npmjs.org/chokidar),
[react-scripts](https://registry.npmjs.org/react-scripts),
[webpack-dev-server](https://registry.npmjs.org/webpack-dev-server),
[fast-glob](https://registry.npmjs.org/fast-glob).

No narrow compatible remediation is currently available:

- A braces override cannot select a patched release that does not exist.
  Earlier versions remain in the advisory range. An unreviewed fork/local parser
  patch is not a demonstrated compatible upstream remediation.
- Chokidar 4.0.3 removes its braces dependency but
  [removes glob support](https://github.com/paulmillr/chokidar#upgrading), which
  current chokidar 3 consumers can use. Tailwind's installed watcher passes
  configured content paths to chokidar, and webpack-dev-server supports configured
  watch patterns. Replacing chokidar across these consumers is not a supported
  drop-in contract. It would also leave the micromatch path vulnerable.
- Chokidar 5.0.0 is ESM-only and requires Node >=20.19.0; installed consumers use
  CommonJS `require`, and the local verification runtime is Node 20.11.0.
- Webpack-dev-server latest 6.0.0 requires Node >=22.15.0 and is outside CRA's
  declared `^4.6.0` dependency contract; a major override is not justified.
- Current compatible micromatch/CRA/webpack-dev-server releases already resolve
  to their latest versions. A CRA replacement needs a separate deliberate issue.

## Dependency paths

There is exactly one installed resolution each of braces 3.0.3, chokidar 3.6.0
and micromatch 4.0.8. The only immediate braces parents are:

| Parent | Declared edge | Resolution |
| --- | --- | --- |
| chokidar 3.6.0 | braces `~3.0.2` | braces 3.0.3 |
| micromatch 4.0.8 | braces `^3.0.3` | braces 3.0.3 |

All root paths start at the direct dependency react-scripts 5.0.1. Families:

- webpack-dev-server 4.15.2 -> chokidar, and -> http-proxy-middleware 2.0.9 -> micromatch.
- tailwindcss 3.4.19 -> chokidar/micromatch, and -> fast-glob 3.3.3 -> micromatch.
- react-dev-utils 12.0.1 -> fork-ts-checker-webpack-plugin 6.5.3 -> chokidar,
  and -> globby 11.1.0 -> fast-glob -> micromatch.
- eslint-webpack-plugin 3.2.0 -> micromatch; eslint-config-react-app 7.0.1 ->
  TypeScript ESLint parsers/plugins -> globby -> fast-glob -> micromatch.
- Jest 27.5.1, babel-jest 27.5.1 and jest-watch-typeahead 1.1.0 -> their Jest
  components -> micromatch, including nested Jest message utilities 28.1.3.

The complete reverse adjacency graph below includes every resolved upstream
path, not just selected examples. Dependency and optional-dependency edges were
resolved by looking for `parent/node_modules/name` then walking ancestor
directories to the hoisted resolution. Repeated nodes/cycles are represented
once; following reverse edges from braces reconstructs all paths to ROOT.
Peer declarations are not additional installed edges; all installed package
records and their concrete dependency edges were inspected.

## Production browser and static runtime evidence

`npm run build` succeeded using the exact lockfile. All three executable JS
assets have source maps with source content:

| Asset | Mapped source count |
| --- | --- |
| `static/js/main.56e1949a.js` | 188 |
| `static/js/453.ce295004.chunk.js` | 1 |
| `service-worker.js` | 1 |

All 190 mapped sources were checked for `node_modules/{braces,micromatch,
chokidar,fast-glob,react-scripts,webpack-dev-server,tailwindcss}/`: zero matches.
Positive controls found App.tsx, react-dom and web-vitals. Bundle text checks for
micromatch, chokidar, braceExpand and BRACE_START also found no matches. No direct
source imports of braces, micromatch, chokidar or fast-glob were found across
`src`, public assets, scripts, tests and configuration. This combines actual
artifact evidence with the import/entry-point inspection; the lockfile's npm
production classification alone is not evidence of browser inclusion.

The application and service worker handle API/URL data with application logic,
fetch, URL parsing and string comparisons, not Node glob parsers.
`.github/workflows/deploy-vps.yml` and `deploy-staging-vps.yml` run a Node build
then copy `build` to nginx's static publication directory. `render.yaml` likewise
declares `runtime: static`. There is no frontend Node request runtime in these
deploy definitions. This proves the assessed develop build/deployment path,
not the contents of an independently inspected live production server; no live
production access/deployment was performed.

## Build, CI, tests, staging and local development

| Surface | Pattern origin and reachability |
| --- | --- |
| Production/static build | CRA loads micromatch for ESLint file selection and chokidar through the TS checker. Patterns derive from CRA constants, extensions, tsconfig and repository paths. Tailwind is installed but CRA enables it only if `tailwind.config.js` exists; none exists here. |
| CI | Validation installs the locked tooling and runs tests/build. Security audit installs without lifecycle scripts and parses npm metadata; CodeQL uses no-build mode. No request/API data is transformed into glob configuration. |
| Jest | CRA `createJestConfig.js` supplies fixed test/coverage globs. Package Jest overrides map modules, not externally supplied patterns. CLI options are controlled by developers/checked-in CI. |
| ESLint/fast-glob | ESLint webpack plugin matches source filenames against generated include/exclude globs. TypeScript ESLint globby inputs derive from tsconfig/repository configuration; no server-data downloads feed pattern selection. Python pathlib globs in artifact sanitizers are separate implementations with fixed patterns. |
| Staging | Build-time Node exposure is the same trusted configuration path; published nginx assets and browser requests do not execute braces. Playwright smoke uses fixed test selection. |
| Full-stack E2E | `e2e/run.cjs` serves built assets with `node:http` and forwards `/api/` via `http.request`; it does not use webpack-dev-server or glob parsing for request paths. |
| Local `npm start` | CRA webpack-dev-server watches `paths.appPublic` with an ignored-files RegExp. WDS `setupWatchStaticFiles/setupWatchFiles` supplies configured paths to `chokidar.watch`. TS checker watches compiler-derived filesystem directories. Malicious developer-supplied glob/config/checkout paths could reach braces; this is accepted residual tooling risk. |

A temporary external `Module._load` diagnostic wrapped the braces callable and
its exported functions (without logging pattern contents). During the successful
build, braces was loaded twice, with zero intercepted export calls; during the
successful full Jest run, loaded once, with zero intercepted export calls.
Loading executes package initialization, so the package is present in the Node
execution path. These observations are supplemental, not a claim that future
configuration cannot execute the vulnerable walkers. No diagnostic hooks or
generated build artifacts are committed.

## Dev-server network and untrusted-input analysis

Installed code evidence:

- `react-scripts/config/webpackDevServer.config.js`: `static.directory` is
  `paths.appPublic`, watch ignore is `ignoredFiles(paths.appSrc)`. No custom
  `watchFiles` option or `src/setupProxy.js` exists in the repository.
- `webpack-dev-server/lib/Server.js`: watcher creation consumes configured
  `staticOption.directory`/`watchFiles[].paths`, not request paths.
- `chokidar/index.js`: brace expansion operates on filesystem/glob paths in
  `getDirParts`. It does not accept HTTP requests itself.
- `http-proxy-middleware/dist/context-matcher.js`: for glob contexts it calls
  `micromatch([pathname], pattern)`, distinguishing candidate request pathname
  from the configured pattern. Current CRA `prepareProxy` uses a **function**
  context with method/header/path checks for the package's fixed proxy target,
  so it does not even select that glob-context branch.
- `HOST`, `PORT`, `HTTPS`, `WDS_SOCKET_*` and `PUBLIC_URL` control server/URL
  configuration, not a remote API for setting watcher globs. `BUILD_PATH`,
  tsconfig, test CLI and any future Tailwind configuration are operator/config
  inputs, not HockeyPlanner API/user data.

The checked-in `.env` sets `DANGEROUSLY_DISABLE_HOST_CHECK=true` and CRA defaults
to host `0.0.0.0`; this assessment does **not** depend on the dev server being
inaccessible from the network. Network access does not convert a request URL
into a watcher pattern. No current user/team/event names, imports, API responses,
uploaded files, URL/query values or external-league data flow into the tooling's
pattern arguments was found. No CI/staging step downloads user data to construct
globs. Repository configurations and filesystem inputs require developer/code
review trust. A malicious contribution changing configuration or filenames can
cause tooling failure (and can already change executable build code); that is
not proof of a remotely reachable application-data exploit under this graph.
Do not reuse this assessment for an arbitrary checkout, config override or
future feature that lets users configure globs.

## Acceptance, guard, verification and follow-up

Only fingerprint
`c2b67c87bc6d5b365e1d5b82f38a87d6229f0e0a0f131f557b9c60b2da3c09d3`
is added, status `accepted-existing`, firstSeen `2026-10-03`. The baseline entry
contains the rationale; historic baseline observation metadata and every HP-87
entry remain unchanged. NEW High/Critical, secrets, malformed scans and
normalization behavior remain unchanged in `security_audit.py`.

`test_security_braces_baseline.py` guards only this exact accepted fingerprint.
Removal or a nonaccepted status retires the guard; invalid baseline statuses
still fail the existing audit's schema validation. The guard pins nine materially
relevant package resolutions and twelve edges, checks the only two braces parents,
rejects duplicate resolutions, and rejects direct braces/micromatch/chokidar in
all four manifest dependency groups. It does not freeze unrelated lock packages
or automatically prove unchanged application/config input flows.

Deterministic isolated mutation tests cover removal, changed status, unrelated
fingerprint, nine version drifts, both removed/changed braces-parent requirements,
duplicate braces/micromatch/chokidar, all twelve direct-dependency cases, and a
new unexpected braces parent. Guard removal/status retirement passes; all cases
requiring reassessment fail. No mutation writes repository files.

Local verification uses Python 3.12.1, Node 20.11.0, npm 10.2.4:

- `npm ci`: success; existing deprecation/audit warnings remain visible.
- Full frontend Jest: 27 suites, 274 tests passed. The exact requested command
  first failed with no tests selected because Jest/CRA generated mixed separators
  for this Windows `.codex` worktree path. Retry used the identical CRA selection
  patterns without the absolute prefix:
  `npm test -- --watchAll=false --runInBand --testMatch
  '**/src/**/__tests__/**/*.{js,jsx,ts,tsx}' '**/src/**/*.{spec,test}.{js,jsx,ts,tsx}'`.
  Tests/assertions/source are unchanged. Linux PR CI runs the exact standard command.
- `npm run build`: success; existing Browserslist data warning (9 months old).
- `python -m unittest discover -s scripts/quality -p "test_security_*.py"`:
  23 tests passed, including two HP-88 guard tests and their mutation subcases.
- `python -m unittest discover -s scripts/quality -p "test_*.py"`:
  32 tests passed. SCAN_ERROR output from deliberate negative scanner fixtures
  is expected; it is not a failed real audit.
- Before acceptance, deterministic audit: 128 findings, exactly one NEW High,
  the HP-88 fingerprint. After acceptance,
  `python scripts/quality/security_audit.py --kind frontend`: COMPLETE, exit 0,
  128 KNOWN/BASELINED, zero NEW findings. The report shows the braces finding
  with firstSeen 2026-10-03; accepted-existing is its checked-in baseline status.
  Exact final-head CI run IDs belong in the PR author handoff.
- No local isolated full-stack E2E or live staging smoke is needed for the
  baseline/guard-only change; mandatory PR CI runs both isolated full-stack E2E
  and local HP-75 failure injection. No live staging/production tests were run.

Follow up in HP-88 when upstream supplies a patched compatible release or a
separately approved toolchain migration. Reassess on dependency/toolchain,
configuration/input-flow or advisory changes. Remove the vulnerable resolution
and acceptance together; the guard then naturally retires. Temporary baseline
merge does not close HP-88. Roll back through a reviewed PR reverting only this
entry, guard and report; the real NEW High will block again until remediation or
renewed justified acceptance. Human merge and independent approval are still required.

## Complete resolved reverse graph

```text
ROOT <-
@jest/console@27.5.1 <- @jest/core@27.5.1, @jest/reporters@27.5.1, @jest/test-result@27.5.1, jest-runner@27.5.1
@jest/core@27.5.1 <- jest@27.5.1, jest-cli@27.5.1
@jest/environment@27.5.1 <- @jest/globals@27.5.1, jest-circus@27.5.1, jest-environment-jsdom@27.5.1, jest-environment-node@27.5.1, jest-jasmine2@27.5.1, jest-runner@27.5.1, jest-runtime@27.5.1
@jest/fake-timers@27.5.1 <- @jest/environment@27.5.1, jest-environment-jsdom@27.5.1, jest-environment-node@27.5.1, jest-runtime@27.5.1
@jest/globals@27.5.1 <- jest-runtime@27.5.1
@jest/reporters@27.5.1 <- @jest/core@27.5.1
@jest/test-result@27.5.1 <- @jest/core@27.5.1, @jest/reporters@27.5.1, @jest/test-sequencer@27.5.1, jest-circus@27.5.1, jest-cli@27.5.1, jest-jasmine2@27.5.1, jest-runner@27.5.1, jest-runtime@27.5.1, jest-watcher@27.5.1
@jest/test-sequencer@27.5.1 <- jest-config@27.5.1
@jest/transform@27.5.1 <- @jest/core@27.5.1, @jest/reporters@27.5.1, babel-jest@27.5.1, jest-runner@27.5.1, jest-runtime@27.5.1, jest-snapshot@27.5.1
@typescript-eslint/eslint-plugin@5.62.0 <- eslint-config-react-app@7.0.1
@typescript-eslint/experimental-utils@5.62.0 <- eslint-plugin-jest@25.7.0
@typescript-eslint/parser@5.62.0 <- eslint-config-react-app@7.0.1
@typescript-eslint/type-utils@5.62.0 <- @typescript-eslint/eslint-plugin@5.62.0
@typescript-eslint/typescript-estree@5.62.0 <- @typescript-eslint/parser@5.62.0, @typescript-eslint/type-utils@5.62.0, @typescript-eslint/utils@5.62.0
@typescript-eslint/utils@5.62.0 <- @typescript-eslint/eslint-plugin@5.62.0, @typescript-eslint/experimental-utils@5.62.0, @typescript-eslint/type-utils@5.62.0, eslint-plugin-testing-library@5.11.1
babel-jest@27.5.1 <- jest-config@27.5.1, react-scripts@5.0.1
braces@3.0.3 <- chokidar@3.6.0, micromatch@4.0.8
chokidar@3.6.0 <- fork-ts-checker-webpack-plugin@6.5.3, tailwindcss@3.4.19, webpack-dev-server@4.15.2
eslint-config-react-app@7.0.1 <- react-scripts@5.0.1
eslint-plugin-jest@25.7.0 <- eslint-config-react-app@7.0.1
eslint-plugin-testing-library@5.11.1 <- eslint-config-react-app@7.0.1
eslint-webpack-plugin@3.2.0 <- react-scripts@5.0.1
expect@27.5.1 <- @jest/globals@27.5.1, jest-circus@27.5.1, jest-jasmine2@27.5.1, jest-snapshot@27.5.1
fast-glob@3.3.3 <- globby@11.1.0, tailwindcss@3.4.19
fork-ts-checker-webpack-plugin@6.5.3 <- react-dev-utils@12.0.1
globby@11.1.0 <- @typescript-eslint/typescript-estree@5.62.0, react-dev-utils@12.0.1
http-proxy-middleware@2.0.9 <- webpack-dev-server@4.15.2
jest@27.5.1 <- react-scripts@5.0.1
jest-circus@27.5.1 <- jest-config@27.5.1
jest-cli@27.5.1 <- jest@27.5.1
jest-config@27.5.1 <- @jest/core@27.5.1, jest-cli@27.5.1
jest-environment-jsdom@27.5.1 <- jest-config@27.5.1, jest-runner@27.5.1
jest-environment-node@27.5.1 <- jest-config@27.5.1, jest-runner@27.5.1
jest-haste-map@27.5.1 <- @jest/core@27.5.1, @jest/reporters@27.5.1, @jest/test-sequencer@27.5.1, @jest/transform@27.5.1, jest-resolve@27.5.1, jest-runner@27.5.1, jest-runtime@27.5.1, jest-snapshot@27.5.1
jest-jasmine2@27.5.1 <- jest-config@27.5.1
jest-message-util@27.5.1 <- @jest/console@27.5.1, @jest/core@27.5.1, @jest/fake-timers@27.5.1, expect@27.5.1, jest-circus@27.5.1, jest-jasmine2@27.5.1, jest-runner@27.5.1, jest-runtime@27.5.1, jest-snapshot@27.5.1
jest-resolve@27.5.1 <- @jest/core@27.5.1, @jest/reporters@27.5.1, jest-config@27.5.1, jest-runner@27.5.1, jest-runtime@27.5.1, react-scripts@5.0.1
jest-resolve-dependencies@27.5.1 <- @jest/core@27.5.1
jest-runner@27.5.1 <- @jest/core@27.5.1, jest-config@27.5.1
jest-runtime@27.5.1 <- @jest/core@27.5.1, @jest/test-sequencer@27.5.1, jest-circus@27.5.1, jest-jasmine2@27.5.1, jest-runner@27.5.1
jest-snapshot@27.5.1 <- @jest/core@27.5.1, jest-circus@27.5.1, jest-jasmine2@27.5.1, jest-resolve-dependencies@27.5.1, jest-runtime@27.5.1
jest-watch-typeahead@1.1.0 <- react-scripts@5.0.1
jest-watch-typeahead/node_modules/@jest/console@28.1.3 <- jest-watch-typeahead/node_modules/@jest/test-result@28.1.3
jest-watch-typeahead/node_modules/@jest/test-result@28.1.3 <- jest-watch-typeahead/node_modules/jest-watcher@28.1.3
jest-watch-typeahead/node_modules/jest-message-util@28.1.3 <- jest-watch-typeahead/node_modules/@jest/console@28.1.3
jest-watch-typeahead/node_modules/jest-watcher@28.1.3 <- jest-watch-typeahead@1.1.0
jest-watcher@27.5.1 <- @jest/core@27.5.1
micromatch@4.0.8 <- @jest/core@27.5.1, @jest/transform@27.5.1, eslint-webpack-plugin@3.2.0, fast-glob@3.3.3, http-proxy-middleware@2.0.9, jest-config@27.5.1, jest-haste-map@27.5.1, jest-message-util@27.5.1, jest-watch-typeahead/node_modules/jest-message-util@28.1.3, tailwindcss@3.4.19
react-dev-utils@12.0.1 <- react-scripts@5.0.1
react-scripts@5.0.1 <- ROOT
tailwindcss@3.4.19 <- react-scripts@5.0.1
webpack-dev-server@4.15.2 <- react-scripts@5.0.1
```
