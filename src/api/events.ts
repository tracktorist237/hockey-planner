import { AttendanceLookUpDto, CreateEventDto, EventDto, EventListDto } from "../types/events";
import { authFetch } from "src/api/auth";

const readStoredCurrentUserId = (): string | null => {
  try {
    const saved = localStorage.getItem("currentUser");
    if (!saved) {
      return null;
    }

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
  const res = await authFetch(`/api/events${query}`, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`GET /api/events failed: ${res.status}`);
  }
  return res.json();
}

export async function getEvent(id: string): Promise<EventDto> {
  const res = await authFetch(`/api/events/${id}`, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`GET /api/events/${id} failed: ${res.status}`);
  }
  return res.json();
}

export async function createEvent(data: CreateEventDto, currentUserId?: string): Promise<string> {
  const userId = resolveCurrentUserId(currentUserId);
  const res = await authFetch(`/api/events?currentUserId=${encodeURIComponent(userId)}`, {
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
  const res = await authFetch(
    `/api/events?currentUserId=${encodeURIComponent(userId)}&eventId=${encodeURIComponent(eventId)}`,
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
  const res = await authFetch(
    `/api/events?currentUserId=${encodeURIComponent(userId)}&eventId=${encodeURIComponent(eventId)}`,
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
  currentUserId?: string | null,
): Promise<void> {
  const query = currentUserId ? `?currentUserId=${encodeURIComponent(currentUserId)}` : "";
  const res = await authFetch(`/api/events/${eventId}/attendance/${userId}${query}`, {
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

export interface CreateEventGuestDto {
  firstName: string;
  lastName: string;
  handedness?: number | null;
  jerseyNumber?: number | null;
}

export async function createEventGuest(
  eventId: string,
  data: CreateEventGuestDto,
  currentUserId?: string | null,
): Promise<AttendanceLookUpDto> {
  const userId = resolveCurrentUserId(currentUserId ?? undefined);
  const res = await authFetch(`/api/events/${eventId}/guests?currentUserId=${encodeURIComponent(userId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || errorData?.message || `Ошибка добавления гостя: ${res.status}`);
  }

  return res.json();
}

export async function updateEventGuestAttendance(
  eventId: string,
  guestId: string,
  status: number,
  notes?: string | null,
  currentUserId?: string | null,
): Promise<void> {
  const userId = resolveCurrentUserId(currentUserId ?? undefined);
  const res = await authFetch(`/api/events/${eventId}/guests/${guestId}/attendance?currentUserId=${encodeURIComponent(userId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      status,
      notes: notes ?? null,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || errorData?.message || `Ошибка обновления явки гостя: ${res.status}`);
  }
}
