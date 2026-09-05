import { act, renderHook } from "@testing-library/react";
import { createTeamExternalLeagueLink, ExternalLeagueProvider, syncTeamExternalLeagueLink } from "src/api/externalLeagueTeams";
import { createTeam, getMyTeams, getPublicTeams } from "src/api/teams";
import { useTeamsPage } from "src/pages/TeamsPage/hooks/useTeamsPage";
import type { CreateTeamOutcome } from "src/pages/TeamsPage/hooks/useTeamsPage";
import { TeamDto, TeamVisibility } from "src/types/teams";

jest.mock("src/api/externalLeagueTeams", () => ({
  ExternalLeagueProvider: { Spbhl: 1 },
  createTeamExternalLeagueLink: jest.fn(),
  syncTeamExternalLeagueLink: jest.fn(),
}));
jest.mock("src/api/teams", () => ({
  createTeam: jest.fn(), getMyTeams: jest.fn(), getPublicTeams: jest.fn(),
  getTeamMembers: jest.fn(), joinPublicTeam: jest.fn(), joinTeamByCode: jest.fn(), updateTeamMember: jest.fn(),
  TeamsApiError: class TeamsApiError extends Error {},
}));

const create = createTeam as jest.MockedFunction<typeof createTeam>;
const createLink = createTeamExternalLeagueLink as jest.MockedFunction<typeof createTeamExternalLeagueLink>;
const syncLink = syncTeamExternalLeagueLink as jest.MockedFunction<typeof syncTeamExternalLeagueLink>;
const createdTeam = { id: "team-new", name: "Северная столица", visibility: TeamVisibility.Public } as TeamDto;
const selected = [
  { provider: ExternalLeagueProvider.Spbhl, externalTeamId: "one", name: "Северная столица", isPrimary: true },
  { provider: ExternalLeagueProvider.Spbhl, externalTeamId: "two", name: "Северная столица-2", isPrimary: false },
];

beforeEach(() => {
  jest.resetAllMocks();
  create.mockResolvedValue(createdTeam);
  createLink.mockImplementation(async (_, request) => ({ id: request.externalTeamId } as never));
  syncLink.mockResolvedValue({} as never);
  (getMyTeams as jest.MockedFunction<typeof getMyTeams>).mockResolvedValue([createdTeam]);
  (getPublicTeams as jest.MockedFunction<typeof getPublicTeams>).mockResolvedValue([]);
});

test("keeps the old create flow when no league profile is selected", async () => {
  const { result } = renderHook(() => useTeamsPage({ id: "user" } as never));
  act(() => result.current.setCreateName("Обычная команда"));
  let outcome: Awaited<ReturnType<typeof result.current.createNewTeam>> = null;
  await act(async () => { outcome = await result.current.createNewTeam([]); });

  expect((outcome as CreateTeamOutcome | null)?.team.id).toBe("team-new");
  expect(createLink).not.toHaveBeenCalled();
  expect(syncLink).not.toHaveBeenCalled();
  expect(result.current.activeTab).toBe("my");
});

test("creates the team once, links all selected profiles and reports partial failure", async () => {
  syncLink.mockResolvedValueOnce({} as never).mockRejectedValueOnce(new Error("upstream"));
  const { result } = renderHook(() => useTeamsPage({ id: "user" } as never));
  act(() => result.current.setCreateName("Северная столица"));
  let outcome: Awaited<ReturnType<typeof result.current.createNewTeam>> = null;
  await act(async () => { outcome = await result.current.createNewTeam(selected); });

  expect(create).toHaveBeenCalledTimes(1);
  expect(createLink).toHaveBeenNthCalledWith(1, "team-new", { provider: 1, externalTeamId: "one", isPrimary: true });
  expect(createLink).toHaveBeenNthCalledWith(2, "team-new", { provider: 1, externalTeamId: "two", isPrimary: false });
  expect(syncLink).toHaveBeenNthCalledWith(1, "team-new", "one");
  expect(syncLink).toHaveBeenNthCalledWith(2, "team-new", "two");
  expect((outcome as CreateTeamOutcome | null)?.linked.map((item) => item.externalTeamId)).toEqual(["one"]);
  expect((outcome as CreateTeamOutcome | null)?.failed.map((item) => item.externalTeamId)).toEqual(["two"]);
  expect(result.current.message).toContain("Команда создана");
});

test("guards against a rapid duplicate create submission", async () => {
  let resolveCreate: (team: TeamDto) => void = () => undefined;
  create.mockReturnValue(new Promise((resolve) => { resolveCreate = resolve; }));
  const { result } = renderHook(() => useTeamsPage({ id: "user" } as never));
  act(() => result.current.setCreateName("Команда"));

  let first!: ReturnType<typeof result.current.createNewTeam>;
  let second!: ReturnType<typeof result.current.createNewTeam>;
  act(() => {
    first = result.current.createNewTeam([]);
    second = result.current.createNewTeam([]);
  });
  await expect(second).resolves.toBeNull();
  expect(create).toHaveBeenCalledTimes(1);
  await act(async () => { resolveCreate(createdTeam); await first; });
  expect(create).toHaveBeenCalledTimes(1);
});
