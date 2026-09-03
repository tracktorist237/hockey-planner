import { authFetch } from "src/api/auth";
import { bindTeamSpbhl, getTeamSpbhlStatus, searchSpbhlTeams, syncTeamSpbhlNow, unbindTeamSpbhl } from "src/api/teamSpbhl";

jest.mock("src/api/auth", () => ({ authFetch: jest.fn() }));
const mockedFetch = authFetch as jest.MockedFunction<typeof authFetch>;
const response = (body: unknown, status = 200) => ({ ok: status < 400, status, json: jest.fn().mockResolvedValue(body) }) as unknown as Response;

beforeEach(() => mockedFetch.mockReset());

test("status uses protected team route without client actor", async () => {
  mockedFetch.mockResolvedValue(response({ isLinked: false }));
  await getTeamSpbhlStatus("team id");
  expect(mockedFetch).toHaveBeenCalledWith("/api/teams/team%20id/spbhl", { credentials: "include" });
  expect(JSON.stringify(mockedFetch.mock.calls[0])).not.toMatch(/currentUserId|userId/);
});

test("search encodes title", async () => {
  mockedFetch.mockResolvedValue(response([]));
  await searchSpbhlTeams("team", "Ладога СПб");
  expect(mockedFetch.mock.calls[0][0]).toBe(`/api/teams/team/spbhl/search?title=${encodeURIComponent("Ладога СПб")}`);
  expect(String(mockedFetch.mock.calls[0][0])).not.toMatch(/currentUserId|userId/i);
});

test("safe backend error fields are shown without serializing internal payloads", async () => {
  mockedFetch.mockResolvedValue(response({ detail: "Недостаточно прав", traceId: "internal" }, 403));
  await expect(getTeamSpbhlStatus("team")).rejects.toThrow("Недостаточно прав");
});

test("bind posts the selected server result", async () => {
  mockedFetch.mockResolvedValue(response({}));
  const body = { spbhlTeamId: "external", spbhlTeamName: "Ладога" };
  await bindTeamSpbhl("team", body);
  expect(mockedFetch).toHaveBeenCalledWith("/api/teams/team/spbhl/link", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "include",
  });
});

test("unbind and sync preserve methods", async () => {
  mockedFetch.mockResolvedValue(response({}));
  await unbindTeamSpbhl("team");
  await syncTeamSpbhlNow("team");
  expect(mockedFetch).toHaveBeenNthCalledWith(1, "/api/teams/team/spbhl", { method: "DELETE", credentials: "include" });
  expect(mockedFetch).toHaveBeenNthCalledWith(2, "/api/teams/team/spbhl/sync", { method: "POST", credentials: "include" });
});

test("502 and network failures use safe messages", async () => {
  mockedFetch.mockResolvedValueOnce(response({}, 502)).mockRejectedValueOnce(new Error("internal"));
  await expect(getTeamSpbhlStatus("team")).rejects.toThrow("Не удалось получить данные СПбХЛ. Попробуйте позже.");
  await expect(getTeamSpbhlStatus("team")).rejects.toThrow("Не удалось связаться с сервером.");
});
