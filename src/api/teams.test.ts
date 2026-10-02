import * as teams from "./teams";

const fetchMock = jest.fn();
const originalFetch = global.fetch;
const team = "team /?";
const resource = "resource /?";
const encodedTeam = "team%20%2F%3F";
const encodedResource = "resource%20%2F%3F";
const update = { name: "Baseline", visibility: 2, allowDuplicateJerseyNumbers: true, blockedJerseyNumbers: [] };
const news = { title: "Baseline", body: "Synthetic" };
const stats = { games: 1, goals: 2, assists: 3 };
type RouteCase = { name: string; call: (actor?: string) => Promise<unknown>; path: string; method?: string; body?: unknown };
// Explicit route expectations freeze SEC-001 compatibility until HP-80 migrates the actor.
const routes: RouteCase[] = [
  { name: "getMyTeams", call: teams.getMyTeams, path: "/api/teams" },
  { name: "getNewsFeed", call: teams.getNewsFeed, path: "/api/news" },
  { name: "getTablesFeed", call: teams.getTablesFeed, path: "/api/news/tables" },
  { name: "createTeam", call: a => teams.createTeam(update, a), path: "/api/teams", method: "POST", body: update },
  { name: "updateTeam", call: a => teams.updateTeam(team, update, a), path: `/api/teams/${encodedTeam}`, method: "PUT", body: update },
  { name: "joinTeamByCode", call: a => teams.joinTeamByCode({ code: "CODE", teamJerseyNumber: null }, a), path: "/api/teams/join-by-code", method: "POST", body: { code: "CODE", teamJerseyNumber: null } },
  { name: "joinPublicTeam", call: a => teams.joinPublicTeam(team, a), path: `/api/teams/${encodedTeam}/join-public`, method: "POST" },
  { name: "leaveTeam", call: a => teams.leaveTeam(team, a), path: `/api/teams/${encodedTeam}/members/me`, method: "DELETE" },
  { name: "updateMyTeamJerseyNumber", call: a => teams.updateMyTeamJerseyNumber(team, null, a), path: `/api/teams/${encodedTeam}/members/me/number`, method: "PUT", body: { teamJerseyNumber: null } },
  { name: "updateTeamMember", call: a => teams.updateTeamMember(team, resource, { role: 2, badgeTitle: null, teamJerseyNumber: 0 }, a), path: `/api/teams/${encodedTeam}/members/${encodedResource}`, method: "PUT", body: { role: 2, badgeTitle: null, teamJerseyNumber: 0 } },
  { name: "removeTeamMember", call: a => teams.removeTeamMember(team, resource, a), path: `/api/teams/${encodedTeam}/members/${encodedResource}`, method: "DELETE" },
  { name: "createTeamNews", call: a => teams.createTeamNews(team, news, a), path: `/api/teams/${encodedTeam}/news`, method: "POST", body: news },
  { name: "updateTeamNews", call: a => teams.updateTeamNews(team, resource, news, a), path: `/api/teams/${encodedTeam}/news/${encodedResource}`, method: "PUT", body: news },
  { name: "deleteTeamNews", call: a => teams.deleteTeamNews(team, resource, a), path: `/api/teams/${encodedTeam}/news/${encodedResource}`, method: "DELETE" },
  { name: "getTeamTables", call: a => teams.getTeamTables(team, a), path: `/api/teams/${encodedTeam}/tables` },
  { name: "getTeamTable", call: a => teams.getTeamTable(team, resource, a), path: `/api/teams/${encodedTeam}/tables/${encodedResource}` },
  { name: "createTeamTable", call: a => teams.createTeamTable(team, { name: "Stats", templateType: 1 }, a), path: `/api/teams/${encodedTeam}/tables`, method: "POST", body: { name: "Stats", templateType: 1 } },
  { name: "getEventTableProtocols", call: a => teams.getEventTableProtocols(team, a), path: `/api/events/${encodedTeam}/table-protocols` },
  { name: "createEventTableProtocol", call: a => teams.createEventTableProtocol(team, { teamTableId: resource }, a), path: `/api/events/${encodedTeam}/table-protocols`, method: "POST", body: { teamTableId: resource } },
  { name: "updateEventTableProtocol", call: a => teams.updateEventTableProtocol(team, resource, { rows: [{ rowId: "row", ...stats }] }, a), path: `/api/events/${encodedTeam}/table-protocols/${encodedResource}`, method: "PUT", body: { rows: [{ rowId: "row", ...stats }] } },
  { name: "updateEventTableProtocolRow", call: a => teams.updateEventTableProtocolRow(team, resource, "row /?", stats, a), path: `/api/events/${encodedTeam}/table-protocols/${encodedResource}/rows/row%20%2F%3F`, method: "PUT", body: stats },
];

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("currentUser", JSON.stringify({ id: "stored /?" }));
  global.fetch = fetchMock;
  fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200, json: async () => ({ imageUrl: "https://test.invalid/pixel.png" }) });
});
afterEach(() => { global.fetch = originalFetch; localStorage.clear(); });

describe.each([undefined, "explicit /?"])("actor %s", actor => {
  test.each(routes)("$name freezes method, encoded URL, body and query actor", async ({ call, path, method, body }) => {
    await call(actor);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${path}?currentUserId=${actor ? "explicit%20%2F%3F" : "stored%20%2F%3F"}`);
    expect(init.credentials).toBe("include");
    expect(init.method ?? "GET").toBe(method ?? "GET");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.body).toBe(body === undefined ? undefined : JSON.stringify(body));
    expect(init.headers).toEqual(body === undefined ? undefined : { "Content-Type": "application/json" });
  });
});

test.each([
  { name: "getTeam", call: teams.getTeam, suffix: "" },
  { name: "getTeamNews", call: teams.getTeamNews, suffix: "/news" },
])("$name only sends an explicitly supplied actor", async ({ call, suffix }) => {
  await call(team);
  await call(team, "explicit /?");
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
    `/api/teams/${encodedTeam}${suffix}`,
    `/api/teams/${encodedTeam}${suffix}?currentUserId=explicit%20%2F%3F`,
  ]);
});

test("directory and member reads send no actor query", async () => {
  await teams.getPublicTeams();
  await teams.getTeamMembers(team);
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(["/api/teams/public", `/api/teams/${encodedTeam}/members`]);
});

test.each([null, undefined, 0, 79])("join-public preserves jersey value %s", async number => {
  await teams.joinPublicTeam(team, "actor", number);
  expect(fetchMock.mock.calls[0][0]).toBe(`/api/teams/${encodedTeam}/join-public?currentUserId=actor${number == null ? "" : `&teamJerseyNumber=${number}`}`);
});

test.each([
  { name: "avatar", call: teams.uploadTeamAvatar, route: "avatar/upload" },
  { name: "cover", call: teams.uploadTeamCover, route: "cover/upload" },
  { name: "news", call: teams.uploadTeamNewsImage, route: "news/upload-image" },
])("$name uses multipart and the current query actor", async ({ call, route }) => {
  const file = new File([new Uint8Array([137, 80, 78, 71])], "pixel.png", { type: "image/png" });
  for (const actor of [undefined, "explicit /?"]) {
    await call(team, file, actor);
    const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
    expect(url).toBe(`/api/teams/${encodedTeam}/${route}?currentUserId=${actor ? "explicit%20%2F%3F" : "stored%20%2F%3F"}`);
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(init.headers).toBeUndefined();
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.body.get("file")).toBe(file);
  }
});

test.each([null, "invalid", "{}", '{"id":null}'])("invalid cached user %s fails before a request", async saved => {
  localStorage.clear();
  if (saved !== null) localStorage.setItem("currentUser", saved);
  await expect(teams.getMyTeams()).rejects.toThrow("Необходимо выбрать пользователя");
  expect(fetchMock).not.toHaveBeenCalled();
});

test("204 mutations do not attempt JSON parsing", async () => {
  const json = jest.fn().mockRejectedValue(new Error("empty body"));
  fetchMock.mockResolvedValue({ ok: true, status: 204, json });
  await teams.leaveTeam(team);
  await teams.removeTeamMember(team, resource);
  await teams.deleteTeamNews(team, resource);
  expect(json).not.toHaveBeenCalled();
});

test("missing upload image URL remains a TeamsApiError", async () => {
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
  await expect(teams.uploadTeamNewsImage(team, new File(["x"], "pixel.png"))).rejects.toMatchObject({ name: "TeamsApiError", status: 200 });
});
