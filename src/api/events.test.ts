import { authFetch } from "src/api/auth";
import {
  createEvent,
  createEventGuest,
  deleteEvent,
  getEvent,
  getEvents,
  transferEventData,
  updateAttendance,
  updateEvent,
  updateEventGuestAttendance,
} from "src/api/events";
import { CreateEventDto, EventDto, EventType } from "src/types/events";

jest.mock("src/api/auth", () => ({
  authFetch: jest.fn(),
}));

const mockedAuthFetch = authFetch as jest.MockedFunction<typeof authFetch>;

const createResponse = (body: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(typeof body === "string" ? body : JSON.stringify(body)),
  }) as unknown as Response;

const eventId = "11111111-1111-1111-1111-111111111111";
const userId = "22222222-2222-2222-2222-222222222222";
const teamId = "33333333-3333-3333-3333-333333333333";
const guestId = "44444444-4444-4444-4444-444444444444";

const eventRequest: CreateEventDto = {
  title: "Practice",
  type: EventType.Practice,
  startTime: "2026-08-10T18:00:00.000Z",
  durationMinutes: 60,
  locationName: "Arena",
  locationAddress: "Test address",
  teamId,
  exerciseIds: [],
};

beforeEach(() => {
  mockedAuthFetch.mockReset();
  localStorage.clear();
});

test("getEvents uses authFetch without requiring a user ID or token", async () => {
  const body = { events: [] };
  mockedAuthFetch.mockResolvedValue(createResponse(body));

  await expect(getEvents()).resolves.toEqual(body);

  expect(mockedAuthFetch).toHaveBeenCalledWith("/api/events", { credentials: "include" });
});

test("getEvents preserves currentUserId and teamId query parameters", async () => {
  mockedAuthFetch.mockResolvedValue(createResponse({ events: [] }));

  await getEvents(userId, teamId);

  expect(mockedAuthFetch).toHaveBeenCalledWith(
    `/api/events?currentUserId=${userId}&teamId=${teamId}`,
    { credentials: "include" },
  );
});

test("getEvent uses authFetch without requiring a user ID or token", async () => {
  const body: EventDto = {
    id: eventId,
    type: EventType.Practice,
    startTime: "2026-08-10T18:00:00.000Z",
    durationMinutes: 60,
    status: 1,
    createdAt: "2026-08-09T12:00:00.000Z",
  };
  mockedAuthFetch.mockResolvedValue(createResponse(body));

  await expect(getEvent(eventId)).resolves.toEqual(body);

  expect(mockedAuthFetch).toHaveBeenCalledWith(`/api/events/${eventId}`, { credentials: "include" });
});

test("transferEventData posts selected categories without actor identity", async () => {
  const request = {
    targetEventId: "target-event", attendance: true, roster: true, guests: false,
    uniformColor: false, description: true, deleteSourceEvent: false,
  };
  mockedAuthFetch.mockResolvedValue(createResponse({ targetEventId: request.targetEventId }));

  await expect(transferEventData(eventId, request)).resolves.toEqual({ targetEventId: request.targetEventId });

  expect(mockedAuthFetch).toHaveBeenCalledWith(`/api/events/${eventId}/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });
  expect(JSON.stringify(mockedAuthFetch.mock.calls[0])).not.toContain("currentUserId");
});

test("createEvent preserves URL, method, headers and body", async () => {
  mockedAuthFetch.mockResolvedValue(createResponse(eventId, 201));

  await expect(createEvent(eventRequest, userId)).resolves.toBe(eventId);

  expect(mockedAuthFetch).toHaveBeenCalledWith(`/api/events?currentUserId=${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(eventRequest),
  });
});

test("updateEvent preserves URL, method, headers and body", async () => {
  mockedAuthFetch.mockResolvedValue(createResponse(eventId, 201));

  await updateEvent(eventId, eventRequest, userId);

  expect(mockedAuthFetch).toHaveBeenCalledWith(
    `/api/events?currentUserId=${userId}&eventId=${eventId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(eventRequest),
    },
  );
});

test("deleteEvent preserves URL, method and headers", async () => {
  const body = { message: "deleted" };
  mockedAuthFetch.mockResolvedValue(createResponse(body));

  await expect(deleteEvent(eventId, userId)).resolves.toEqual(body);

  expect(mockedAuthFetch).toHaveBeenCalledWith(
    `/api/events?currentUserId=${userId}&eventId=${eventId}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    },
  );
});

test("updateAttendance preserves actor query, target route and body", async () => {
  mockedAuthFetch.mockResolvedValue(createResponse({ message: "updated" }));

  await updateAttendance(eventId, userId, 2, "Ready", userId);

  expect(mockedAuthFetch).toHaveBeenCalledWith(
    `/api/events/${eventId}/attendance/${userId}?currentUserId=${userId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: 2, notes: "Ready" }),
    },
  );
});

test("createEventGuest preserves URL, method, headers and body", async () => {
  const request = {
    firstName: "Guest",
    lastName: "Player",
    handedness: null,
    jerseyNumber: 17,
  };
  const body = {
    userId: guestId,
    status: 2,
    respondedAt: "2026-08-09T12:00:00.000Z",
  };
  mockedAuthFetch.mockResolvedValue(createResponse(body));

  await expect(createEventGuest(eventId, request, userId)).resolves.toEqual(body);

  expect(mockedAuthFetch).toHaveBeenCalledWith(
    `/api/events/${eventId}/guests?currentUserId=${userId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(request),
    },
  );
});

test("updateEventGuestAttendance preserves URL, method, headers and body", async () => {
  mockedAuthFetch.mockResolvedValue(createResponse({ message: "updated" }));

  await updateEventGuestAttendance(eventId, guestId, 3, null, userId);

  expect(mockedAuthFetch).toHaveBeenCalledWith(
    `/api/events/${eventId}/guests/${guestId}/attendance?currentUserId=${userId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: 3, notes: null }),
    },
  );
});
