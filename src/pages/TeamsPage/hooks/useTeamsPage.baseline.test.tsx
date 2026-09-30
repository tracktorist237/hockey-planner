import { act, renderHook } from "@testing-library/react";
import { getMyTeams, getPublicTeams, getTeamMembers, joinTeamByCode, joinPublicTeam, updateTeamMember } from "src/api/teams";
import { useTeamsPage } from "./useTeamsPage";
import { TeamDto, TeamMemberDto } from "src/types/teams";

jest.mock("src/api/teams", () => ({
  getMyTeams: jest.fn(), getPublicTeams: jest.fn(), getTeamMembers: jest.fn(),
  joinTeamByCode: jest.fn(), joinPublicTeam: jest.fn(), updateTeamMember: jest.fn(),
  TeamsApiError: class TeamsApiError extends Error {},
}));
const team = { id: "team-b", name: "Baseline", visibility: 1, myRole: 1 } as TeamDto;
const member = { userId: "member-b", role: 3 } as TeamMemberDto;
beforeEach(() => {
  jest.resetAllMocks();
  localStorage.setItem("currentUser", JSON.stringify({ id: "different-cached-user" }));
  (getMyTeams as jest.Mock).mockResolvedValue([team]);
  (getPublicTeams as jest.Mock).mockResolvedValue([team]);
  (getTeamMembers as jest.Mock).mockResolvedValue([member]);
  (joinTeamByCode as jest.Mock).mockResolvedValue(team);
  (joinPublicTeam as jest.Mock).mockResolvedValue(team);
  (updateTeamMember as jest.Mock).mockResolvedValue({ ...member, badgeTitle: "Captain" });
});
afterEach(() => localStorage.clear());

test("team page passes its current user separately from team/member resource IDs", async () => {
  const { result } = renderHook(() => useTeamsPage({ id: "page-user" } as never));
  await act(async () => { await result.current.reloadTeams(); });
  expect(getMyTeams).toHaveBeenCalledWith("page-user");
  await act(async () => { await result.current.openTeamManagement(team); });
  expect(getTeamMembers).toHaveBeenCalledWith("team-b");
  await act(async () => { await result.current.saveTeamMember(member, { badgeTitle: "Captain" }); });
  expect(updateTeamMember).toHaveBeenCalledWith("team-b", "member-b", { badgeTitle: "Captain" }, "page-user");
  act(() => { result.current.setJoinCode(" CODE "); result.current.setJoinTeamNumber("0"); });
  await act(async () => { await result.current.joinByCode(); });
  expect(joinTeamByCode).toHaveBeenCalledWith({ code: "CODE", teamJerseyNumber: 0 }, "page-user");
  act(() => result.current.setSelectedPublicTeam(team));
  await act(async () => { await result.current.joinSelectedPublicTeam(); });
  expect(joinPublicTeam).toHaveBeenCalledWith("team-b", "page-user");
});
