const API_BASE = process.env.REACT_APP_API_BASE || "";

export interface SpbhlPlayerSearchItem {
  playerId: string;
  fullName: string;
  birthDate?: string | null;
  teamName?: string | null;
  jerseyNumber?: number | null;
  photoSmallUrl: string;
  photoLargeUrl: string;
  profileUrl: string;
}

export interface SpbhlPlayersSearchResponse {
  page: number;
  totalPages: number;
  players: SpbhlPlayerSearchItem[];
}

export interface SearchSpbhlPlayersParams {
  fullName: string;
  birthYear?: string;
  page?: number;
}

export async function searchSpbhlPlayers(
  params: SearchSpbhlPlayersParams,
): Promise<SpbhlPlayersSearchResponse> {
  const query = new URLSearchParams();
  query.set("fullName", params.fullName.trim());

  if (params.birthYear?.trim()) {
    query.set("birthYear", params.birthYear.trim());
  }

  query.set("page", String(params.page ?? 1));

  const res = await fetch(`${API_BASE}/api/spbhl/players?${query.toString()}`);

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || "Не удалось выполнить поиск по СПБХЛ");
  }

  return res.json();
}
