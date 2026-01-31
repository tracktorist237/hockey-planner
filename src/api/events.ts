import { EventListDto, EventDto } from "../types/events";

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

export async function createEvent(data: EventDto): Promise<string> {
  const res = await fetch(`${API_BASE}/api/events`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`POST /api/events failed: ${res.status}`);
  return res.text(); // возвращается ID нового события
}

export async function deleteEvent(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/events/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`DELETE /api/events/${id} failed: ${res.status}`);
}
