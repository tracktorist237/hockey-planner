import { EventListDto, EventDto, CreateEventDto } from "../types/events";

const API_BASE = process.env.REACT_APP_API_BASE || '';

export async function getEvents(): Promise<EventListDto> {
  const res = await fetch(`${API_BASE}/api/events`, { credentials: "include" });
  if (!res.ok) throw new Error(`GET /api/events failed: ${res.status}`);
  return res.json();
}

export async function getEvent(id: string): Promise<EventDto> {
  const res = await fetch(`${API_BASE}/api/events/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error(`GET /api/events/${id} failed: ${res.status}`);
  return res.json();
}

export async function createEvent(data: CreateEventDto): Promise<string> {
  const currentUser = (() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  })();
  
  if (!currentUser?.id) {
    throw new Error("Необходимо авторизоваться для создания события");
  }
  
  const res = await fetch(`${API_BASE}/api/events?currentUserId=${currentUser.id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ошибка создания события: ${res.status} - ${text}`);
  }

  // По сваггеру сервер возвращает UUID (string)
  return res.json();
}

export async function updateEvent(
  eventId: string,
  data: Partial<CreateEventDto>
): Promise<void> {
  const currentUser = (() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  })();
  
  if (!currentUser?.id) {
    throw new Error("Необходимо авторизоваться для обновления события");
  }
  
  const res = await fetch(
    `${API_BASE}/api/events?currentUserId=${currentUser.id}&eventId=${eventId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || `Ошибка обновления события: ${res.status}`);
  }
}

export async function deleteEvent(eventId: string): Promise<{ message: string }> {
  const currentUser = (() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  })();
  
  if (!currentUser?.id) {
    throw new Error("Необходимо авторизоваться для удаления события");
  }
  
  const res = await fetch(
    `${API_BASE}/api/events?currentUserId=${currentUser.id}&eventId=${eventId}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    }
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
  notes?: string | null
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/events/${eventId}/attendance/${userId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        notes: notes ?? null,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Ошибка обновления явки");
  }
}