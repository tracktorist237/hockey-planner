import { authFetch } from "src/api/auth";
import {
  getNotificationPreferences,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  sendTestNotification,
  updateNotificationPreferences,
} from "src/api/notifications";
import { NotificationPreferencesDto } from "src/types/notifications";

jest.mock("src/api/auth", () => ({
  authFetch: jest.fn(),
}));

const mockedAuthFetch = authFetch as jest.MockedFunction<typeof authFetch>;

const createResponse = (body: unknown = null, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  }) as unknown as Response;

const preferences: NotificationPreferencesDto = {
  attendanceRequiredEnabled: true,
  rosterReadyEnabled: false,
  teamNewsEnabled: true,
  goaliesEnabled: false,
  birthdaysEnabled: true,
  appUpdatesEnabled: false,
};

beforeEach(() => {
  mockedAuthFetch.mockReset();
});

test("getNotifications uses authFetch without a client-controlled user ID", async () => {
  const body = { items: [], unreadCount: 0 };
  mockedAuthFetch.mockResolvedValue(createResponse(body));

  await expect(getNotifications()).resolves.toEqual(body);

  expect(mockedAuthFetch).toHaveBeenCalledWith("/api/notifications?take=20", {
    credentials: "include",
  });
  expect(mockedAuthFetch.mock.calls[0][0]).not.toContain("currentUserId");
});

test("getNotifications preserves the requested page size", async () => {
  mockedAuthFetch.mockResolvedValue(createResponse({ items: [], unreadCount: 0 }));

  await getNotifications(8);

  expect(mockedAuthFetch).toHaveBeenCalledWith("/api/notifications?take=8", {
    credentials: "include",
  });
});

test("markNotificationRead preserves its route and method", async () => {
  mockedAuthFetch.mockResolvedValue(createResponse());
  const notificationId = "11111111-1111-1111-1111-111111111111";

  await markNotificationRead(notificationId);

  expect(mockedAuthFetch).toHaveBeenCalledWith(`/api/notifications/${notificationId}/read`, {
    method: "POST",
    credentials: "include",
  });
});

test("markAllNotificationsRead uses its authenticated self route", async () => {
  mockedAuthFetch.mockResolvedValue(createResponse());

  await markAllNotificationsRead();

  expect(mockedAuthFetch).toHaveBeenCalledWith("/api/notifications/read-all", {
    method: "POST",
    credentials: "include",
  });
});

test("getNotificationPreferences uses the existing authenticated alias", async () => {
  mockedAuthFetch.mockResolvedValue(createResponse(preferences));

  await expect(getNotificationPreferences()).resolves.toEqual(preferences);

  expect(mockedAuthFetch).toHaveBeenCalledWith("/api/notifications/preferences/me", {
    credentials: "include",
  });
});

test("updateNotificationPreferences preserves method, body and safe DTO", async () => {
  mockedAuthFetch.mockResolvedValue(createResponse(preferences));

  await expect(updateNotificationPreferences(preferences)).resolves.toEqual(preferences);

  expect(mockedAuthFetch).toHaveBeenCalledWith("/api/notifications/preferences/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(preferences),
  });
  expect(mockedAuthFetch.mock.calls[0][1]?.body).not.toContain("currentUserId");
});

test("sendTestNotification uses authenticated self endpoint without recipient ID", async () => {
  mockedAuthFetch.mockResolvedValue(createResponse());

  await sendTestNotification();

  expect(mockedAuthFetch).toHaveBeenCalledWith("/api/notifications/test", {
    method: "POST",
    credentials: "include",
  });
  expect(mockedAuthFetch.mock.calls[0][0]).not.toContain("currentUserId");
});
