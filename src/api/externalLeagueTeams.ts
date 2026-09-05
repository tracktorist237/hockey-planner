import { authFetch } from "src/api/auth";

export enum ExternalLeagueProvider {
  Spbhl = 1,
}

export interface ExternalTeamSearchItem {
  provider: ExternalLeagueProvider;
  externalTeamId: string;
  name: string;
  city?: string | null;
  country?: string | null;
  logoUrl?: string | null;
  profileUrl?: string | null;
  divisionName?: string | null;
}

export interface ExternalLeagueLink {
  id: string;
  teamId: string;
  provider: ExternalLeagueProvider;
  externalTeamId: string;
  externalTeamName: string;
  divisionName: string | null;
  profileUrl: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  city: string | null;
  country: string | null;
  foundedYear?: number | null;
  coachName?: string | null;
  administratorName?: string | null;
  phoneCandidates?: ExternalProfileCandidate[];
  websiteCandidates?: ExternalProfileCandidate[];
  isPrimary: boolean;
  lastSyncAttemptAt: string | null;
  lastSuccessfulSyncAt: string | null;
}

export interface ExternalLeagueSyncResult {
  teamId: string;
  linkId: string;
  provider: ExternalLeagueProvider;
  externalTeamId: string;
  receivedCount: number;
  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  enrichmentRequestCount: number;
  syncedAt: string;
}

export interface CreateExternalLeagueLinkRequest {
  provider: ExternalLeagueProvider;
  externalTeamId: string;
  isPrimary: boolean;
}

export interface ApplyExternalLeagueProfileRequest {
  useName: boolean;
  useLogo: boolean;
  useCover: boolean;
  useDescriptionMetadata: boolean;
  selectedPhoneCandidateIds: string[];
  selectedWebsiteCandidateIds: string[];
  selectedAddressCandidateIds: string[];
}

export interface ExternalProfileCandidate { candidateId: string; value: string; label?: string; }
export interface ExternalAddressCandidate {
  candidateId: string;
  venueName: string;
  address: string;
  matchCount: number;
}

export interface AppliedTeamProfile {
  teamId: string;
  name: string;
  avatarUrl: string | null;
  coverImageUrl: string | null;
}

const providerSlugs: Record<ExternalLeagueProvider, string> = {
  [ExternalLeagueProvider.Spbhl]: "spbhl",
};

const upstreamFallback = "Не удалось получить данные внешней лиги. Попробуйте позже.";
const syncAllTimeoutMs = 60_000;

async function request<T>(path: string, init: RequestInit = {}, timeoutMs?: number): Promise<T> {
  let response: Response;
  try {
    response = timeoutMs === undefined
      ? await authFetch(path, { ...init, credentials: "include" })
      : await authFetch(path, { ...init, credentials: "include" }, true, timeoutMs);
  } catch {
    throw new Error("Не удалось связаться с сервером.");
  }

  if (!response.ok) {
    if (response.status === 502) throw new Error(upstreamFallback);

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

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const linksPath = (teamId: string) => `/api/teams/${encodeURIComponent(teamId)}/external-links`;

export const searchExternalLeagueTeams = (provider: ExternalLeagueProvider, title: string) =>
  request<ExternalTeamSearchItem[]>(
    `/api/external-leagues/${providerSlugs[provider]}/teams/search?title=${encodeURIComponent(title)}`,
  );

export const getTeamExternalLeagueLinks = (teamId: string) =>
  request<ExternalLeagueLink[]>(linksPath(teamId));

export const getExternalLeagueAddressCandidates = (teamId: string) =>
  request<ExternalAddressCandidate[]>(`${linksPath(teamId)}/address-candidates`);

export const createTeamExternalLeagueLink = (teamId: string, link: CreateExternalLeagueLinkRequest) =>
  request<ExternalLeagueLink>(linksPath(teamId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(link),
  });

export const deleteTeamExternalLeagueLink = (teamId: string, linkId: string) =>
  request<void>(`${linksPath(teamId)}/${encodeURIComponent(linkId)}`, { method: "DELETE" });

export const applyExternalLeagueProfile = (
  teamId: string,
  linkId: string,
  profile: ApplyExternalLeagueProfileRequest,
) => request<AppliedTeamProfile>(`${linksPath(teamId)}/${encodeURIComponent(linkId)}/apply-profile`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(profile),
});

export const syncTeamExternalLeagueLink = (teamId: string, linkId: string) =>
  request<ExternalLeagueSyncResult>(`${linksPath(teamId)}/${encodeURIComponent(linkId)}/sync`, { method: "POST" });

export const syncAllTeamExternalLeagueLinks = (teamId: string) =>
  request<ExternalLeagueSyncResult[]>(`${linksPath(teamId)}/sync`, { method: "POST" }, syncAllTimeoutMs);
