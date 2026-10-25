import { render, screen } from "@testing-library/react";
import { EventAdditionalInfo } from "src/pages/EventPage/components/EventAdditionalInfo";
import { EventDto, EventType } from "src/types/events";

const eventDetails = (values: Partial<EventDto> = {}): EventDto => ({
  id: "event-1",
  title: "Тренировка",
  type: EventType.Practice,
  startTime: "2026-10-25T17:00:00Z",
  durationMinutes: 90,
  status: 1,
  createdAt: "2026-10-01T12:00:00Z",
  ...values,
});

const venue = "Ледовый комплекс «АСК-С»";
const address = "Санкт-Петербург, Стрельна, Фронтовая ул., 3";
const mapsUrl = (query: string): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

test("venue and address are separate accessible map links", () => {
  render(<EventAdditionalInfo event={eventDetails({ locationName: venue, locationAddress: address, iceRinkNumber: "Д4" })} />);

  const venueLink = screen.getByRole("link", { name: `Показать на карте место ${venue}` });
  const addressLink = screen.getByRole("link", { name: `Показать на карте адрес ${address}` });
  expect(venueLink).toHaveAttribute("href", mapsUrl(`${venue}, ${address}`));
  expect(addressLink).toHaveAttribute("href", mapsUrl(address));
  for (const link of [venueLink, addressLink]) {
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
  expect(screen.getByText("Д4")).toBeInTheDocument();
  expect(screen.getAllByRole("link")).toHaveLength(2);
});

test("venue-only events link to the venue search", () => {
  render(<EventAdditionalInfo event={eventDetails({ locationName: venue })} />);
  const link = screen.getByRole("link", { name: `Показать на карте место ${venue}` });
  expect(link).toHaveAttribute("href", mapsUrl(venue));
  expect(screen.queryByRole("link", { name: /Показать на карте адрес/ })).not.toBeInTheDocument();
});

test("address-only events link to the address search", () => {
  render(<EventAdditionalInfo event={eventDetails({ locationAddress: address })} />);
  expect(screen.getByRole("link", { name: `Показать на карте адрес ${address}` })).toHaveAttribute("href", mapsUrl(address));
  expect(screen.queryByRole("link", { name: /Показать на карте место/ })).not.toBeInTheDocument();
});

test("empty or whitespace-only location fields do not produce map links", () => {
  const view = render(<EventAdditionalInfo event={eventDetails({ locationName: " \t ", locationAddress: "  ", iceRinkNumber: "Д4" })} />);
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.getByText("Д4")).toBeInTheDocument();
  view.rerender(<EventAdditionalInfo event={eventDetails()} />);
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.queryByText("Место проведения")).not.toBeInTheDocument();
});

test("map links encode untrusted query text into a fixed HTTPS URL", () => {
  const value = "javascript:alert(1)&query=#кириллица";
  render(<EventAdditionalInfo event={eventDetails({ locationName: value })} />);
  const link = screen.getByRole("link", { name: `Показать на карте место ${value}` });
  const href = link.getAttribute("href") || "";
  expect(href).toBe(mapsUrl(value));
  const url = new URL(href);
  expect(url.protocol).toBe("https:");
  expect(url.hostname).toBe("www.google.com");
  expect(url.searchParams.get("query")).toBe(value);
});
