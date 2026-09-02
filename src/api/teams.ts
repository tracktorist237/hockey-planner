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

const API_REQUEST_TIMEOUT_MS = 10000;

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

const requireCurrentUserId = (): string => {
  const saved = localStorage.getItem("currentUser");
  if (!saved) {
    throw new Error("Необходимо выбрать пользователя");
  }

  try {
    const parsed = JSON.parse(saved) as { id?: string | null };
    if (!parsed.id) {
      throw new Error("Необходимо выбрать пользователя");
    }
    return parsed.id;
  } catch {
    throw new Error("Необходимо выбрать пользователя");
  }
};

export class TeamsApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "TeamsApiError";
    this.status = status;
  }
}

const throwTeamsApiError = async (response: Response, fallbackMessage: string): Promise<never> => {
  const text = await response.text().catch(() => "");
  throw new TeamsApiError(text || fallbackMessage, response.status);
};

export async function getPublicTeams(): Promise<TeamDto[]> {
  const response = await fetchWithTimeout(buildApiUrl("/api/teams/public"), { credentials: "include" });
  if (!response.ok) {
    await throwTeamsApiError(response, `GET /api/teams/public failed: ${response.status}`);
  }
  return response.json();
}

export async function getMyTeams(currentUserId?: string): Promise<TeamDto[]> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetchWithTimeout(buildApiUrl(`/api/teams?currentUserId=${encodeURIComponent(userId)}`), {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `GET /api/teams failed: ${response.status}`);
  }
  return response.json();
}

export async function getTeam(teamId: string, currentUserId?: string): Promise<TeamDto> {
  const query = currentUserId ? `?currentUserId=${encodeURIComponent(currentUserId)}` : "";
  const response = await fetchWithTimeout(buildApiUrl(`/api/teams/${encodeURIComponent(teamId)}${query}`), {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `GET /api/teams/${teamId} failed: ${response.status}`);
  }
  return response.json();
}

export async function getTeamMembers(teamId: string): Promise<TeamMemberDto[]> {
  const response = await fetchWithTimeout(buildApiUrl(`/api/teams/${encodeURIComponent(teamId)}/members`), {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `GET /api/teams/${teamId}/members failed: ${response.status}`);
  }
  return response.json();
}

export async function getTeamNews(teamId: string, currentUserId?: string): Promise<TeamNewsDto[]> {
  const query = currentUserId ? `?currentUserId=${encodeURIComponent(currentUserId)}` : "";
  const response = await fetchWithTimeout(buildApiUrl(`/api/teams/${encodeURIComponent(teamId)}/news${query}`), {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `GET /api/teams/${teamId}/news failed: ${response.status}`);
  }
  return response.json();
}

export async function getNewsFeed(currentUserId?: string): Promise<TeamNewsDto[]> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetchWithTimeout(buildApiUrl(`/api/news?currentUserId=${encodeURIComponent(userId)}`), {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `GET /api/news failed: ${response.status}`);
  }
  return response.json();
}

export async function getTablesFeed(currentUserId?: string): Promise<TeamTableSummaryDto[]> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetchWithTimeout(buildApiUrl(`/api/news/tables?currentUserId=${encodeURIComponent(userId)}`), {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `GET /api/news/tables failed: ${response.status}`);
  }
  return response.json();
}

export async function getTeamTables(teamId: string, currentUserId?: string): Promise<TeamTableSummaryDto[]> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetchWithTimeout(buildApiUrl(`/api/teams/${encodeURIComponent(teamId)}/tables?currentUserId=${encodeURIComponent(userId)}`), {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `GET /api/teams/${teamId}/tables failed: ${response.status}`);
  }
  return response.json();
}

export async function getTeamTable(teamId: string, tableId: string, currentUserId?: string): Promise<TeamTableDto> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetchWithTimeout(
    buildApiUrl(`/api/teams/${encodeURIComponent(teamId)}/tables/${encodeURIComponent(tableId)}?currentUserId=${encodeURIComponent(userId)}`),
    { credentials: "include" },
  );

  if (!response.ok) {
    await throwTeamsApiError(response, `GET /api/teams/${teamId}/tables/${tableId} failed: ${response.status}`);
  }
  return response.json();
}

export async function createTeamTable(
  teamId: string,
  request: CreateTeamTableRequest,
  currentUserId?: string,
): Promise<TeamTableDto> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetchWithTimeout(buildApiUrl(`/api/teams/${encodeURIComponent(teamId)}/tables?currentUserId=${encodeURIComponent(userId)}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `POST /api/teams/${teamId}/tables failed: ${response.status}`);
  }
  return response.json();
}

export async function getEventTableProtocols(eventId: string, currentUserId?: string): Promise<EventTableProtocolDto[]> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetchWithTimeout(buildApiUrl(`/api/events/${encodeURIComponent(eventId)}/table-protocols?currentUserId=${encodeURIComponent(userId)}`), {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `GET /api/events/${eventId}/table-protocols failed: ${response.status}`);
  }
  return response.json();
}

export async function createEventTableProtocol(
  eventId: string,
  request: { teamTableId: string },
  currentUserId?: string,
): Promise<EventTableProtocolDto> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetchWithTimeout(buildApiUrl(`/api/events/${encodeURIComponent(eventId)}/table-protocols?currentUserId=${encodeURIComponent(userId)}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `POST /api/events/${eventId}/table-protocols failed: ${response.status}`);
  }
  return response.json();
}

export async function updateEventTableProtocolRow(
  eventId: string,
  protocolId: string,
  rowId: string,
  request: UpdateEventTableProtocolRowRequest,
  currentUserId?: string,
): Promise<EventTableProtocolDto> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetchWithTimeout(
    buildApiUrl(`/api/events/${encodeURIComponent(eventId)}/table-protocols/${encodeURIComponent(protocolId)}/rows/${encodeURIComponent(rowId)}?currentUserId=${encodeURIComponent(userId)}`),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    await throwTeamsApiError(response, `PUT /api/events/${eventId}/table-protocols/${protocolId}/rows/${rowId} failed: ${response.status}`);
  }
  return response.json();
}

export async function updateEventTableProtocol(
  eventId: string,
  protocolId: string,
  request: UpdateEventTableProtocolRequest,
  currentUserId?: string,
): Promise<EventTableProtocolDto> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetchWithTimeout(
    buildApiUrl(`/api/events/${encodeURIComponent(eventId)}/table-protocols/${encodeURIComponent(protocolId)}?currentUserId=${encodeURIComponent(userId)}`),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    await throwTeamsApiError(response, `PUT /api/events/${eventId}/table-protocols/${protocolId} failed: ${response.status}`);
  }
  return response.json();
}

export async function createTeamNews(
  teamId: string,
  request: CreateTeamNewsRequest,
  currentUserId?: string,
): Promise<TeamNewsDto> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetchWithTimeout(buildApiUrl(`/api/teams/${encodeURIComponent(teamId)}/news?currentUserId=${encodeURIComponent(userId)}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `POST /api/teams/${teamId}/news failed: ${response.status}`);
  }
  return response.json();
}

export async function updateTeamNews(
  teamId: string,
  newsId: string,
  request: UpdateTeamNewsRequest,
  currentUserId?: string,
): Promise<TeamNewsDto> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetchWithTimeout(
    buildApiUrl(`/api/teams/${encodeURIComponent(teamId)}/news/${encodeURIComponent(newsId)}?currentUserId=${encodeURIComponent(userId)}`),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    await throwTeamsApiError(response, `PUT /api/teams/${teamId}/news/${newsId} failed: ${response.status}`);
  }
  return response.json();
}

export async function deleteTeamNews(teamId: string, newsId: string, currentUserId?: string): Promise<void> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetchWithTimeout(
    buildApiUrl(`/api/teams/${encodeURIComponent(teamId)}/news/${encodeURIComponent(newsId)}?currentUserId=${encodeURIComponent(userId)}`),
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    await throwTeamsApiError(response, `DELETE /api/teams/${teamId}/news/${newsId} failed: ${response.status}`);
  }
}

export async function uploadTeamAvatar(teamId: string, file: File, currentUserId?: string): Promise<TeamDto> {
  const userId = currentUserId ?? requireCurrentUserId();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithTimeout(buildApiUrl(`/api/teams/${encodeURIComponent(teamId)}/avatar/upload?currentUserId=${encodeURIComponent(userId)}`), {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `POST /api/teams/${teamId}/avatar/upload failed: ${response.status}`);
  }
  return response.json();
}

export async function uploadTeamCover(teamId: string, file: File, currentUserId?: string): Promise<TeamDto> {
  const userId = currentUserId ?? requireCurrentUserId();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithTimeout(buildApiUrl(`/api/teams/${encodeURIComponent(teamId)}/cover/upload?currentUserId=${encodeURIComponent(userId)}`), {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `POST /api/teams/${teamId}/cover/upload failed: ${response.status}`);
  }
  return response.json();
}

export async function uploadTeamNewsImage(teamId: string, file: File, currentUserId?: string): Promise<string> {
  const userId = currentUserId ?? requireCurrentUserId();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithTimeout(buildApiUrl(`/api/teams/${encodeURIComponent(teamId)}/news/upload-image?currentUserId=${encodeURIComponent(userId)}`), {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `POST /api/teams/${teamId}/news/upload-image failed: ${response.status}`);
  }

  const data = (await response.json()) as { imageUrl?: string };
  if (!data.imageUrl) {
    throw new TeamsApiError("Upload response does not contain imageUrl", response.status);
  }

  return data.imageUrl;
}

export async function createTeam(request: CreateTeamRequest, currentUserId?: string): Promise<TeamDto> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetchWithTimeout(buildApiUrl(`/api/teams?currentUserId=${encodeURIComponent(userId)}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `POST /api/teams failed: ${response.status}`);
  }
  return response.json();
}

export async function joinTeamByCode(request: JoinTeamByCodeRequest, currentUserId?: string): Promise<TeamDto> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetchWithTimeout(buildApiUrl(`/api/teams/join-by-code?currentUserId=${encodeURIComponent(userId)}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `POST /api/teams/join-by-code failed: ${response.status}`);
  }
  return response.json();
}

export async function joinPublicTeam(teamId: string, currentUserId?: string, teamJerseyNumber?: number | null): Promise<TeamDto> {
  const userId = currentUserId ?? requireCurrentUserId();
  const numberQuery = teamJerseyNumber === null || teamJerseyNumber === undefined ? "" : `&teamJerseyNumber=${teamJerseyNumber}`;
  const response = await fetchWithTimeout(
    buildApiUrl(`/api/teams/${encodeURIComponent(teamId)}/join-public?currentUserId=${encodeURIComponent(userId)}${numberQuery}`),
    {
      method: "POST",
      credentials: "include",
    },
  );

  if (!response.ok) {
    await throwTeamsApiError(response, `POST /api/teams/${teamId}/join-public failed: ${response.status}`);
  }
  return response.json();
}

export async function updateMyTeamJerseyNumber(teamId: string, teamJerseyNumber: number | null, currentUserId?: string): Promise<TeamDto> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetchWithTimeout(buildApiUrl(`/api/teams/${encodeURIComponent(teamId)}/members/me/number?currentUserId=${encodeURIComponent(userId)}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ teamJerseyNumber }),
  });
  if (!response.ok) {
    await throwTeamsApiError(response, `PUT /api/teams/${teamId}/members/me/number failed: ${response.status}`);
  }
  return response.json();
}

export async function updateTeam(teamId: string, request: UpdateTeamRequest, currentUserId?: string): Promise<TeamDto> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetchWithTimeout(buildApiUrl(`/api/teams/${encodeURIComponent(teamId)}?currentUserId=${encodeURIComponent(userId)}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `PUT /api/teams/${teamId} failed: ${response.status}`);
  }
  return response.json();
}

export async function leaveTeam(teamId: string, currentUserId?: string): Promise<void> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetchWithTimeout(
    buildApiUrl(`/api/teams/${encodeURIComponent(teamId)}/members/me?currentUserId=${encodeURIComponent(userId)}`),
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    await throwTeamsApiError(response, `DELETE /api/teams/${teamId}/members/me failed: ${response.status}`);
  }
}

export async function removeTeamMember(teamId: string, userId: string, currentUserId?: string): Promise<void> {
  const actorId = currentUserId ?? requireCurrentUserId();
  const response = await fetchWithTimeout(
    buildApiUrl(`/api/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}?currentUserId=${encodeURIComponent(actorId)}`),
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    await throwTeamsApiError(response, `DELETE /api/teams/${teamId}/members/${userId} failed: ${response.status}`);
  }
}

export async function updateTeamMember(
  teamId: string,
  userId: string,
  request: UpdateTeamMemberRequest,
  currentUserId?: string,
): Promise<TeamMemberDto> {
  const actorId = currentUserId ?? requireCurrentUserId();
  const response = await fetchWithTimeout(
    buildApiUrl(`/api/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}?currentUserId=${encodeURIComponent(actorId)}`),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    await throwTeamsApiError(response, `PUT /api/teams/${teamId}/members/${userId} failed: ${response.status}`);
  }
  return response.json();
}
