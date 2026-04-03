import { ExerciseDto } from "src/types/events";

const API_BASE = process.env.REACT_APP_API_BASE || "";

export interface CreateExerciseDto {
  name: string;
  videoUrl: string;
}

export async function getExercises(): Promise<ExerciseDto[]> {
  const res = await fetch(`${API_BASE}/api/exercises`, { credentials: "include" });
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

