# HP-80: Teams API JWT identity

Branch: `quality/hp-80-jwt-team-identity` in both repositories.
Frontend base: `7622f997a8d2671c3b21dbb35c39aa309b90d3b1`.
Backend base: `ff570b4a38af5f9316e6e4e558a2118a4e77cbe8`.

The TeamsController functions in `src/api/teams.ts` no longer take or send actor
`currentUserId`, and do not consult cached user identity: getMyTeams, getTeam,
getTeamNews, getNewsFeed, createTeam, updateTeam, createTeamNews, updateTeamNews,
deleteTeamNews, uploadTeamAvatar, uploadTeamCover, uploadTeamNewsImage,
joinTeamByCode, joinPublicTeam, updateMyTeamJerseyNumber, leaveTeam,
removeTeamMember and updateTeamMember. getTeamMembers also sends no actor query.

Callers in App, GlobalSearchDialog, CreateEventPage, EventPage, EventsListPage,
TeamSwitcher, NewsPage, TeamPwaSettingsPage, TeamDetailsPage, TeamManagePage and
useTeamsPage now pass request/resource data only. UI user state still supports
rendering, login guards, target IDs and other APIs. JWT-backed calls reuse the
existing `authFetch` bearer attachment and coordinated refresh, with the original
ten-second team timeout. Table/protocol transport and the public directory remain
unchanged.
The direct E2E creation/join/member-removal setup calls use authenticated clients
without actor queries. `joinPublicTeam(teamId, teamJerseyNumber?)` preserves
ordinary jersey query data, including zero and omitted/null values.

## TeamsController visibility and errors

Public directory/PWA logo remain anonymous. Public team details/members/news
return 200 for anonymous and foreign JWT viewers. Private equivalents return
401 for anonymous, 403 for foreign JWT and 200 for JWT members. Missing teams
remain 404. Role/badge/jersey/invite and news CanManage projections use JWT
membership only. My-teams/news feed and mutations require JWT identity.
Legacy actor queries, even malformed or different from JWT, are ignored.

The paired real HTTP fixture includes team authenticated DTOs, protected-route
401, private-visibility 403, missing-team 404, name-validation 400 and
duplicate-name 409. Only allowed correlation data is normalized by the backend.
It is copied verbatim, never hand-edited. See [contract rules](quality-contracts.md).

## HP-83 boundary

getTablesFeed, getTeamTables, getTeamTable, createTeamTable,
getEventTableProtocols, createEventTableProtocol, updateEventTableProtocol and
updateEventTableProtocolRow still send legacy actor queries. Their only cache
fallback helper remains in teams.ts. Tests distinguish these eight functions
from JWT-backed team APIs. TeamTables SEC-001 stays open until HP-83; HP-80 fixes
only the TeamsController slice. Backend table/protocol characterization remains.

## Verification and limitations

API tests assert exact URLs/methods/JSON/multipart bodies, credentials, abort
signals, bearer attachment, refresh/retry, ten-second timeout, 204 handling and
null/zero jersey data. Missing, malformed, empty and
stale cached users cannot change migrated team URLs. Hook tests deliberately
use different page, team, target member and cached user IDs. Real backend
ProblemDetails pass through TeamsApiError unchanged.

Focused/full Jest, production build, Python quality, contract equality and
isolated Playwright results and final-head CI runs are recorded in the paired
Draft PRs and author handoff. Both branches must be pushed before PR CI.
No dependency, schema/migration, VERSION, deployment or HP-87 baseline changes
are included. Independent review is pending a separate session. HP-80 remains
In Progress; no merge or deployment is authorized. Rollback reverts both paired
commits together and reopens the Teams identity vulnerability.
