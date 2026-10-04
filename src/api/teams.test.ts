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
test.each([
  { name: "getTablesFeed", call: teams.getTablesFeed, length: 0 },
  { name: "getTeamTables", call: teams.getTeamTables, length: 1 },
  { name: "getTeamTable", call: teams.getTeamTable, length: 2 },
  { name: "createTeamTable", call: teams.createTeamTable, length: 2 },
  { name: "getEventTableProtocols", call: teams.getEventTableProtocols, length: 1 },
  { name: "createEventTableProtocol", call: teams.createEventTableProtocol, length: 2 },
  { name: "updateEventTableProtocol", call: teams.updateEventTableProtocol, length: 3 },
  { name: "updateEventTableProtocolRow", call: teams.updateEventTableProtocolRow, length: 4 },
])("$name exposes only resource/body arguments", ({ call, length }) => {
  expect(call).toHaveLength(length);
});
type RouteCase = { name: string; call: () => Promise<unknown>; path: string; method?: string; body?: unknown };
// All authenticated team features derive actor identity from the account session JWT.
const routes: RouteCase[] = [
  { name: "getMyTeams", call: teams.getMyTeams, path: "/api/teams" },
  { name: "getNewsFeed", call: teams.getNewsFeed, path: "/api/news" },
  { name: "getTablesFeed", call: teams.getTablesFeed, path: "/api/news/tables" },
  { name: "createTeam", call: () => teams.createTeam(update), path: "/api/teams", method: "POST", body: update },
  { name: "updateTeam", call: () => teams.updateTeam(team, update), path: `/api/teams/${encodedTeam}`, method: "PUT", body: update },
  { name: "joinTeamByCode", call: () => teams.joinTeamByCode({ code: "CODE", teamJerseyNumber: null }), path: "/api/teams/join-by-code", method: "POST", body: { code: "CODE", teamJerseyNumber: null } },
  { name: "joinPublicTeam", call: () => teams.joinPublicTeam(team), path: `/api/teams/${encodedTeam}/join-public`, method: "POST" },
  { name: "leaveTeam", call: () => teams.leaveTeam(team), path: `/api/teams/${encodedTeam}/members/me`, method: "DELETE" },
  { name: "updateMyTeamJerseyNumber", call: () => teams.updateMyTeamJerseyNumber(team, null), path: `/api/teams/${encodedTeam}/members/me/number`, method: "PUT", body: { teamJerseyNumber: null } },
  { name: "updateTeamMember", call: () => teams.updateTeamMember(team, resource, { role: 2, badgeTitle: null, teamJerseyNumber: 0 }), path: `/api/teams/${encodedTeam}/members/${encodedResource}`, method: "PUT", body: { role: 2, badgeTitle: null, teamJerseyNumber: 0 } },
  { name: "removeTeamMember", call: () => teams.removeTeamMember(team, resource), path: `/api/teams/${encodedTeam}/members/${encodedResource}`, method: "DELETE" },
  { name: "createTeamNews", call: () => teams.createTeamNews(team, news), path: `/api/teams/${encodedTeam}/news`, method: "POST", body: news },
  { name: "updateTeamNews", call: () => teams.updateTeamNews(team, resource, news), path: `/api/teams/${encodedTeam}/news/${encodedResource}`, method: "PUT", body: news },
  { name: "deleteTeamNews", call: () => teams.deleteTeamNews(team, resource), path: `/api/teams/${encodedTeam}/news/${encodedResource}`, method: "DELETE" },
  { name: "getTeamTables", call: () => teams.getTeamTables(team), path: `/api/teams/${encodedTeam}/tables` },
  { name: "getTeamTable", call: () => teams.getTeamTable(team, resource), path: `/api/teams/${encodedTeam}/tables/${encodedResource}` },
  { name: "createTeamTable", call: () => teams.createTeamTable(team, { name: "Stats", templateType: 1 }), path: `/api/teams/${encodedTeam}/tables`, method: "POST", body: { name: "Stats", templateType: 1 } },
  { name: "getEventTableProtocols", call: () => teams.getEventTableProtocols(team), path: `/api/events/${encodedTeam}/table-protocols` },
  { name: "createEventTableProtocol", call: () => teams.createEventTableProtocol(team, { teamTableId: resource }), path: `/api/events/${encodedTeam}/table-protocols`, method: "POST", body: { teamTableId: resource } },
  { name: "updateEventTableProtocol", call: () => teams.updateEventTableProtocol(team, resource, { rows: [{ rowId: "row", ...stats }] }), path: `/api/events/${encodedTeam}/table-protocols/${encodedResource}`, method: "PUT", body: { rows: [{ rowId: "row", ...stats }] } },
  { name: "updateEventTableProtocolRow", call: () => teams.updateEventTableProtocolRow(team, resource, "row /?", stats), path: `/api/events/${encodedTeam}/table-protocols/${encodedResource}/rows/row%20%2F%3F`, method: "PUT", body: stats },
];

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("currentUser", JSON.stringify({ id: "stored /?" }));
  localStorage.setItem("authSession", JSON.stringify({ version: "test-session", userId: "jwt-account",
    accessToken: "synthetic-test-bearer", refreshToken: null, accessTokenExpiresAt: null }));
  global.fetch = fetchMock;
  fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200, json: async () => ({ imageUrl: "https://test.invalid/pixel.png" }) });
});
afterEach(() => { global.fetch = originalFetch; localStorage.clear(); });

const verifyRequest = (path: string, method?: string, body?: unknown) => {
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe(path);
  expect(init.credentials).toBe("include");
  expect(init.method ?? "GET").toBe(method ?? "GET");
  expect(init.signal).toBeInstanceOf(AbortSignal);
  expect(init.body).toBe(body === undefined ? undefined : JSON.stringify(body));
  if (init.headers instanceof Headers) {
    expect(init.headers.get("Authorization")).toBe("Bearer synthetic-test-bearer");
    expect(init.headers.get("Content-Type")).toBe(body === undefined ? null : "application/json");
  } else {
    expect(init.headers).toEqual(body === undefined ? undefined : { "Content-Type": "application/json" });
  }
};

describe.each([null, "invalid", "{}", '{"id":null}', '{"id":"stale-owner"}'])("cached user %s", saved => {
  test.each(routes)("$name sends no actor query and ignores cached identity", async ({ call, path, method, body }) => {
    localStorage.clear();
    if (saved !== null) localStorage.setItem("currentUser", saved);
    localStorage.setItem("authSession", JSON.stringify({ version: "test-session", userId: "jwt-account",
      accessToken: "synthetic-test-bearer", refreshToken: null, accessTokenExpiresAt: null }));
    await call();
    verifyRequest(path, method, body);
    expect(fetchMock.mock.calls[0][1].headers.get("Authorization")).toBe("Bearer synthetic-test-bearer");
  });
});

test.each([
  { name: "getTeam", call: teams.getTeam, suffix: "" },
  { name: "getTeamNews", call: teams.getTeamNews, suffix: "/news" },
])("$name ignores a stale cached owner for optional-auth reads", async ({ call, suffix }) => {
  await call(team);
  localStorage.setItem("currentUser", '{"id":"different-owner"}');
  await call(team);
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
    `/api/teams/${encodedTeam}${suffix}`,
    `/api/teams/${encodedTeam}${suffix}`,
  ]);
  for (const [, init] of fetchMock.mock.calls) expect(init.headers.get("Authorization")).toBe("Bearer synthetic-test-bearer");
});

test("directory and member reads send no actor query", async () => {
  await teams.getPublicTeams();
  await teams.getTeamMembers(team);
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(["/api/teams/public", `/api/teams/${encodedTeam}/members`]);
});

test.each([null, undefined, 0, 79])("join-public preserves jersey value %s", async number => {
  await teams.joinPublicTeam(team, number);
  expect(fetchMock.mock.calls[0][0]).toBe(`/api/teams/${encodedTeam}/join-public${number == null ? "" : `?teamJerseyNumber=${number}`}`);
});

test.each([
  { name: "avatar", call: teams.uploadTeamAvatar, route: "avatar/upload" },
  { name: "cover", call: teams.uploadTeamCover, route: "cover/upload" },
  { name: "news", call: teams.uploadTeamNewsImage, route: "news/upload-image" },
])("$name uses multipart with JWT identity only", async ({ call, route }) => {
  const file = new File([new Uint8Array([137, 80, 78, 71])], "pixel.png", { type: "image/png" });
  for (const cached of ["stale-owner", "different-owner"]) {
    localStorage.setItem("currentUser", JSON.stringify({ id: cached }));
    await call(team, file);
    const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
    expect(url).toBe(`/api/teams/${encodedTeam}/${route}`);
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(init.headers.get("Authorization")).toBe("Bearer synthetic-test-bearer");
    expect(init.headers.get("Content-Type")).toBeNull();
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.body.get("file")).toBe(file);
  }
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

test("JWT-backed requests refresh after 401 and retry without a cached actor query", async () => {
  localStorage.setItem("authSession", JSON.stringify({ version: "refresh-test", userId: "jwt-account",
    accessToken: "synthetic-old-bearer", refreshToken: "synthetic-refresh", accessTokenExpiresAt: null }));
  fetchMock.mockResolvedValueOnce({ ok: false, status: 401 })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ accessToken: "synthetic-new-bearer",
      refreshToken: "synthetic-rotated-refresh", accessTokenExpiresAt: "2099-01-01T00:00:00Z", user: { id: "jwt-account" } }) })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });
  await expect(teams.getTablesFeed()).resolves.toEqual([]);
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(["/api/news/tables", "/api/auth/refresh", "/api/news/tables"]);
  expect(fetchMock.mock.calls[0][1].headers.get("Authorization")).toBe("Bearer synthetic-old-bearer");
  expect(fetchMock.mock.calls[2][1].headers.get("Authorization")).toBe("Bearer synthetic-new-bearer");
});

test.each(routes.filter(({ name }) => /Table|Protocol/.test(name)))("$name timeout still aborts after ten seconds", async ({ call }) => {
  jest.useFakeTimers();
  fetchMock.mockImplementation((_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  }));
  try {
    const pending = call();
    const rejected = expect(pending).rejects.toThrow("Сервер временно недоступен. Проверьте интернет и попробуйте ещё раз.");
    jest.advanceTimersByTime(9999);
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
    jest.advanceTimersByTime(1);
    await rejected;
  } finally { jest.useRealTimers(); }
});

test.each(routes.filter(({ name }) => /Table|Protocol/.test(name)))("$name preserves ProblemDetails error parsing", async ({ call }) => {
  fetchMock.mockResolvedValue({ ok: false, status: 409, json: async () => ({ status: 409, detail: "Сохранение невозможно." }) });
  await expect(call()).rejects.toMatchObject({ name: "TeamsApiError", status: 409, message: "Сохранение невозможно." });
});
