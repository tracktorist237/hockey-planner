import { render, screen } from "@testing-library/react";
import { EventInfoCard } from "src/pages/EventPage/components/EventInfoCard";
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

test("event details show tournament, arena, address, score and safe official link", () => {
  render(<EventInfoCard event={{ ...externalEvent, createdAt: "2026-09-01T00:00:00Z" } as EventDto} copySuccess={false} copyEventLink={jest.fn()} />);

  expect(screen.getByText("Лига:")).toBeInTheDocument();
  expect(screen.getAllByText("СПбХЛ · Любитель 3").length).toBeGreaterThan(0);
  expect(screen.queryByText("Дивизион:")).not.toBeInTheDocument();
  expect(screen.queryByText("Лига (дивизион)")).not.toBeInTheDocument();
  expect(screen.getByText("Кубок СПбХЛ")).toBeInTheDocument();
  expect(screen.getByText("Ледовый комплекс «АСК-С»")).toBeInTheDocument();
  expect(screen.getByText("Санкт-Петербург, Стрельна, Фронтовая ул., 3")).toBeInTheDocument();
  expect(screen.getAllByText("4 : 2").length).toBeGreaterThan(0);
  expect(screen.getByRole("link", { name: "Официальный матч СПбХЛ ↗" })).toHaveAttribute("href", externalEvent.spbhlMatchUrl);
  expect(screen.getByRole("link", { name: "Официальный матч СПбХЛ ↗" })).toHaveAttribute("rel", "noopener noreferrer");
});

test("rescheduled status is visible separately from the league badge", () => {
  render(<EventCard event={{ ...externalEvent, status: 5 } as EventLookUpDto} onOpen={jest.fn()} />);
  expect(screen.getByText("СПбХЛ · Любитель 3")).toBeInTheDocument();
  expect(screen.getByText("Перенесён")).toBeInTheDocument();
});

test("external badge omits an absent division and details omit an absent address", () => {
  render(<EventInfoCard event={{ ...externalEvent, externalDivisionName: null, locationAddress: undefined, createdAt: "2026-09-01T00:00:00Z" } as EventDto} copySuccess={false} copyEventLink={jest.fn()} />);
  expect(screen.getAllByText("СПбХЛ").length).toBeGreaterThan(0);
  expect(screen.queryByText("Адрес:")).not.toBeInTheDocument();
});
