import { EventListDto, EventDto, CreateEventDto } from "../types/events";

const API_BASE = "https://localhost:44390";

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
  const res = await fetch(`${API_BASE}/api/events`, {
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

export async function deleteEvent(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/events/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`DELETE /api/events/${id} failed: ${res.status}`);
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