import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { TeamsPage } from "src/pages/TeamsPage";
import { useTeamsPage } from "src/pages/TeamsPage/hooks/useTeamsPage";

jest.mock("src/pages/TeamsPage/hooks/useTeamsPage");
jest.mock("src/pages/TeamsPage/components/CreateTeamTab", () => ({
  CreateTeamTab: ({ onCreate }: { onCreate: (items: unknown[]) => void }) => (
    <button type="button" onClick={() => onCreate([{ provider: 1, externalTeamId: "one", name: "Профиль", isPrimary: true }])}>test-create</button>
  ),
}));
jest.mock("src/components/BottomNav", () => ({ BottomNav: () => null }));
jest.mock("src/components/MainPageHeader", () => ({ MainPageHeader: () => null }));

const mockedUseTeamsPage = useTeamsPage as jest.MockedFunction<typeof useTeamsPage>;

function Destination() {
  const location = useLocation();
  return <div>{location.pathname}|{location.state?.teamCreationNotice}</div>;
}

const setPageOutcome = (outcome: unknown) => {
  mockedUseTeamsPage.mockReturnValue({
    activeTab: "create",
    apiUnavailable: false,
    availablePublicTeams: [],
    createName: "Команда",
    createPublic: true,
    error: null,
    joinCode: "",
    joining: false,
    joinTeamNumber: "",
    loaded: true,
    loading: false,
    managedTeam: null,
    memberSavingId: null,
    membersLoading: false,
    message: null,
    myTeams: [],
    pinnedTeamIds: [],
    selectedPublicTeam: null,
    teamMembers: [],
    closeTeamManagement: jest.fn(),
    createNewTeam: jest.fn().mockResolvedValue(outcome),
    joinByCode: jest.fn(),
    joinSelectedPublicTeam: jest.fn(),
    openTeamManagement: jest.fn(),
    reloadTeams: jest.fn(),
    saveTeamMember: jest.fn(),
    setActiveTab: jest.fn(),
    setCreateName: jest.fn(),
    setCreatePublic: jest.fn(),
    setError: jest.fn(),
    setJoinCode: jest.fn(),
    setJoinTeamNumber: jest.fn(),
    setMessage: jest.fn(),
    setSelectedPublicTeam: jest.fn(),
    togglePinnedTeam: jest.fn(),
  } as unknown as ReturnType<typeof useTeamsPage>);
};

const renderPage = () => render(
  <MemoryRouter initialEntries={["/teams"]}>
    <Routes>
      <Route path="/teams" element={<TeamsPage currentUser={{ id: "user" } as never} currentTeamId={null} currentTeamName={null} onTeamChange={jest.fn()} />} />
      <Route path="/teams/:id/manage" element={<Destination />} />
    </Routes>
  </MemoryRouter>,
);

test("navigates to the created team profile after successful linking", async () => {
  setPageOutcome({
    team: { id: "new-team", name: "Команда" },
    linked: [{ provider: 1, externalTeamId: "one", name: "Профиль", isPrimary: true }],
    failed: [],
  });
  renderPage();

  fireEvent.click(screen.getByRole("button", { name: "test-create" }));

  expect(await screen.findByText(/\/teams\/new-team\/manage/)).toHaveTextContent("Официальные профили успешно добавлены");
});

test("navigates to the created team profile with a useful partial-link warning", async () => {
  setPageOutcome({
    team: { id: "new-team", name: "Команда" },
    linked: [],
    failed: [{ provider: 1, externalTeamId: "one", name: "Профиль", isPrimary: true }],
  });

  renderPage();

  fireEvent.click(screen.getByRole("button", { name: "test-create" }));

  expect(await screen.findByText(/\/teams\/new-team\/manage/)).toHaveTextContent("не удалось добавить: Профиль");
});
