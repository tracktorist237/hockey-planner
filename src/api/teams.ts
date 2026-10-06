import { readApiErrorMessage } from "src/api/errors";
import {
  CreateTeamNewsRequest,
  CreateTeamRequest,
  CreateTeamTableRequest,
  EventTableProtocolDto,
  JoinTeamByCodeRequest,
  TeamDto,
  TeamMemberDto,
  TeamNewsDto,
  TeamTableDto,
  TeamTableSummaryDto,
  UpdateEventTableProtocolRequest,
  UpdateEventTableProtocolRowRequest,
  UpdateTeamMemberRequest,
  UpdateTeamNewsRequest,
  UpdateTeamRequest,
} from "src/types/teams";
import { buildApiUrl } from "src/api/client";
import { authFetch } from "src/api/auth";

const API_REQUEST_TIMEOUT_MS = 10000;

// Reuse bearer attachment and coordinated refresh for JWT-backed team routes.
const fetchWithTeamAuth = (input: string, init: RequestInit = {}): Promise<Response> =>
  authFetch(input, init, true, API_REQUEST_TIMEOUT_MS);

const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
  if (typeof AbortController === "undefined") {
    return Promise.race([
      fetch(input, init),
      new Promise<Response>((_, reject) => {
        window.setTimeout(() => reject(new Error("Request timed out")), API_REQUEST_TIMEOUT_MS);
      }),
    ]);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const getTeamPwaManifestUrl = (teamId: string, appName: string): string => {
  const path = `/api/pwa/teams/${encodeURIComponent(teamId)}/manifest.webmanifest`;
  const url = new URL(buildApiUrl(path), window.location.origin);
  url.searchParams.set("name", appName);
  return url.href;
};

export const getTeamPwaIconUrl = (teamId: string, size: 180 | 192 | 512): string =>
  new URL(
    buildApiUrl(`/api/pwa/teams/${encodeURIComponent(teamId)}/icons/${size}.png`),
    window.location.origin,
  ).href;

export class TeamsApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "TeamsApiError";
    this.status = status;
  }
}

const throwTeamsApiError = async (response: Response): Promise<never> => {
  const message = await readApiErrorMessage(response);
  throw new TeamsApiError(message, response.status);
};

export async function getPublicTeams(): Promise<TeamDto[]> {
  const response = await fetchWithTimeout(buildApiUrl("/api/teams/public"), { credentials: "include" });
  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function getMyTeams(): Promise<TeamDto[]> {
  const response = await fetchWithTeamAuth(`/api/teams`, {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function getTeam(teamId: string): Promise<TeamDto> {
  const response = await fetchWithTeamAuth(`/api/teams/${encodeURIComponent(teamId)}`, {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function getTeamMembers(teamId: string): Promise<TeamMemberDto[]> {
  const response = await fetchWithTeamAuth(`/api/teams/${encodeURIComponent(teamId)}/members`, {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function getTeamNews(teamId: string): Promise<TeamNewsDto[]> {
  const response = await fetchWithTeamAuth(`/api/teams/${encodeURIComponent(teamId)}/news`, {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function getNewsFeed(): Promise<TeamNewsDto[]> {
  const response = await fetchWithTeamAuth(`/api/news`, {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function getTablesFeed(): Promise<TeamTableSummaryDto[]> {
  const response = await fetchWithTeamAuth(`/api/news/tables`, {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function getTeamTables(teamId: string): Promise<TeamTableSummaryDto[]> {
  const response = await fetchWithTeamAuth(`/api/teams/${encodeURIComponent(teamId)}/tables`, {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function getTeamTable(teamId: string, tableId: string): Promise<TeamTableDto> {
  const response = await fetchWithTeamAuth(
    `/api/teams/${encodeURIComponent(teamId)}/tables/${encodeURIComponent(tableId)}`,
    { credentials: "include" },
  );

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function createTeamTable(
  teamId: string,
  request: CreateTeamTableRequest,
): Promise<TeamTableDto> {
  const response = await fetchWithTeamAuth(`/api/teams/${encodeURIComponent(teamId)}/tables`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function getEventTableProtocols(eventId: string): Promise<EventTableProtocolDto[]> {
  const response = await fetchWithTeamAuth(`/api/events/${encodeURIComponent(eventId)}/table-protocols`, {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function createEventTableProtocol(
  eventId: string,
  request: { teamTableId: string },
): Promise<EventTableProtocolDto> {
  const response = await fetchWithTeamAuth(`/api/events/${encodeURIComponent(eventId)}/table-protocols`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function updateEventTableProtocolRow(
  eventId: string,
  protocolId: string,
  rowId: string,
  request: UpdateEventTableProtocolRowRequest,
): Promise<EventTableProtocolDto> {
  const response = await fetchWithTeamAuth(
    `/api/events/${encodeURIComponent(eventId)}/table-protocols/${encodeURIComponent(protocolId)}/rows/${encodeURIComponent(rowId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function updateEventTableProtocol(
  eventId: string,
  protocolId: string,
  request: UpdateEventTableProtocolRequest,
): Promise<EventTableProtocolDto> {
  const response = await fetchWithTeamAuth(
    `/api/events/${encodeURIComponent(eventId)}/table-protocols/${encodeURIComponent(protocolId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function createTeamNews(
  teamId: string,
  request: CreateTeamNewsRequest,
): Promise<TeamNewsDto> {
  const response = await fetchWithTeamAuth(`/api/teams/${encodeURIComponent(teamId)}/news`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function updateTeamNews(
  teamId: string,
  newsId: string,
  request: UpdateTeamNewsRequest,
): Promise<TeamNewsDto> {
  const response = await fetchWithTeamAuth(
    `/api/teams/${encodeURIComponent(teamId)}/news/${encodeURIComponent(newsId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function deleteTeamNews(teamId: string, newsId: string): Promise<void> {
  const response = await fetchWithTeamAuth(
    `/api/teams/${encodeURIComponent(teamId)}/news/${encodeURIComponent(newsId)}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
}

export async function uploadTeamAvatar(teamId: string, file: File): Promise<TeamDto> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithTeamAuth(`/api/teams/${encodeURIComponent(teamId)}/avatar/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function uploadTeamCover(teamId: string, file: File): Promise<TeamDto> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithTeamAuth(`/api/teams/${encodeURIComponent(teamId)}/cover/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function uploadTeamNewsImage(teamId: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithTeamAuth(`/api/teams/${encodeURIComponent(teamId)}/news/upload-image`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    await throwTeamsApiError(response);
  }

  const data = (await response.json()) as { imageUrl?: string };
  if (!data.imageUrl) {
    throw new TeamsApiError("Upload response does not contain imageUrl", response.status);
  }

  return data.imageUrl;
}

export async function createTeam(request: CreateTeamRequest): Promise<TeamDto> {
  const response = await fetchWithTeamAuth(`/api/teams`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function joinTeamByCode(request: JoinTeamByCodeRequest): Promise<TeamDto> {
  const response = await fetchWithTeamAuth(`/api/teams/join-by-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function joinPublicTeam(teamId: string, teamJerseyNumber?: number | null): Promise<TeamDto> {
  const numberQuery = teamJerseyNumber === null || teamJerseyNumber === undefined ? "" : `?teamJerseyNumber=${teamJerseyNumber}`;
  const response = await fetchWithTeamAuth(
    `/api/teams/${encodeURIComponent(teamId)}/join-public${numberQuery}`,
    {
      method: "POST",
      credentials: "include",
    },
  );

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function updateMyTeamJerseyNumber(teamId: string, teamJerseyNumber: number | null): Promise<TeamDto> {
  const response = await fetchWithTeamAuth(`/api/teams/${encodeURIComponent(teamId)}/members/me/number`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ teamJerseyNumber }),
  });
  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function updateTeam(teamId: string, request: UpdateTeamRequest): Promise<TeamDto> {
  const response = await fetchWithTeamAuth(`/api/teams/${encodeURIComponent(teamId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}

export async function leaveTeam(teamId: string): Promise<void> {
  const response = await fetchWithTeamAuth(
    `/api/teams/${encodeURIComponent(teamId)}/members/me`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
}

export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  const response = await fetchWithTeamAuth(
    `/api/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
}

export async function updateTeamMember(
  teamId: string,
  userId: string,
  request: UpdateTeamMemberRequest,
): Promise<TeamMemberDto> {
  const response = await fetchWithTeamAuth(
    `/api/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    await throwTeamsApiError(response);
  }
  return response.json();
}
