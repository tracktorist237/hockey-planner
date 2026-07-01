import { NotificationPreferencesDto, NotificationsListDto } from "src/types/notifications";
import { buildApiUrl } from "src/api/client";

const API_REQUEST_TIMEOUT_MS = 10000;

const currentUserQuery = (currentUserId: string): string => `currentUserId=${encodeURIComponent(currentUserId)}`;

const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
  if (typeof AbortController === "undefined") {
    return Promise.race([
      fetch(input, init),
      new Promise<Response>((_, reject) => {
        window.setTimeout(() => reject(new Error("Request timed out")), API_REQUEST_TIMEOUT_MS);
      }),
    ]);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export async function getNotifications(currentUserId: string, take = 20): Promise<NotificationsListDto> {
  const response = await fetchWithTimeout(buildApiUrl(`/api/notifications?${currentUserQuery(currentUserId)}&take=${take}`), {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`GET /api/notifications failed: ${response.status}`);
  }

  return response.json();
}

export async function markNotificationRead(currentUserId: string, id: string): Promise<void> {
  const response = await fetchWithTimeout(buildApiUrl(`/api/notifications/${id}/read?${currentUserQuery(currentUserId)}`), {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`POST /api/notifications/${id}/read failed: ${response.status}`);
  }
}

export async function markAllNotificationsRead(currentUserId: string): Promise<void> {
  const response = await fetchWithTimeout(buildApiUrl(`/api/notifications/read-all?${currentUserQuery(currentUserId)}`), {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`POST /api/notifications/read-all failed: ${response.status}`);
  }
}

export async function getNotificationPreferences(currentUserId: string): Promise<NotificationPreferencesDto> {
  const response = await fetchWithTimeout(buildApiUrl(`/api/notifications/preferences/me?${currentUserQuery(currentUserId)}`), {
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
  const response = await fetchWithTimeout(buildApiUrl(`/api/notifications/preferences/me?${currentUserQuery(currentUserId)}`), {
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
  const response = await fetchWithTimeout(buildApiUrl(`/api/notifications/test?${currentUserQuery(currentUserId)}`), {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`POST /api/notifications/test failed: ${response.status}`);
  }
}
