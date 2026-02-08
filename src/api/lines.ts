import { CreateUpdateRosterRequest } from "../types/lines";

const BASE_URL = "https://localhost:44390/api";

export async function createLineRoster(dto: CreateUpdateRosterRequest) {
  const res = await fetch(`${BASE_URL}/lines`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Ошибка при создании звена");
  }

  return res.json();
}

export async function updateLineRoster(dto: CreateUpdateRosterRequest) {
  const res = await fetch(`${BASE_URL}/lines`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Ошибка при создании звена");
  }

  return res.json();
}