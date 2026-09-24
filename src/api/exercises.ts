import { parseApiError } from "src/api/errors";
import { ExerciseDto } from "src/types/events";
import { buildApiUrl } from "src/api/client";

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
  const res = await fetch(buildApiUrl(`/api/exercises?${query.toString()}`), { credentials: "include" });
  if (!res.ok) throw await parseApiError(res);
  return res.json();
}

export async function createExercise(data: CreateExerciseDto, currentUserId: string): Promise<ExerciseDto> {
  const res = await fetch(buildApiUrl(`/api/exercises?currentUserId=${encodeURIComponent(currentUserId)}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }

  return res.json();
}

export async function updateExercise(id: string, data: UpdateExerciseDto, currentUserId: string): Promise<ExerciseDto> {
  const res = await fetch(buildApiUrl(`/api/exercises/${encodeURIComponent(id)}?currentUserId=${encodeURIComponent(currentUserId)}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }

  return res.json();
}

export async function deleteExercise(id: string, currentUserId: string): Promise<void> {
  const res = await fetch(buildApiUrl(`/api/exercises/${encodeURIComponent(id)}?currentUserId=${encodeURIComponent(currentUserId)}`), {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }
}

