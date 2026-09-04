import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { getTeam, getTeamMembers } from "src/api/teams";
import TeamManagePage from "src/pages/TeamDetailsPage/TeamManagePage";
import { TeamDto, TeamVisibility } from "src/types/teams";
import { User } from "src/types/user";

jest.mock("src/api/teams", () => ({
  getTeam: jest.fn(),
  getTeamMembers: jest.fn(),
  removeTeamMember: jest.fn(),
  updateTeam: jest.fn(),
  updateTeamMember: jest.fn(),
  uploadTeamAvatar: jest.fn(),
  uploadTeamCover: jest.fn(),
}));
jest.mock("src/pages/TeamDetailsPage/TeamExternalLeagueSettings", () => ({
  TeamExternalLeagueSettings: ({ teamId }: { teamId: string }) => <div data-testid="external-league-settings">external:{teamId}</div>,
}));

test("external league settings are inside Profile and the separate SPBHL tab is absent", async () => {
  const team: TeamDto = {
    id: "team",
    name: "Команда",
    description: null,
    avatarUrl: null,
    coverImageUrl: null,
    visibility: TeamVisibility.Private,
    phones: [],
    links: [],
    addresses: [],
    allowDuplicateJerseyNumbers: true,
    blockedJerseyNumbers: [],
    createdByUserId: "user",
    membersCount: 1,
    myRole: 1,
  };
  (getTeam as jest.MockedFunction<typeof getTeam>).mockResolvedValue(team);
  (getTeamMembers as jest.MockedFunction<typeof getTeamMembers>).mockResolvedValue([]);

  render(
    <MemoryRouter initialEntries={["/teams/team/manage"]}>
      <Routes>
        <Route path="/teams/:id/manage" element={<TeamManagePage currentUser={{ id: "user" } as User} />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(await screen.findByText("Профиль команды")).toBeInTheDocument();
  expect(screen.getByTestId("external-league-settings")).toHaveTextContent("external:team");
  expect(screen.queryByRole("button", { name: "СПбХЛ" })).not.toBeInTheDocument();
});
