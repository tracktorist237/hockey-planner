import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import {
  createTeamExternalLeagueLink,
  deleteTeamExternalLeagueLink,
  ExternalLeagueLink,
  ExternalLeagueProvider,
  getTeamExternalLeagueLinks,
  searchExternalLeagueTeams,
  syncAllTeamExternalLeagueLinks,
  syncTeamExternalLeagueLink,
} from "src/api/externalLeagueTeams";
import { TeamExternalLeagueSettings } from "src/pages/TeamDetailsPage/TeamExternalLeagueSettings";

jest.mock("src/api/externalLeagueTeams");

const api = {
  getLinks: getTeamExternalLeagueLinks as jest.MockedFunction<typeof getTeamExternalLeagueLinks>,
  search: searchExternalLeagueTeams as jest.MockedFunction<typeof searchExternalLeagueTeams>,
  create: createTeamExternalLeagueLink as jest.MockedFunction<typeof createTeamExternalLeagueLink>,
  remove: deleteTeamExternalLeagueLink as jest.MockedFunction<typeof deleteTeamExternalLeagueLink>,
  sync: syncTeamExternalLeagueLink as jest.MockedFunction<typeof syncTeamExternalLeagueLink>,
  syncAll: syncAllTeamExternalLeagueLinks as jest.MockedFunction<typeof syncAllTeamExternalLeagueLinks>,
};

const link = (id: string, name: string, division: string, isPrimary: boolean): ExternalLeagueLink => ({
  id,
  teamId: "team-a",
  provider: ExternalLeagueProvider.Spbhl,
  externalTeamId: `external-${id}`,
  externalTeamName: name,
  divisionName: division,
  profileUrl: `https://spbhl.ru/Team?TeamID=${id}`,
  logoUrl: null,
  coverUrl: null,
  city: "Санкт-Петербург",
  country: "Россия",
  isPrimary,
  lastSyncAttemptAt: null,
  lastSuccessfulSyncAt: isPrimary ? "2026-09-03T09:45:00Z" : null,
});

const syncResult = (linkId: string) => ({
  teamId: "team-a",
  linkId,
  provider: ExternalLeagueProvider.Spbhl,
  externalTeamId: `external-${linkId}`,
  receivedCount: 4,
  createdCount: 1,
  updatedCount: 2,
  unchangedCount: 1,
  enrichmentRequestCount: 0,
  syncedAt: "2026-09-04T08:00:00Z",
});

beforeEach(() => {
  jest.resetAllMocks();
  api.getLinks.mockResolvedValue([]);
  api.search.mockResolvedValue([]);
  api.remove.mockResolvedValue(undefined);
  jest.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => jest.restoreAllMocks());

test("defaults to SPBHL and renders two linked teams with their divisions", async () => {
  api.getLinks.mockResolvedValue([
    link("one", "Северная столица", "Любитель 1", true),
    link("two", "Северная столица-2", "Любитель 3", false),
  ]);

  render(<TeamExternalLeagueSettings teamId="team-a" />);

  expect(await screen.findByText("Северная столица")).toBeInTheDocument();
  expect(screen.getByText("Северная столица-2")).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Лига" })).toHaveValue("1");
  expect(screen.getByText("СПбХЛ · Любитель 1")).toBeInTheDocument();
  expect(screen.getByText("СПбХЛ · Любитель 3")).toBeInTheDocument();
  expect(screen.getByText("Основной профиль")).toBeInTheDocument();
  expect(screen.getByText(/3 сентября/)).toBeInTheDocument();
});

test("adds a second external team without replacing the first", async () => {
  const first = link("one", "Северная столица", "Любитель 1", true);
  const second = link("two", "Северная столица-2", "Любитель 3", false);
  api.getLinks.mockResolvedValue([first]);
  api.search.mockResolvedValue([{
    provider: ExternalLeagueProvider.Spbhl,
    externalTeamId: second.externalTeamId,
    name: second.externalTeamName,
    city: second.city,
    country: second.country,
    divisionName: second.divisionName,
    profileUrl: second.profileUrl,
  }]);
  api.create.mockResolvedValue(second);
  render(<TeamExternalLeagueSettings teamId="team-a" />);
  await screen.findByText(first.externalTeamName);

  fireEvent.click(screen.getByText("+ Добавить команду"));
  fireEvent.change(screen.getByPlaceholderText("Название команды"), { target: { value: "Северная" } });
  fireEvent.click(screen.getByRole("button", { name: "Найти команду" }));
  await screen.findByText(second.externalTeamName);
  fireEvent.click(screen.getByRole("button", { name: "Добавить" }));

  expect(await screen.findByText(`Команда «${second.externalTeamName}» добавлена.`)).toBeInTheDocument();
  expect(screen.getByText(first.externalTeamName)).toBeInTheDocument();
  expect(screen.getByText(second.externalTeamName)).toBeInTheDocument();
  expect(api.create).toHaveBeenCalledWith("team-a", {
    provider: ExternalLeagueProvider.Spbhl,
    externalTeamId: second.externalTeamId,
    isPrimary: false,
  });
});

test("switches primary through the authoritative create-link endpoint", async () => {
  const first = link("one", "Северная столица", "Любитель 1", true);
  const second = link("two", "Северная столица-2", "Любитель 3", false);
  api.getLinks.mockResolvedValue([first, second]);
  api.create.mockResolvedValue({ ...second, isPrimary: true });
  render(<TeamExternalLeagueSettings teamId="team-a" />);
  const secondCard = await screen.findByTestId("external-link-two");

  fireEvent.click(within(secondCard).getByRole("button", { name: "Сделать основным" }));

  await waitFor(() => expect(within(secondCard).getByText("Основной профиль")).toBeInTheDocument());
  expect(api.create).toHaveBeenCalledWith("team-a", {
    provider: ExternalLeagueProvider.Spbhl,
    externalTeamId: second.externalTeamId,
    isPrimary: true,
  });
});

test("synchronizes one link and all links without hiding cards", async () => {
  const first = link("one", "Северная столица", "Любитель 1", true);
  const second = link("two", "Северная столица-2", "Любитель 3", false);
  api.getLinks.mockResolvedValue([first, second]);
  api.sync.mockResolvedValue(syncResult("one"));
  api.syncAll.mockResolvedValue([syncResult("one"), syncResult("two")]);
  render(<TeamExternalLeagueSettings teamId="team-a" />);
  const firstCard = await screen.findByTestId("external-link-one");

  fireEvent.click(within(firstCard).getByRole("button", { name: "Синхронизировать" }));
  expect(await within(firstCard).findByText("Получено:")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Синхронизировать все" }));

  await waitFor(() => expect(api.syncAll).toHaveBeenCalledWith("team-a"));
  expect(screen.getByText(first.externalTeamName)).toBeInTheDocument();
  expect(screen.getByText(second.externalTeamName)).toBeInTheDocument();
  expect(await within(screen.getByTestId("external-link-two")).findByText("Получено:")).toBeInTheDocument();
});

test("removes only the selected link and keeps imported-match warning", async () => {
  const first = link("one", "Северная столица", "Любитель 1", true);
  const second = link("two", "Северная столица-2", "Любитель 3", false);
  api.getLinks.mockResolvedValue([first, second]);
  render(<TeamExternalLeagueSettings teamId="team-a" />);
  const secondCard = await screen.findByTestId("external-link-two");

  fireEvent.click(within(secondCard).getByRole("button", { name: "Удалить" }));

  await waitFor(() => expect(api.remove).toHaveBeenCalledWith("team-a", "two"));
  expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("Ранее импортированные матчи останутся"));
  expect(screen.getByText(first.externalTeamName)).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByText(second.externalTeamName)).not.toBeInTheDocument());
});

test("ignores a stale link operation after teamId changes", async () => {
  let resolveSync: (value: ReturnType<typeof syncResult>) => void = () => undefined;
  const delayedSync = new Promise<ReturnType<typeof syncResult>>((resolve) => { resolveSync = resolve; });
  api.getLinks.mockResolvedValueOnce([link("one", "Команда A", "A", true)])
    .mockResolvedValueOnce([{ ...link("two", "Команда B", "B", true), teamId: "team-b" }]);
  api.sync.mockReturnValue(delayedSync);
  const view = render(<TeamExternalLeagueSettings teamId="team-a" />);
  const firstCard = await screen.findByTestId("external-link-one");
  fireEvent.click(within(firstCard).getByRole("button", { name: "Синхронизировать" }));

  view.rerender(<TeamExternalLeagueSettings teamId="team-b" />);
  expect(await screen.findByText("Команда B")).toBeInTheDocument();
  await act(async () => resolveSync(syncResult("one")));

  expect(screen.getByText("Команда B")).toBeInTheDocument();
  expect(screen.queryByText("Команда A")).not.toBeInTheDocument();
  expect(screen.queryByText("Расписание «Команда A» обновлено.")).not.toBeInTheDocument();
});
