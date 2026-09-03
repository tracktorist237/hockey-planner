import { authFetch } from "src/api/auth";

export interface SpbhlTeamLinkStatus {
  teamId: string;
  isLinked: boolean;
  spbhlTeamId: string | null;
  spbhlTeamName: string | null;
  profileUrl: string | null;
  lastSyncAttemptAt: string | null;
  lastSuccessfulSyncAt: string | null;
}

export interface SpbhlTeamSearchItem {
  teamId: string;
  name: string;
  city?: string | null;
  country?: string | null;
  logoUrl?: string | null;
  profileUrl: string;
  tournamentId?: number | null;
  divisionName?: string | null;
}

export interface SpbhlTeamSyncResult {
  teamId: string;
  spbhlTeamId: string;
  receivedCount: number;
  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  syncedAt: string;
}

export interface SpbhlTeamBindResult {
  link: SpbhlTeamLinkStatus;
  initialSyncSucceeded: boolean;
  sync: SpbhlTeamSyncResult | null;
  syncError: string | null;
}

export interface BindSpbhlTeamRequest {
  spbhlTeamId: string;
  spbhlTeamName: string;
}

const upstreamFallback = "Не удалось получить данные СПбХЛ. Попробуйте позже.";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await authFetch(path, { ...init, credentials: "include" });
  } catch {
    throw new Error("Не удалось связаться с сервером.");
  }

  if (!response.ok) {
    if (response.status === 502) {
      throw new Error(upstreamFallback);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    const data = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    const message = [data.message, data.error, data.detail, data.title]
      .find((value): value is string => typeof value === "string" && value.trim().length > 0);
    throw new Error(message?.trim() || "Не удалось выполнить запрос.");
  }

  return response.json() as Promise<T>;
}

const teamPath = (teamId: string) => `/api/teams/${encodeURIComponent(teamId)}/spbhl`;

export const getTeamSpbhlStatus = (teamId: string) =>
  request<SpbhlTeamLinkStatus>(teamPath(teamId));

export const searchSpbhlTeams = (teamId: string, title: string) =>
  request<SpbhlTeamSearchItem[]>(`${teamPath(teamId)}/search?title=${encodeURIComponent(title)}`);

export const bindTeamSpbhl = (teamId: string, bindRequest: BindSpbhlTeamRequest) =>
  request<SpbhlTeamBindResult>(`${teamPath(teamId)}/link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bindRequest),
  });

export const unbindTeamSpbhl = (teamId: string) =>
  request<SpbhlTeamLinkStatus>(teamPath(teamId), { method: "DELETE" });

export const syncTeamSpbhlNow = (teamId: string) =>
  request<SpbhlTeamSyncResult>(`${teamPath(teamId)}/sync`, { method: "POST" });
