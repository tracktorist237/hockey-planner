import contract from "./__fixtures__/api-contract.generated.json";
import { authFetch } from "./auth";
import { apiErrorFromPayload } from "./errors";
import { AttendanceConflictError, AttendanceTransferMode, previewEventAttendanceTransfer, transferEventData, updateAttendance } from "./events";
import { getNotifications, getNotificationPreferences } from "./notifications";

jest.mock("./auth", () => ({ authFetch: jest.fn() }));
const fetchMock = authFetch as jest.MockedFunction<typeof authFetch>;
const response = ({ status, body }: { status: number; body: unknown }) =>
  ({ status, ok: status < 400, json: async () => body }) as Response;
beforeEach(() => fetchMock.mockReset());

test.each(["notFound", "unauthorized", "authError", "validation", "transferError", "transferConflict"] as const)(
  "real ASP.NET %s preserves safe ProblemDetails semantics", name => {
    const { status, body } = contract[name];
    const error = apiErrorFromPayload(status, body);
    expect(error).toMatchObject({ status, traceId: "contract-trace", message: body.detail });
    expect(error.message).not.toMatch(/<html|exception|stack trace/i);
    if (name === "validation") expect(error.errors.request).toEqual(["The request field is required."]);
  },
);

test("real typed attendance DTO traverses the API parser with valid dates and numeric status", async () => {
  fetchMock.mockResolvedValue(response(contract.attendanceConflict));
  const error = await updateAttendance("event", "user", 2).catch(value => value);
  expect(error).toBeInstanceOf(AttendanceConflictError);
  expect(error.conflicts).toEqual(contract.attendanceConflict.body.conflicts);
  expect(error.conflicts[0].id).toMatch(/^[a-f\d-]{36}$/i);
  expect(new Date(error.conflicts[0].startTime).toISOString()).toBe("2030-01-15T18:00:00.000Z");
  expect(error.conflicts[0].status).toBe(1);
});

test("malformed variant of real response cannot authorize force confirmation", async () => {
  const body = JSON.parse(JSON.stringify(contract.attendanceConflict.body));
  body.conflicts[0].startTime = "invalid";
  fetchMock.mockResolvedValue(response({ status: 409, body }));
  await expect(updateAttendance("event", "user", 2)).rejects.toMatchObject({ name: "ApiError", status: 409 });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("real transfer preview preserves explicit null target and final attendance", async () => {
  fetchMock.mockResolvedValue(response(contract.transferPreview));
  const result = await previewEventAttendanceTransfer("source", "target", AttendanceTransferMode.MergePreferTarget);
  expect(result.items[0]).toMatchObject({ sourceStatus: 2, targetStatus: null,
    finalResultStatus: 2, automaticResultStatus: 2, willChange: true });
  expect(result.changedCount).toBe(1);
});

test.each(["transferError", "transferConflict"] as const)("real %s uses centralized safe errors", async name => {
  fetchMock.mockResolvedValue(response(contract[name]));
  await expect(transferEventData("source", { targetEventId: "target", attendance: true, roster: false,
    guests: false, uniformColor: false, description: false, deleteSourceEvent: false,
    attendanceTransferMode: AttendanceTransferMode.MergePreferTarget, attendanceOverrides: [] }))
    .rejects.toMatchObject({ status: contract[name].status, message: contract[name].body.detail });
});

test("real notification list and preferences remain readable by notification consumers", async () => {
  fetchMock.mockResolvedValueOnce(response(contract.notifications)).mockResolvedValueOnce(response(contract.preferences));
  const inbox = await getNotifications();
  expect(inbox.unreadCount).toBe(1);
  expect(inbox.items[0]).toMatchObject({ type: 1, category: 1, isRead: false, readAt: null, deliveredAt: null });
  expect(new Date(inbox.items[0].createdAt).toISOString()).toBe("2030-01-15T18:00:00.000Z");
  expect(inbox.items[0].url).toBe("/events/71000000-0000-0000-0000-000000000004");
  expect(await getNotificationPreferences()).toMatchObject({ attendanceRequiredEnabled: true, rosterReadyEnabled: true });
});
