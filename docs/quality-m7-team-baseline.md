# M7 team API consumer baseline (HP-79)

Historical HP-79 evidence below. [HP-80](quality-hp80-jwt-team-identity.md)
supersedes TeamsController actor arguments and assertions. Table/protocol actor
queries and backend characterization remain current until HP-83.

Frontend base: `91e7b77e65c139eb0933ea4d685bb7577c739041`.
Backend base: `f80940adfb4e51a1dbd6119cfb046d5f837f2b64`.
Both branches: `quality/hp-79-team-api-baseline`.

This change adds tests and the paired generated HTTP fixture. Runtime team
requests still use `currentUserId`, including localStorage fallback; HP-80 is
responsible for the intentional JWT migration.

- `src/api/teams.test.ts`: explicit/stored actors for all query-based core,
  news and table/protocol calls; optional actor omission for getTeam/getTeamNews;
  public/member reads; encoded IDs; HTTP methods; JSON and multipart bodies;
  jersey 0/null handling; invalid cached identity; 204 and malformed upload reply.
- `src/api/teamBackendContract.test.ts`: real backend TeamDto, TeamMemberDto,
  TeamNewsDto and safe error details/statuses through production consumers.
  Team errors cover 400/403/404/409. The existing real auth 401 fixture tests
  consumer compatibility; it is not evidence of authentication on team routes.
- `src/pages/TeamsPage/hooks/useTeamsPage.baseline.test.tsx`: page user passed to
  list/join/member operations separately from resource IDs and a different
  localStorage user. Existing create-flow and conflict/transfer tests remain.

The backend baseline document on the companion branch describes the full
HTTP/JWT/PostgreSQL matrix. Reproduced SEC-001 behavior includes anonymous
private team/member/news reads and supplied-actor impersonation for team,
member, news/media and table/protocol operations. A mismatched team/table read
returns 404 **after inserting the requesting team's members into the foreign
table** (SEC-001 / ARC-002). TECH-001 last-owner leave retains an ownerless team.
These are explicit passing characterization assertions, not desired security
policy. HP-80 and HP-83 must flip the affected assertions; HP-81/82 must preserve
compatible serialized shapes during extraction and explicitly change owner
invariants. ARC-004 is documented, not refactored. TECH-002, TECH-003 and PERF-001
are outside this baseline: no roster/attendance/schema or GetEvent optimization.
No debt status or canonical DoD criteria changed.

The fixture was generated at the backend HTTP boundary with synthetic seed data.
It was copied verbatim; no hand-authored DTO responses or CI fixture updates.
See [contract rules](quality-contracts.md). Both branches must be pushed before
PR CI so the paired fixture comparison resolves the same-named branch.

Run focused team/contract/hook tests, full Jest, production build, Python quality
tests and diff checks. Existing isolated full-stack Playwright remains mandatory
in PR CI. No HP-75 fixture, UI flow, auth refresh, accessibility or deployment
configuration is modified. Local results and final-head CI belong in Draft PRs.
Independent review is reserved for a different Codex session; do not merge or
mark HP-79 Done. Revert the paired tests/docs/fixtures together for rollback.
