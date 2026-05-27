import { NotificationPreferencesDto, NotificationsListDto } from "src/types/notifications";

const API_BASE = process.env.REACT_APP_API_BASE || "";

const currentUserQuery = (currentUserId: string): string => `currentUserId=${encodeURIComponent(currentUserId)}`;

export async function getNotifications(currentUserId: string, take = 20): Promise<NotificationsListDto> {
  const response = await fetch(`${API_BASE}/api/notifications?${currentUserQuery(currentUserId)}&take=${take}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`GET /api/notifications failed: ${response.status}`);
  }

  return response.json();
}

export async function markNotificationRead(currentUserId: string, id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/notifications/${id}/read?${currentUserQuery(currentUserId)}`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`POST /api/notifications/${id}/read failed: ${response.status}`);
  }
}

export async function markAllNotificationsRead(currentUserId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/notifications/read-all?${currentUserQuery(currentUserId)}`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`POST /api/notifications/read-all failed: ${response.status}`);
  }
}

export async function getNotificationPreferences(currentUserId: string): Promise<NotificationPreferencesDto> {
  const response = await fetch(`${API_BASE}/api/notifications/preferences/me?${currentUserQuery(currentUserId)}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`GET /api/notifications/preferences/me failed: ${response.status}`);
  }

  return response.json();
}

export async function updateNotificationPreferences(
  currentUserId: string,
  preferences: NotificationPreferencesDto,
): Promise<NotificationPreferencesDto> {
  const response = await fetch(`${API_BASE}/api/notifications/preferences/me?${currentUserQuery(currentUserId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(preferences),
  });

  if (!response.ok) {
    throw new Error(`PUT /api/notifications/preferences/me failed: ${response.status}`);
  }

  return response.json();
}

export async function sendTestNotification(currentUserId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/notifications/test?${currentUserQuery(currentUserId)}`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`POST /api/notifications/test failed: ${response.status}`);
  }
}
