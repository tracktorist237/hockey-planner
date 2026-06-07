import { ExerciseDto } from "src/types/events";

const API_BASE = process.env.REACT_APP_API_BASE || "";

export interface CreateExerciseDto {
  name: string;
  videoUrl: string;
  teamId: string;
}

export interface UpdateExerciseDto {
  name: string;
  videoUrl: string;
}

export async function getExercises(teamId: string): Promise<ExerciseDto[]> {
  const query = new URLSearchParams({ teamId });
  const res = await fetch(`${API_BASE}/api/exercises?${query.toString()}`, { credentials: "include" });
  if (!res.ok) throw new Error(`GET /api/exercises failed: ${res.status}`);
  return res.json();
}

export async function createExercise(data: CreateExerciseDto, currentUserId: string): Promise<ExerciseDto> {
  const res = await fetch(`${API_BASE}/api/exercises?currentUserId=${encodeURIComponent(currentUserId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `POST /api/exercises failed: ${res.status}`);
  }

  return res.json();
}

export async function updateExercise(id: string, data: UpdateExerciseDto, currentUserId: string): Promise<ExerciseDto> {
  const res = await fetch(`${API_BASE}/api/exercises/${encodeURIComponent(id)}?currentUserId=${encodeURIComponent(currentUserId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `PUT /api/exercises/${id} failed: ${res.status}`);
  }

  return res.json();
}

export async function deleteExercise(id: string, currentUserId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/exercises/${encodeURIComponent(id)}?currentUserId=${encodeURIComponent(currentUserId)}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `DELETE /api/exercises/${id} failed: ${res.status}`);
  }
}

