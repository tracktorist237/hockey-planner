import { CreateUpdateRosterRequest } from "../types/lines";
const API_BASE = process.env.REACT_APP_API_BASE || '';

export async function createLineRoster(
  request: CreateUpdateRosterRequest,
  currentUserId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/api/lines?currentUserId=${currentUserId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "Ошибка при создании звена");
  }
}

export async function updateLineRoster(
  request: CreateUpdateRosterRequest,
  currentUserId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/api/lines?currentUserId=${currentUserId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "Ошибка при обновлении звена");
  }
}

export async function deleteLineRoster(
  eventId: string,
  currentUserId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/api/lines?eventId=${eventId}&currentUserId=${currentUserId}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "Ошибка при удалении звена");
  }
}