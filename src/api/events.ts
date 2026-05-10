import { CreateEventDto, EventDto, EventListDto } from "../types/events";

const API_BASE = process.env.REACT_APP_API_BASE || "";

const readStoredCurrentUserId = (): string | null => {
  const saved = localStorage.getItem("currentUser");
  if (!saved) {
    return null;
  }

  try {
    const parsed = JSON.parse(saved) as { id?: string | null };
    return parsed.id?.trim() || null;
  } catch {
    return null;
  }
};

const resolveCurrentUserId = (currentUserId?: string): string => {
  const userId = currentUserId?.trim() || readStoredCurrentUserId();
  if (!userId) {
    throw new Error("Необходимо авторизоваться для выполнения операции.");
  }

  return userId;
};

export async function getEvents(currentUserId?: string, teamId?: string | null): Promise<EventListDto> {
  const queryParts: string[] = [];
  if (currentUserId) {
    queryParts.push(`currentUserId=${encodeURIComponent(currentUserId)}`);
  }
  if (teamId) {
    queryParts.push(`teamId=${encodeURIComponent(teamId)}`);
  }
  const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const res = await fetch(`${API_BASE}/api/events${query}`, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`GET /api/events failed: ${res.status}`);
  }
  return res.json();
}

export async function getEvent(id: string): Promise<EventDto> {
  const res = await fetch(`${API_BASE}/api/events/${id}`, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`GET /api/events/${id} failed: ${res.status}`);
  }
  return res.json();
}

export async function createEvent(data: CreateEventDto, currentUserId?: string): Promise<string> {
  const userId = resolveCurrentUserId(currentUserId);
  const res = await fetch(`${API_BASE}/api/events?currentUserId=${encodeURIComponent(userId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ошибка создания события: ${res.status} - ${text}`);
  }

  return res.json();
}

export async function updateEvent(
  eventId: string,
  data: Partial<CreateEventDto>,
  currentUserId?: string,
): Promise<void> {
  const userId = resolveCurrentUserId(currentUserId);
  const res = await fetch(
    `${API_BASE}/api/events?currentUserId=${encodeURIComponent(userId)}&eventId=${encodeURIComponent(eventId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    },
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || `Ошибка обновления события: ${res.status}`);
  }
}

export async function deleteEvent(eventId: string, currentUserId?: string): Promise<{ message: string }> {
  const userId = resolveCurrentUserId(currentUserId);
  const res = await fetch(
    `${API_BASE}/api/events?currentUserId=${encodeURIComponent(userId)}&eventId=${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    },
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Ошибка удаления события");
  }

  return data;
}

export async function updateAttendance(
  eventId: string,
  userId: string,
  status: number,
  notes?: string | null,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/events/${eventId}/attendance/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status,
      notes: notes ?? null,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Ошибка обновления явки");
  }
}
