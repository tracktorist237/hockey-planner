import { UniformColorDto } from "src/types/events";
import { buildApiUrl } from "src/api/client";

export interface CreateUniformColorRequest {
  name: string;
  imageUrl: string;
  teamId: string;
}

export interface UpdateUniformColorRequest {
  name: string;
  imageUrl: string;
}

export async function getUniformColors(teamId: string): Promise<UniformColorDto[]> {
  const query = new URLSearchParams({ teamId });
  const res = await fetch(buildApiUrl(`/api/uniform-colors?${query.toString()}`), {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`GET /api/uniform-colors failed: ${res.status}`);
  }

  return res.json();
}

export async function createUniformColor(
  data: CreateUniformColorRequest,
  currentUserId: string,
): Promise<UniformColorDto> {
  const res = await fetch(
    buildApiUrl(`/api/uniform-colors?currentUserId=${encodeURIComponent(currentUserId)}`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST /api/uniform-colors failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function createUniformColorWithUpload(
  name: string,
  file: File,
  currentUserId: string,
  teamId: string,
): Promise<UniformColorDto> {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("teamId", teamId);
  formData.append("file", file);

  const res = await fetch(
    buildApiUrl(`/api/uniform-colors/upload?currentUserId=${encodeURIComponent(currentUserId)}`),
    {
      method: "POST",
      credentials: "include",
      body: formData,
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST /api/uniform-colors/upload failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function updateUniformColor(
  id: string,
  data: UpdateUniformColorRequest,
  currentUserId: string,
): Promise<UniformColorDto> {
  const res = await fetch(
    buildApiUrl(`/api/uniform-colors/${encodeURIComponent(id)}?currentUserId=${encodeURIComponent(currentUserId)}`),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `PUT /api/uniform-colors/${id} failed: ${res.status}`);
  }

  return res.json();
}

export async function deleteUniformColor(id: string, currentUserId: string): Promise<void> {
  const res = await fetch(
    buildApiUrl(`/api/uniform-colors/${encodeURIComponent(id)}?currentUserId=${encodeURIComponent(currentUserId)}`),
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `DELETE /api/uniform-colors/${id} failed: ${res.status}`);
  }
}
