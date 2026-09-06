import { fireEvent, render, screen, within } from "@testing-library/react";
import { EventInfoCard } from "src/pages/EventPage/components/EventInfoCard";
import { EventAdditionalInfo } from "src/pages/EventPage/components/EventAdditionalInfo";
import { EventCard } from "src/pages/EventsListPage/components/EventCard";
import { EventDto, EventLookUpDto, EventType, ExternalLeagueProvider } from "src/types/events";

const externalEvent = {
  id: "event",
  title: "Северная столица — Соперник",
  type: EventType.Game,
  startTime: "2026-09-04T16:00:00Z",
  durationMinutes: 75,
  status: 3,
  locationName: "Ледовый комплекс «АСК-С»",
  locationAddress: "Санкт-Петербург, Стрельна, Фронтовая ул., 3",
  homeTeamName: "Северная столица",
  awayTeamName: "Соперник",
  externalLeagueProvider: ExternalLeagueProvider.Spbhl,
  externalDivisionName: "Любитель 3",
  externalTournamentName: "Кубок СПбХЛ",
  spbhlTournamentId: 6590,
  spbhlMatchId: 118731,
  spbhlMatchUrl: "https://spbhl.ru/Match?TournamentID=6590&MatchID=118731",
  homeScore: 4,
  awayScore: 2,
};

test("event list shows provider, division and a real finished score", () => {
  render(<EventCard event={externalEvent as EventLookUpDto} onOpen={jest.fn()} />);

  expect(screen.getByText("СПбХЛ · Любитель 3")).toBeInTheDocument();
  expect(screen.getByText("Северная столица 4 : 2 Соперник")).toBeInTheDocument();
});

test("event list does not render an unknown nullable score", () => {
  render(<EventCard event={{ ...externalEvent, homeScore: null, awayScore: null } as EventLookUpDto} onOpen={jest.fn()} />);

  expect(screen.queryByText(/Северная столица 4 : 2/)).not.toBeInTheDocument();
});

test("event details keep external tournament and link without duplicating summary or venue", () => {
  const event = { ...externalEvent, createdAt: "2026-09-01T00:00:00Z" } as EventDto;
  render(<><EventInfoCard event={event} copySuccess={false} copyEventLink={jest.fn()} /><EventAdditionalInfo event={event} /></>);

  expect(screen.getByText("СПбХЛ · Любитель 3")).toBeInTheDocument();
  const details = screen.getByTestId("external-match-details");
  expect(within(details).getByText("Кубок СПбХЛ")).toBeInTheDocument();
  expect(within(details).queryByText("Лига:")).not.toBeInTheDocument();
  expect(within(details).queryByText("Арена:")).not.toBeInTheDocument();
  expect(within(details).queryByText("Адрес:")).not.toBeInTheDocument();
  expect(within(details).queryByText("Счёт:")).not.toBeInTheDocument();
  expect(screen.getByText("Ледовый комплекс «АСК-С»")).toBeInTheDocument();
  expect(screen.getByText("Санкт-Петербург, Стрельна, Фронтовая ул., 3")).toBeInTheDocument();
  expect(within(details).getByRole("link", { name: "Официальный матч СПбХЛ ↗" })).toHaveAttribute("href", externalEvent.spbhlMatchUrl);
  expect(within(details).getByRole("link", { name: "Официальный матч СПбХЛ ↗" })).toHaveAttribute("rel", "noopener noreferrer");
});

test("rescheduled status is visible separately from the league badge", () => {
  render(<EventCard event={{ ...externalEvent, status: 5 } as EventLookUpDto} onOpen={jest.fn()} />);
  expect(screen.getByText("СПбХЛ · Любитель 3")).toBeInTheDocument();
  expect(screen.getByText("Перенесён")).toBeInTheDocument();
});

test("external badge omits an absent division and details omit an absent address", () => {
  render(<EventInfoCard event={{ ...externalEvent, externalDivisionName: null, locationAddress: undefined, createdAt: "2026-09-01T00:00:00Z" } as EventDto} copySuccess={false} copyEventLink={jest.fn()} />);
  expect(screen.getAllByText("СПбХЛ").length).toBeGreaterThan(0);
  expect(within(screen.getByTestId("external-match-details")).queryByText("Адрес:")).not.toBeInTheDocument();
});

test("event overlap badge opens every conflicting event with its actual time range", () => {
  render(<EventCard event={{ ...externalEvent, conflicts: [
    { id: "one", title: "Тренировка", startTime: "2026-09-04T17:00:00Z", durationMinutes: 60, status: 1 },
    { id: "two", title: "Собрание", startTime: "2026-09-04T18:30:00Z", durationMinutes: 30, status: 1 },
  ] } as EventLookUpDto} onOpen={jest.fn()} />);

  fireEvent.click(screen.getByRole("button", { name: "Пересечение" }));
  const dialog = screen.getByRole("dialog", { name: "Пересекающиеся мероприятия" });
  expect(within(dialog).getByRole("link", { name: "Тренировка" })).toHaveAttribute("href", "/events/one");
  expect(within(dialog).getByRole("link", { name: "Собрание" })).toHaveAttribute("href", "/events/two");
  expect(within(dialog).getByText(/20:00–21:00/)).toBeInTheDocument();
});
