import { authFetch } from "src/api/auth";
import {
  applyExternalLeagueProfile,
  createTeamExternalLeagueLink,
  deleteTeamExternalLeagueLink,
  ExternalLeagueProvider,
  getTeamExternalLeagueLinks,
  searchExternalLeagueTeams,
  syncAllTeamExternalLeagueLinks,
  syncTeamExternalLeagueLink,
} from "src/api/externalLeagueTeams";

jest.mock("src/api/auth", () => ({ authFetch: jest.fn() }));
const mockedFetch = authFetch as jest.MockedFunction<typeof authFetch>;
const response = (body: unknown, status = 200) => ({
  ok: status < 400,
  status,
  json: jest.fn().mockResolvedValue(body),
}) as unknown as Response;

beforeEach(() => mockedFetch.mockReset());

test("search uses provider route, encodes title and sends no actor identity", async () => {
  mockedFetch.mockResolvedValue(response([]));

  await searchExternalLeagueTeams(ExternalLeagueProvider.Spbhl, "Северная столица");

  expect(mockedFetch).toHaveBeenCalledWith(
    `/api/external-leagues/spbhl/teams/search?title=${encodeURIComponent("Северная столица")}`,
    { credentials: "include" },
  );
  expect(JSON.stringify(mockedFetch.mock.calls)).not.toMatch(/currentUserId|userId/i);
});

test("link management uses generic protected team routes", async () => {
  mockedFetch.mockResolvedValue(response([]));
  await getTeamExternalLeagueLinks("team id");
  await createTeamExternalLeagueLink("team id", {
    provider: ExternalLeagueProvider.Spbhl,
    externalTeamId: "external",
    isPrimary: false,
  });
  await deleteTeamExternalLeagueLink("team id", "link id");
  await applyExternalLeagueProfile("team id", "link id", { useName: true, useLogo: true, useCover: false });
  await syncTeamExternalLeagueLink("team id", "link id");
  await syncAllTeamExternalLeagueLinks("team id");

  expect(mockedFetch).toHaveBeenNthCalledWith(1, "/api/teams/team%20id/external-links", { credentials: "include" });
  expect(mockedFetch).toHaveBeenNthCalledWith(2, "/api/teams/team%20id/external-links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider: 1, externalTeamId: "external", isPrimary: false }),
    credentials: "include",
  });
  expect(mockedFetch).toHaveBeenNthCalledWith(3, "/api/teams/team%20id/external-links/link%20id", { method: "DELETE", credentials: "include" });
  expect(mockedFetch).toHaveBeenNthCalledWith(4, "/api/teams/team%20id/external-links/link%20id/apply-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ useName: true, useLogo: true, useCover: false }),
    credentials: "include",
  });
  expect(mockedFetch).toHaveBeenNthCalledWith(5, "/api/teams/team%20id/external-links/link%20id/sync", { method: "POST", credentials: "include" });
  expect(mockedFetch).toHaveBeenNthCalledWith(6, "/api/teams/team%20id/external-links/sync", { method: "POST", credentials: "include" });
  expect(JSON.stringify(mockedFetch.mock.calls)).not.toMatch(/currentUserId|userId/i);
});

test("502 and network failures expose safe messages", async () => {
  mockedFetch.mockResolvedValueOnce(response({}, 502)).mockRejectedValueOnce(new Error("internal"));

  await expect(getTeamExternalLeagueLinks("team")).rejects.toThrow("Не удалось получить данные внешней лиги. Попробуйте позже.");
  await expect(getTeamExternalLeagueLinks("team")).rejects.toThrow("Не удалось связаться с сервером.");
});
