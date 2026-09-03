import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { bindTeamSpbhl, getTeamSpbhlStatus, searchSpbhlTeams, syncTeamSpbhlNow, unbindTeamSpbhl } from "src/api/teamSpbhl";
import { TeamSpbhlSettings } from "src/pages/TeamDetailsPage/TeamSpbhlSettings";

jest.mock("src/api/teamSpbhl");
const getStatus = getTeamSpbhlStatus as jest.MockedFunction<typeof getTeamSpbhlStatus>;
const search = searchSpbhlTeams as jest.MockedFunction<typeof searchSpbhlTeams>;
const bind = bindTeamSpbhl as jest.MockedFunction<typeof bindTeamSpbhl>;
const sync = syncTeamSpbhlNow as jest.MockedFunction<typeof syncTeamSpbhlNow>;
const unbind = unbindTeamSpbhl as jest.MockedFunction<typeof unbindTeamSpbhl>;

const unlinked = { teamId: "team", isLinked: false, spbhlTeamId: null, spbhlTeamName: null, profileUrl: null, lastSyncAttemptAt: null, lastSuccessfulSyncAt: null };
const linked = { ...unlinked, isLinked: true, spbhlTeamId: "external", spbhlTeamName: "Ладога", profileUrl: "https://spbhl.ru/team", lastSuccessfulSyncAt: "2026-09-03T09:45:00Z" };
const item = { teamId: "external", name: "Ладога", city: "Санкт-Петербург", country: "Россия", divisionName: "Высшая лига", profileUrl: "https://spbhl.ru/team" };
const summary = { teamId: "team", spbhlTeamId: "external", receivedCount: 3, createdCount: 2, updatedCount: 1, unchangedCount: 0, syncedAt: "2026-09-03T09:45:00Z" };

beforeEach(() => {
  jest.resetAllMocks();
  getStatus.mockResolvedValue(unlinked);
  jest.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => jest.restoreAllMocks());

async function searchForTeam() {
  search.mockResolvedValue([item]);
  render(<TeamSpbhlSettings teamId="team" />);
  await screen.findByText("Привязка к СПбХЛ");
  fireEvent.change(screen.getByPlaceholderText("Название команды в СПбХЛ"), { target: { value: "  Ладога  " } });
  fireEvent.click(screen.getByRole("button", { name: "Найти команду" }));
  await screen.findByText("Санкт-Петербург, Россия");
}

test("unlinked state searches only on submit and renders cards", async () => {
  await searchForTeam();
  expect(search).toHaveBeenCalledWith("team", "Ладога");
  expect(screen.getByText("Высшая лига")).toBeInTheDocument();
});

test("failed initial status load does not present an unlinked team", async () => {
  getStatus.mockRejectedValue(new Error("Не удалось загрузить привязку"));
  render(<TeamSpbhlSettings teamId="team" />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось загрузить привязку");
  expect(screen.queryByPlaceholderText("Название команды в СПбХЛ")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Повторить загрузку" })).toBeInTheDocument();
});

test("successful bind switches to linked state and shows summary", async () => {
  bind.mockResolvedValue({ link: linked, initialSyncSucceeded: true, sync: summary, syncError: null });
  await searchForTeam();
  fireEvent.click(screen.getByRole("button", { name: "Привязать" }));
  expect(await screen.findByText("✓ Команда привязана")).toBeInTheDocument();
  expect(screen.getByText("Команда привязана. Расписание синхронизировано.")).toBeInTheDocument();
  expect(screen.getByText(/Получено:/)).toHaveTextContent("Получено: 3");
});

test("failed initial sync preserves linked UI and shows warning", async () => {
  bind.mockResolvedValue({ link: linked, initialSyncSucceeded: false, sync: null, syncError: "Команда привязана, но расписание пока не удалось загрузить." });
  await searchForTeam();
  fireEvent.click(screen.getByRole("button", { name: "Привязать" }));
  expect(await screen.findByText("✓ Команда привязана")).toBeInTheDocument();
  expect(screen.getByText("Команда привязана, но расписание пока не удалось загрузить.")).toBeInTheDocument();
});

test("sync success keeps link, shows summary and refreshes timestamp", async () => {
  getStatus.mockResolvedValue(linked);
  sync.mockResolvedValue(summary);
  render(<TeamSpbhlSettings teamId="team" />);
  fireEvent.click(await screen.findByRole("button", { name: "Синхронизировать сейчас" }));
  expect(await screen.findByText("Расписание обновлено.")).toBeInTheDocument();
  expect(sync).toHaveBeenCalledWith("team");
  await waitFor(() => expect(getStatus).toHaveBeenCalledTimes(2));
});

test("rapid repeated sync starts only one request", async () => {
  getStatus.mockResolvedValue(linked);
  let resolveSync!: (value: typeof summary) => void;
  sync.mockImplementation(() => new Promise((resolve) => { resolveSync = resolve; }));
  render(<TeamSpbhlSettings teamId="team" />);
  const button = await screen.findByRole("button", { name: "Синхронизировать сейчас" });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(sync).toHaveBeenCalledTimes(1);
  resolveSync(summary);
  await screen.findByText("Расписание обновлено.");
});

test("stale sync from previous team cannot overwrite or unlock the current team", async () => {
  const linkedA = { ...linked, teamId: "team-a", spbhlTeamName: "Команда A" };
  const linkedB = { ...linked, teamId: "team-b", spbhlTeamName: "Команда B" };
  const summaryA = { ...summary, teamId: "team-a", receivedCount: 99 };
  const summaryB = { ...summary, teamId: "team-b", receivedCount: 4 };
  getStatus.mockImplementation((teamId) => Promise.resolve(teamId === "team-a" ? linkedA : linkedB));
  let resolveA!: (value: typeof summaryA) => void;
  let resolveB!: (value: typeof summaryB) => void;
  sync.mockImplementation((teamId) => new Promise((resolve) => {
    if (teamId === "team-a") resolveA = resolve;
    else resolveB = resolve;
  }));

  const { rerender } = render(<TeamSpbhlSettings teamId="team-a" />);
  fireEvent.click(await screen.findByRole("button", { name: "Синхронизировать сейчас" }));
  rerender(<TeamSpbhlSettings teamId="team-b" />);
  expect(await screen.findByText("Команда B")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Синхронизировать сейчас" }));

  await act(async () => { resolveA(summaryA); });

  expect(screen.getByText("Команда B")).toBeInTheDocument();
  expect(screen.queryByText("Команда A")).not.toBeInTheDocument();
  expect(screen.queryByText(/Получено:/)).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Синхронизируем..." })).toBeDisabled();

  await act(async () => { resolveB(summaryB); });
  expect(await screen.findByText(/Получено:/)).toHaveTextContent("Получено: 4");
});

test("failed status refresh after sync preserves linked state and summary", async () => {
  getStatus.mockResolvedValueOnce(linked).mockRejectedValueOnce(new Error("Не удалось загрузить статус"));
  sync.mockResolvedValue(summary);
  render(<TeamSpbhlSettings teamId="team" />);
  fireEvent.click(await screen.findByRole("button", { name: "Синхронизировать сейчас" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось загрузить статус");
  expect(screen.getByText("✓ Команда привязана")).toBeInTheDocument();
  expect(screen.getByText(/Получено:/)).toHaveTextContent("Получено: 3");
});

test("sync failure does not remove linked state", async () => {
  getStatus.mockResolvedValue(linked);
  sync.mockRejectedValue(new Error("Не удалось получить данные СПбХЛ. Попробуйте позже."));
  render(<TeamSpbhlSettings teamId="team" />);
  fireEvent.click(await screen.findByRole("button", { name: "Синхронизировать сейчас" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось получить данные СПбХЛ");
  expect(screen.getByText("✓ Команда привязана")).toBeInTheDocument();
});

test("confirmed unbind returns to unlinked state without claiming events were deleted", async () => {
  getStatus.mockResolvedValue(linked);
  unbind.mockResolvedValue(unlinked);
  render(<TeamSpbhlSettings teamId="team" />);
  fireEvent.click(await screen.findByRole("button", { name: "Удалить привязку" }));
  expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("Ранее импортированные матчи останутся"));
  expect(await screen.findByText("Привязка к СПбХЛ удалена.")).toBeInTheDocument();
  expect(screen.getByText("Привязка к СПбХЛ")).toBeInTheDocument();
});

test("linked state renders safe external profile and human timestamp", async () => {
  getStatus.mockResolvedValue(linked);
  render(<TeamSpbhlSettings teamId="team" />);
  const profile = await screen.findByRole("link", { name: /Открыть профиль СПбХЛ/ });
  expect(profile).toHaveAttribute("href", linked.profileUrl);
  expect(profile).toHaveAttribute("target", "_blank");
  expect(profile).toHaveAttribute("rel", "noopener noreferrer");
  expect(screen.getByText(/сентября/)).not.toHaveTextContent("2026-09-03T09:45:00Z");
});
