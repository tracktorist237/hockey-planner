import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import {
  applyExternalLeagueProfile,
  createTeamExternalLeagueLink,
  deleteTeamExternalLeagueLink,
  ExternalLeagueLink,
  ExternalLeagueProvider,
  getTeamExternalLeagueLinks,
  getExternalLeagueAddressCandidates,
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
  apply: applyExternalLeagueProfile as jest.MockedFunction<typeof applyExternalLeagueProfile>,
  addresses: getExternalLeagueAddressCandidates as jest.MockedFunction<typeof getExternalLeagueAddressCandidates>,
};

const renderSettings = (teamId = "team-a", avatarUrl: string | null = null, coverUrl: string | null = null) => render(
  <TeamExternalLeagueSettings
    teamId={teamId}
    teamName="Local team"
    teamAvatarUrl={avatarUrl}
    teamCoverImageUrl={coverUrl}
    onTeamProfileApplied={jest.fn()}
  />,
);

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
  api.addresses.mockResolvedValue([]);
  jest.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => jest.restoreAllMocks());

test("defaults to SPBHL and renders two linked teams with their divisions", async () => {
  api.getLinks.mockResolvedValue([
    link("one", "Северная столица", "Любитель 1", true),
    link("two", "Северная столица-2", "Любитель 3", false),
  ]);

  renderSettings();

  expect(await screen.findByText("Северная столица")).toBeInTheDocument();
  expect(screen.getByText("Северная столица-2")).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Лига" })).toHaveValue("1");
  expect(screen.getByText("СПбХЛ · Любитель 1")).toBeInTheDocument();
  expect(screen.getByText("СПбХЛ · Любитель 3")).toBeInTheDocument();
  expect(screen.getAllByText("Санкт-Петербург, Россия").length).toBe(2);
  expect(screen.getByText("Основная команда")).toBeInTheDocument();
  expect(screen.getByText(/3 сентября/)).toBeInTheDocument();
  expect(screen.getByText(/Данные обновлены:/)).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: "Открыть на сайте лиги" })).toHaveLength(2);
  expect(screen.getAllByRole("button", { name: "Обновить данные" })).toHaveLength(2);
  expect(screen.getByRole("button", { name: "Обновить все данные" })).toBeInTheDocument();
  expect(screen.queryByText(/Синхронизировать/)).not.toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "Убрать команду" })).toHaveLength(2);
});

test("hides the cover choice when the league has no cover", async () => {
  api.getLinks.mockResolvedValue([link("one", "Северная столица", "Любитель 1", true)]);
  renderSettings();
  const card = await screen.findByTestId("external-link-one");

  fireEvent.click(within(card).getByRole("button", { name: "Перенести данные в профиль" }));

  expect(within(card).queryByRole("checkbox", { name: "Обложка" })).not.toBeInTheDocument();
  expect(within(card).getByText(/Данные получены автоматически с сайта лиги/)).toBeInTheDocument();
  await waitFor(() => expect(within(card).queryByText("Загружаем адреса...")).not.toBeInTheDocument());
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
  renderSettings();
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
  renderSettings();
  const secondCard = await screen.findByTestId("external-link-two");

  fireEvent.click(within(secondCard).getByRole("button", { name: "Сделать основной командой" }));

  await waitFor(() => expect(within(secondCard).getByText("Основная команда")).toBeInTheDocument());
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
  renderSettings();
  const firstCard = await screen.findByTestId("external-link-one");

  fireEvent.click(within(firstCard).getByRole("button", { name: "Обновить данные" }));
  expect(await within(firstCard).findByText("Получено:")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Обновить все данные" }));

  await waitFor(() => expect(api.syncAll).toHaveBeenCalledWith("team-a"));
  expect(screen.getByText(first.externalTeamName)).toBeInTheDocument();
  expect(screen.getByText(second.externalTeamName)).toBeInTheDocument();
  expect(await within(screen.getByTestId("external-link-two")).findByText("Получено:")).toBeInTheDocument();
});

test("removes only the selected link and keeps imported-match warning", async () => {
  const first = link("one", "Северная столица", "Любитель 1", true);
  const second = link("two", "Северная столица-2", "Любитель 3", false);
  api.getLinks.mockResolvedValue([first, second]);
  renderSettings();
  const secondCard = await screen.findByTestId("external-link-two");

  fireEvent.click(within(secondCard).getByRole("button", { name: "Убрать команду" }));

  await waitFor(() => expect(api.remove).toHaveBeenCalledWith("team-a", "two"));
  expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("Уже добавленные матчи останутся"));
  expect(screen.getByText(first.externalTeamName)).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByText(second.externalTeamName)).not.toBeInTheDocument());
});

test("ignores a stale link operation after teamId changes", async () => {
  let resolveSync: (value: ReturnType<typeof syncResult>) => void = () => undefined;
  const delayedSync = new Promise<ReturnType<typeof syncResult>>((resolve) => { resolveSync = resolve; });
  api.getLinks.mockResolvedValueOnce([link("one", "Команда A", "A", true)])
    .mockResolvedValueOnce([{ ...link("two", "Команда B", "B", true), teamId: "team-b" }]);
  api.sync.mockReturnValue(delayedSync);
  const view = renderSettings();
  const firstCard = await screen.findByTestId("external-link-one");
  fireEvent.click(within(firstCard).getByRole("button", { name: "Обновить данные" }));

  view.rerender(<TeamExternalLeagueSettings teamId="team-b" teamName="Team B" teamAvatarUrl={null} teamCoverImageUrl={null} onTeamProfileApplied={jest.fn()} />);
  expect(await screen.findByText("Команда B")).toBeInTheDocument();
  await act(async () => resolveSync(syncResult("one")));

  expect(screen.getByText("Команда B")).toBeInTheDocument();
  expect(screen.queryByText("Команда A")).not.toBeInTheDocument();
  expect(screen.queryByText("Данные «Команда A» обновлены.")).not.toBeInTheDocument();
});

test("applies official logo and cover without silently overwriting custom images", async () => {
  const official = { ...link("one", "Official team", "Любитель 1", true), logoUrl: "https://spbhl.ru/logo.png", coverUrl: "https://spbhl.ru/cover.jpg" };
  api.getLinks.mockResolvedValue([official]);
  api.apply.mockResolvedValue({ teamId: "team-a", name: "Local team", avatarUrl: official.logoUrl, coverImageUrl: official.coverUrl });
  renderSettings("team-a", "https://local/avatar.png", "https://local/cover.jpg");
  const card = await screen.findByTestId("external-link-one");

  fireEvent.click(within(card).getByRole("button", { name: "Перенести данные в профиль" }));
  expect(within(card).getByRole("checkbox", { name: "Логотип" })).not.toBeChecked();
  expect(within(card).getByRole("checkbox", { name: "Обложка" })).not.toBeChecked();
  fireEvent.click(within(card).getByRole("checkbox", { name: "Логотип" }));
  fireEvent.click(within(card).getByRole("checkbox", { name: "Обложка" }));
  fireEvent.click(within(card).getByRole("button", { name: "Добавить выбранное в профиль" }));

  await waitFor(() => expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("заменят текущие изображения")));
  expect(api.apply).toHaveBeenCalledWith("team-a", "one", { useName: false, useLogo: true, useCover: true, useDescriptionMetadata: false, selectedPhoneCandidateIds: [], selectedWebsiteCandidateIds: [], selectedAddressCandidateIds: [] });
  expect(within(card).getByAltText("Логотип с сайта лиги")).toHaveAttribute("src", official.logoUrl);
  expect(within(card).getByAltText("Обложка с сайта лиги")).toHaveAttribute("src", official.coverUrl);
});

test("imports authoritative metadata and structured candidates then refreshes the team", async () => {
  const official = {
    ...link("one", "Official team", "Любитель 1", true),
    foundedYear: 2015,
    coachName: "Тренер",
    administratorName: "Администратор",
    phoneCandidates: [{ candidateId: "phone-1", value: "8 (911) 139-02-69", label: "Администратор" }],
    websiteCandidates: [{ candidateId: "web-1", value: "https://example.ru", label: "Сайт команды" }],
  };
  const refreshed = jest.fn().mockResolvedValue(undefined);
  api.getLinks.mockResolvedValue([official]);
  api.addresses.mockResolvedValue([{ candidateId: "address-1", venueName: "АСК-С", address: "Фронтовая ул., 3", matchCount: 8 }]);
  api.apply.mockResolvedValue({ teamId: "team-a", name: "Official team", avatarUrl: null, coverImageUrl: null });
  render(<TeamExternalLeagueSettings teamId="team-a" teamName="Local team" teamAvatarUrl={null} teamCoverImageUrl={null} teamDescription="Мой текст" teamPhones={[]} teamLinks={[]} teamAddresses={[]} onTeamProfileApplied={refreshed} />);
  const card = await screen.findByTestId("external-link-one");
  fireEvent.click(within(card).getByRole("button", { name: "Перенести данные в профиль" }));
  expect(within(card).getByText(/могут быть неточности/)).toBeInTheDocument();
  expect(within(card).getByText("Администратор")).toBeInTheDocument();
  expect(within(card).getByText("Сайт команды")).toBeInTheDocument();
  expect(await within(card).findByText("8 (911) 139-02-69")).toBeInTheDocument();
  expect(within(card).getByText("https://example.ru")).toBeInTheDocument();
  expect(await within(card).findByText(/Фронтовая ул., 3/)).toBeInTheDocument();
  fireEvent.click(within(card).getByRole("checkbox", { name: /Информация о команде/ }));
  fireEvent.click(within(card).getByRole("checkbox", { name: /Администратор.*8 \(911\) 139-02-69/ }));
  fireEvent.click(within(card).getByRole("checkbox", { name: /Сайт команды.*https:\/\/example.ru/ }));
  fireEvent.click(within(card).getByRole("checkbox", { name: /АСК-С/ }));
  fireEvent.click(within(card).getByRole("button", { name: "Добавить выбранное в профиль" }));
  await waitFor(() => expect(api.apply).toHaveBeenCalledWith("team-a", "one", expect.objectContaining({
    useDescriptionMetadata: true,
    selectedPhoneCandidateIds: ["phone-1"],
    selectedWebsiteCandidateIds: ["web-1"],
    selectedAddressCandidateIds: ["address-1"],
  })));
  expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("Ваш текущий текст сохранится"));
  await waitFor(() => expect(refreshed).toHaveBeenCalled());
});

test("marks existing structured candidates as disabled", async () => {
  const official = { ...link("one", "Official team", "Любитель 1", true), phoneCandidates: [{ candidateId: "p", value: "8 (911) 139-02-69" }], websiteCandidates: [{ candidateId: "w", value: "https://example.ru/" }] };
  api.getLinks.mockResolvedValue([official]);
  api.addresses.mockResolvedValue([{ candidateId: "a", venueName: "Арена", address: "Фронтовая ул., 3", matchCount: 2 }]);
  render(<TeamExternalLeagueSettings teamId="team-a" teamName="Local" teamAvatarUrl={null} teamCoverImageUrl={null} teamPhones={[{ title: "Ручной", value: " 8 (911) 139-02-69 " }]} teamLinks={[{ title: "Сайт", value: "https://example.ru" }]} teamAddresses={[{ title: "Адрес", value: "фронтовая   ул., 3" }]} onTeamProfileApplied={jest.fn()} />);
  const card = await screen.findByTestId("external-link-one");
  fireEvent.click(within(card).getByRole("button", { name: "Перенести данные в профиль" }));
  await within(card).findByText(/Фронтовая/);
  expect(within(card).getByRole("checkbox", { name: /8 \(911\) 139-02-69/ })).toBeDisabled();
  expect(within(card).getByRole("checkbox", { name: /https:\/\/example.ru\// })).toBeDisabled();
  expect(within(card).getByRole("checkbox", { name: /Арена/ })).toBeDisabled();
  expect(within(card).getAllByText(/Уже добавлен/).length).toBeGreaterThanOrEqual(3);
});

test("does not apply a completed Team A import after switching to Team B", async () => {
  let resolveApply: (value: { teamId: string; name: string; avatarUrl: null; coverImageUrl: null }) => void = () => undefined;
  const delayedApply = new Promise<{ teamId: string; name: string; avatarUrl: null; coverImageUrl: null }>((resolve) => { resolveApply = resolve; });
  api.getLinks.mockResolvedValueOnce([link("one", "Команда A", "A", true)]).mockResolvedValueOnce([{ ...link("two", "Команда B", "B", true), teamId: "team-b" }]);
  api.apply.mockReturnValue(delayedApply);
  const appliedA = jest.fn();
  const view = render(<TeamExternalLeagueSettings teamId="team-a" teamName="A" teamAvatarUrl={null} teamCoverImageUrl={null} onTeamProfileApplied={appliedA} />);
  const cardA = await screen.findByTestId("external-link-one");
  fireEvent.click(within(cardA).getByRole("button", { name: "Перенести данные в профиль" }));
  fireEvent.click(within(cardA).getByRole("checkbox", { name: /Название/ }));
  fireEvent.click(within(cardA).getByRole("button", { name: "Добавить выбранное в профиль" }));
  view.rerender(<TeamExternalLeagueSettings teamId="team-b" teamName="B" teamAvatarUrl={null} teamCoverImageUrl={null} onTeamProfileApplied={jest.fn()} />);
  expect(await screen.findByText("Команда B")).toBeInTheDocument();
  await act(async () => resolveApply({ teamId: "team-a", name: "Команда A", avatarUrl: null, coverImageUrl: null }));
  expect(appliedA).not.toHaveBeenCalled();
  expect(screen.getByText("Команда B")).toBeInTheDocument();
  expect(screen.queryByText("Данные «Команда A» добавлены в профиль.")).not.toBeInTheDocument();
});
