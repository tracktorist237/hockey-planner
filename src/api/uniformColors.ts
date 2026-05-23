import { UniformColorDto } from "src/types/events";

const API_BASE = process.env.REACT_APP_API_BASE || "";

export interface CreateUniformColorRequest {
  name: string;
  imageUrl: string;
  teamId: string;
}

export async function getUniformColors(teamId: string): Promise<UniformColorDto[]> {
  const query = new URLSearchParams({ teamId });
  const res = await fetch(`${API_BASE}/api/uniform-colors?${query.toString()}`, {
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
    `${API_BASE}/api/uniform-colors?currentUserId=${encodeURIComponent(currentUserId)}`,
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
    `${API_BASE}/api/uniform-colors/upload?currentUserId=${encodeURIComponent(currentUserId)}`,
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
