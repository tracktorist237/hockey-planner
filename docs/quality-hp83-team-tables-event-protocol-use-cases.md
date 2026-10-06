# HP-83 frontend author handoff (M7)

[HP-83](https://linear.app/hockeyplanner/issue/HP-83/m7-secure-and-extract-team-tables-and-event-protocol-use-cases)
remains In Progress. This is author evidence, not independent approval.
Frontend base: `d9fb43fe8099e2208e7c06b4a7e9f720359d3b57`.
Backend base: `0e2bbb06a7630c52e45be01f221cbedb87700c46`.
Backend tested head: `8b2a4021a3d43a6cb1cfc306474100cd376371d3`.
Both branches: `quality/hp-83-team-tables-event-protocol-use-cases`.
Final heads, paired Draft PR links and exact-head CI belong in the PR bodies.

## Migrated API and callers

| Function | Remaining arguments |
|---|---|
| getTablesFeed | None |
| getTeamTables | teamId |
| getTeamTable | teamId, tableId |
| createTeamTable | teamId, request |
| getEventTableProtocols | eventId |
| createEventTableProtocol | eventId, request |
| updateEventTableProtocol | eventId, protocolId, request |
| updateEventTableProtocolRow | eventId, protocolId, rowId, request |

Every call uses the existing fetchWithTeamAuth/authFetch transport: JWT bearer
attachment, coordinated refresh, credentials=include and ten-second timeout.
Encoded IDs, GET/POST/PUT methods, JSON bodies and TeamsApiError parsing remain
compatible. No currentUserId query, actor argument or requireCurrentUserId
fallback remains in teams.ts. Arbitrary cached localStorage currentUser data
cannot select authority or alter these URLs. Browser account session JWT is the
only actor source.

TeamTablesPanel and EventTableProtocolsPanel no longer accept or gate calls on
currentUserId. NewsPage, TeamDetailsPage and EventPage remove their actor prop
bindings. Existing selected/page user state remains for unrelated presentation
and event behavior. There is no component redesign or conflict/transfer change.

## Backend companion behavior

All eight table/protocol routes require JWT; anonymous=401. Persisted team
Member/Owner/Admin can view; only Owner/Admin can manage, centralized through
CoreTeamRolePolicy. Foreign authenticated users get 403 for existing team
resources. The feed contains only JWT memberships, with role-derived CanManage.
Legacy actor queries (including malformed values) are ignored by backend binding.
The controller forwards ICurrentUser identity and CancellationToken to one
Application service; mapping, persistence, TimeProvider timestamps and stat
recalculation are behind that boundary. Unchanged models move to Shared.

Team/table, event/table, event/protocol and protocol/row substitutions are checked
before writes. Foreign table GET returns 404 with every foreign row unchanged.
Duplicate-template POST returns 409 before syncing missing membership rows; the
late member row remains missing and existing protocol count/content/timestamps
stay unchanged. Both are proven with signed JWT, real HTTP and fresh PostgreSQL
DbContext assertions, replacing HP-79 vulnerability characterizations.
Stats clamping, Points=Goals+Assists, attendance-derived Games, aggregate totals,
sorting, jerseys, names and DTOs remain compatible. Both creators persist JWT ID.

## Local verification

- Focused teams API: 142 passed; all eight resource-only signatures, encoded
  paths, absent actor queries, five cached-user variants, bearer transport,
  methods/bodies, every route timeout and ProblemDetails parsing.
- Relevant panel tests: 4 passed; table feed/detail/create and protocol
  read/create/bulk save receive only resources/bodies, independent of cached user.
- Combined focused command: npm test -- --watchAll=false --runInBand
  --runTestsByPath src/api/teams.test.ts src/components/TeamTablePanels.test.tsx;
  146 passed, 2 suites, 0 failed/skipped.
- Full Jest: npm test -- --watchAll=false --runInBand;
  322 passed, 28 suites, 0 failed/skipped.
- npm run build: passed, optimized production build plus metadata.
- Python quality: python -m unittest discover -s scripts/quality -p "test_*.py";
  32 passed.
- HP_E2E_BACKEND points to the paired local backend; npm run e2e:ci:
  33 passed (11 real HTTP journeys on desktop Chromium, mobile Chromium and
  mobile WebKit), no retries, disposable PostgreSQL and real JWT auth/migrations.
  The artifact sanitizer completed and sanitized.ok exists.
- git diff --check: passed.
- Backend: restore, Debug and Release passed; focused authorization/side-effect/
  consumer-contract suite 32 passed; Python 34 passed; migrations 5 passed;
  full PostgreSQL 667 passed with zero failed/skipped; TRX rejection gate passed.

One intermediate panel selector failed and one test-only invalid query option
failed TypeScript build; both were corrected. Counts above are the final green
runs. Browserslist warns about stale caniuse-lite data; no dependency refresh is
included. Backend retains 21 existing NuGet advisory warnings. Remote deterministic
audits and CodeQL remain mandatory, separate from successful local builds.
Manual staging/production/device smoke was not run; independent review is pending.

## Contract/debt/scope

No canonical fixture change is needed; current fixture does not contain table/
protocol captures, and existing real HTTP entries remain unchanged. Real backend
ConsumerContractTests and compare_contract.py pass with zero drift. Neither
fixture is hand-edited or regenerated. Both canonical SHA-256 hashes:
`4bf24556d8855d2e09dc853ff9022389faf312807d73dc0432f9fc153d63fe06`.
Paired CI must resolve the same-named HP-83 companion branch after both pushes.

Backend SEC-001 is Resolved for M7 team-operation scope after actor-trust searches;
Exercises/Goalies remain outside this claim. ARC-002 and ARC-004 remain Open with
TeamTables extraction evidence. TECH-002, TECH-003, PERF-001, INF-006 and unrelated
debt are unchanged. No migration/schema, package, workflow, VERSION, master,
production, release/tagging, deploy, GitHub setting or Linear state is changed.
Existing successful-detail row synchronization and concurrent application-level
duplicate-check limitations remain documented in the backend handoff.
Rollback: revert paired HP-83 commits; no DB/config rollback is required.
PRs remain Draft to develop for independent review and human merge.
