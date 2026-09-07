import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { AttendanceConflictError, updateAttendance } from "src/api/events";
import { AttendanceResponseCard } from "src/pages/EventPage/components/AttendanceResponseCard";
import { useAttendance } from "src/pages/EventPage/hooks/useAttendance";
import { EventDto, EventType } from "src/types/events";

jest.mock("src/api/events", () => ({
  ...jest.requireActual("src/api/events"),
  updateAttendance: jest.fn(),
}));

const mockedUpdateAttendance = updateAttendance as jest.MockedFunction<typeof updateAttendance>;
const conflict = { id: "other", title: "Другая тренировка", teamName: "Другая команда", startTime: "2026-09-10T18:00:00Z", durationMinutes: 60, status: 1 };
const event = { id: "event", teamId: "team", title: "Матч", type: EventType.Game, status: 1, startTime: "2026-09-10T18:30:00Z", durationMinutes: 75, createdAt: "2026-09-01T00:00:00Z", attendances: [] } as EventDto;

beforeEach(() => mockedUpdateAttendance.mockReset());

test("confirmation warning does not save until the user explicitly overrides it", async () => {
  mockedUpdateAttendance
    .mockRejectedValueOnce(new AttendanceConflictError("В это время у вас уже есть мероприятие", [conflict]))
    .mockResolvedValueOnce();
  const reloadEvent = jest.fn().mockResolvedValue(event);
  const { result } = renderHook(() => useAttendance({ event, selectedUserId: "user", reloadEvent }));

  await act(async () => result.current.handleVote(2));
  expect(result.current.attendanceConflicts).toEqual([conflict]);
  expect(reloadEvent).not.toHaveBeenCalled();

  await act(async () => result.current.confirmAttendanceDespiteConflicts());
  expect(mockedUpdateAttendance).toHaveBeenLastCalledWith("event", "user", 2, undefined, "user", true);
  expect(result.current.attendanceConflicts).toEqual([]);
  expect(reloadEvent).toHaveBeenCalled();
});

test("changing attendance away from confirmed never opens a conflict warning", async () => {
  mockedUpdateAttendance.mockResolvedValue();
  const { result } = renderHook(() => useAttendance({ event, selectedUserId: "user", reloadEvent: jest.fn().mockResolvedValue(event) }));

  await act(async () => result.current.handleVote(3));

  expect(mockedUpdateAttendance).toHaveBeenCalledWith("event", "user", 3, undefined, "user");
  expect(result.current.attendanceConflicts).toEqual([]);
});

test("attendance warning lists every conflict and offers confirm or cancel", () => {
  const confirm = jest.fn();
  const cancel = jest.fn();
  render(<AttendanceResponseCard
    attendanceNote="" setAttendanceNote={jest.fn()} showNoteInput={false} setShowNoteInput={jest.fn()}
    isEditingNote={false} setIsEditingNote={jest.fn()} submitting={false} handleVote={jest.fn()}
    handleAddNote={jest.fn()} attendanceConflicts={[conflict, { ...conflict, id: "third", title: "Матч другой команды" }]}
    confirmAttendanceDespiteConflicts={confirm} cancelAttendanceConflict={cancel}
  />);

  expect(screen.getByText("В это время у вас уже есть мероприятие")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Другая тренировка" })).toHaveAttribute("href", "/events/other");
  expect(screen.getByRole("link", { name: "Матч другой команды" })).toHaveAttribute("href", "/events/third");
  fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
  fireEvent.click(screen.getByRole("button", { name: "Всё равно смогу" }));
  expect(cancel).toHaveBeenCalled();
  expect(confirm).toHaveBeenCalled();
});
