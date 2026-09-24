import { parseApiError } from "src/api/errors";
import { NotificationPreferencesDto, NotificationsListDto } from "src/types/notifications";
import { authFetch } from "src/api/auth";

export async function getNotifications(take = 20): Promise<NotificationsListDto> {
  const response = await authFetch(`/api/notifications?take=${take}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return response.json();
}

export async function markNotificationRead(id: string): Promise<void> {
  const response = await authFetch(`/api/notifications/${id}/read`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const response = await authFetch("/api/notifications/read-all", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }
}

export async function getNotificationPreferences(): Promise<NotificationPreferencesDto> {
  const response = await authFetch("/api/notifications/preferences/me", {
    credentials: "include",
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return response.json();
}

export async function updateNotificationPreferences(
  preferences: NotificationPreferencesDto,
): Promise<NotificationPreferencesDto> {
  const response = await authFetch("/api/notifications/preferences/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(preferences),
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return response.json();
}

export async function sendTestNotification(): Promise<void> {
  const response = await authFetch("/api/notifications/test", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }
}
