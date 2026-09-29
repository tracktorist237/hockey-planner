import { useState } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { authFetch } from "src/api/auth";
import attendanceConflict from "src/api/__fixtures__/attendanceConflict.json";
import { AppErrorBoundary } from "src/components/AppErrorBoundary";
import { AttendanceResponseCard } from "src/pages/EventPage/components/AttendanceResponseCard";
import { useAttendance } from "src/pages/EventPage/hooks/useAttendance";
import { EventDto, EventType } from "src/types/events";

jest.mock("src/api/auth", () => ({ authFetch: jest.fn() }));
const mockedAuthFetch = authFetch as jest.MockedFunction<typeof authFetch>;
const event = { id: "event", teamId: "team", title: "Матч", type: EventType.Game, status: 1, startTime: "2026-09-29T18:30:00Z", durationMinutes: 75, createdAt: "2026-09-01T00:00:00Z", attendances: [] } as EventDto;
const response = (body: unknown, status = 200) => ({
  ok: status < 400, status, json: jest.fn().mockResolvedValue(body),
}) as unknown as Response;

function Attendance({ reloadEvent }: { reloadEvent: () => Promise<EventDto | null> }) {
  const [error, setError] = useState("");
  const attendance = useAttendance({ event, selectedUserId: "user", reloadEvent, onError: setError });
  return <>{error && <div role="alert">{error}</div>}<AttendanceResponseCard {...attendance} /></>;
}

const renderAttendance = () => {
  const reloadEvent = jest.fn().mockResolvedValue(event);
  render(<AppErrorBoundary><Attendance reloadEvent={reloadEvent} /></AppErrorBoundary>);
  return reloadEvent;
};

beforeEach(() => mockedAuthFetch.mockReset());

test("M5 ProblemDetails reaches the real hook and dialog without crashing; confirmation saves with ignoreConflicts", async () => {
  mockedAuthFetch.mockResolvedValueOnce(response(attendanceConflict, 409)).mockResolvedValueOnce(response({}));
  const reloadEvent = renderAttendance();

  fireEvent.click(screen.getByRole("button", { name: /Смогу$/ }));
  const dialog = await screen.findByRole("dialog", { name: attendanceConflict.detail });
  expect(screen.queryByText("Не удалось открыть приложение")).not.toBeInTheDocument();
  for (const conflict of attendanceConflict.conflicts) {
    expect(within(dialog).getByRole("link", { name: conflict.Title })).toHaveAttribute("href", `/events/${conflict.Id}`);
    const start = new Date(conflict.StartTime);
    const end = new Date(start.getTime() + conflict.DurationMinutes * 60_000);
    const time = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" });
    expect(within(dialog).getByText(new RegExp(`${time.format(start)}–${time.format(end)}`))).toBeInTheDocument();
  }
  expect(within(dialog).getByText("Другая команда")).toBeInTheDocument();
  expect(reloadEvent).not.toHaveBeenCalled();
  expect(mockedAuthFetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(mockedAuthFetch.mock.calls[0][1]!.body as string)).toMatchObject({ status: 2, ignoreConflicts: false });

  fireEvent.click(within(dialog).getByRole("button", { name: "Всё равно смогу" }));
  await waitFor(() => expect(reloadEvent).toHaveBeenCalledTimes(1));
  expect(mockedAuthFetch).toHaveBeenCalledTimes(2);
  expect(JSON.parse(mockedAuthFetch.mock.calls[1][1]!.body as string)).toMatchObject({ status: 2, ignoreConflicts: true });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("cancel closes the real conflict dialog without saving attendance", async () => {
  mockedAuthFetch.mockResolvedValueOnce(response(attendanceConflict, 409));
  const reloadEvent = renderAttendance();
  fireEvent.click(screen.getByRole("button", { name: /Смогу$/ }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "Отмена" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(mockedAuthFetch).toHaveBeenCalledTimes(1);
  expect(reloadEvent).not.toHaveBeenCalled();
});

test("changing attendance away from confirmed does not open a conflict warning", async () => {
  mockedAuthFetch.mockResolvedValueOnce(response({}));
  const reloadEvent = renderAttendance();
  fireEvent.click(screen.getByRole("button", { name: /Не смогу$/ }));
  await waitFor(() => expect(reloadEvent).toHaveBeenCalledTimes(1));
  expect(JSON.parse(mockedAuthFetch.mock.calls[0][1]!.body as string)).toMatchObject({ status: 3, ignoreConflicts: false });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("malformed conflict shows an actionable error without crashing or offering force-save", async () => {
  mockedAuthFetch.mockResolvedValueOnce(response({
    ...attendanceConflict,
    conflicts: [{ ...attendanceConflict.conflicts[0], StartTime: null }],
  }, 409));
  const reloadEvent = renderAttendance();
  fireEvent.click(screen.getByRole("button", { name: /Смогу$/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось прочитать данные о пересечении мероприятий");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByText("Не удалось открыть приложение")).not.toBeInTheDocument();
  expect(mockedAuthFetch).toHaveBeenCalledTimes(1);
  expect(reloadEvent).not.toHaveBeenCalled();
});
