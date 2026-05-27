import {
  CreateTeamNewsRequest,
  CreateTeamRequest,
  JoinTeamByCodeRequest,
  TeamDto,
  TeamMemberDto,
  TeamNewsDto,
  UpdateTeamMemberRequest,
  UpdateTeamNewsRequest,
  UpdateTeamRequest,
} from "src/types/teams";

const API_BASE = process.env.REACT_APP_API_BASE || "";

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
  const response = await fetch(`${API_BASE}/api/teams/public`, { credentials: "include" });
  if (!response.ok) {
    await throwTeamsApiError(response, `GET /api/teams/public failed: ${response.status}`);
  }
  return response.json();
}

export async function getMyTeams(currentUserId?: string): Promise<TeamDto[]> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetch(`${API_BASE}/api/teams?currentUserId=${encodeURIComponent(userId)}`, {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `GET /api/teams failed: ${response.status}`);
  }
  return response.json();
}

export async function getTeam(teamId: string, currentUserId?: string): Promise<TeamDto> {
  const query = currentUserId ? `?currentUserId=${encodeURIComponent(currentUserId)}` : "";
  const response = await fetch(`${API_BASE}/api/teams/${encodeURIComponent(teamId)}${query}`, {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `GET /api/teams/${teamId} failed: ${response.status}`);
  }
  return response.json();
}

export async function getTeamMembers(teamId: string): Promise<TeamMemberDto[]> {
  const response = await fetch(`${API_BASE}/api/teams/${encodeURIComponent(teamId)}/members`, {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `GET /api/teams/${teamId}/members failed: ${response.status}`);
  }
  return response.json();
}

export async function getTeamNews(teamId: string, currentUserId?: string): Promise<TeamNewsDto[]> {
  const query = currentUserId ? `?currentUserId=${encodeURIComponent(currentUserId)}` : "";
  const response = await fetch(`${API_BASE}/api/teams/${encodeURIComponent(teamId)}/news${query}`, {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `GET /api/teams/${teamId}/news failed: ${response.status}`);
  }
  return response.json();
}

export async function getNewsFeed(currentUserId?: string): Promise<TeamNewsDto[]> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetch(`${API_BASE}/api/news?currentUserId=${encodeURIComponent(userId)}`, {
    credentials: "include",
  });

  if (!response.ok) {
    await throwTeamsApiError(response, `GET /api/news failed: ${response.status}`);
  }
  return response.json();
}

export async function createTeamNews(
  teamId: string,
  request: CreateTeamNewsRequest,
  currentUserId?: string,
): Promise<TeamNewsDto> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetch(`${API_BASE}/api/teams/${encodeURIComponent(teamId)}/news?currentUserId=${encodeURIComponent(userId)}`, {
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
  const response = await fetch(
    `${API_BASE}/api/teams/${encodeURIComponent(teamId)}/news/${encodeURIComponent(newsId)}?currentUserId=${encodeURIComponent(userId)}`,
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
  const response = await fetch(
    `${API_BASE}/api/teams/${encodeURIComponent(teamId)}/news/${encodeURIComponent(newsId)}?currentUserId=${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    await throwTeamsApiError(response, `DELETE /api/teams/${teamId}/news/${newsId} failed: ${response.status}`);
  }
}

export async function createTeam(request: CreateTeamRequest, currentUserId?: string): Promise<TeamDto> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetch(`${API_BASE}/api/teams?currentUserId=${encodeURIComponent(userId)}`, {
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
  const response = await fetch(`${API_BASE}/api/teams/join-by-code?currentUserId=${encodeURIComponent(userId)}`, {
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

export async function joinPublicTeam(teamId: string, currentUserId?: string): Promise<TeamDto> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetch(
    `${API_BASE}/api/teams/${encodeURIComponent(teamId)}/join-public?currentUserId=${encodeURIComponent(userId)}`,
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

export async function updateTeam(teamId: string, request: UpdateTeamRequest, currentUserId?: string): Promise<TeamDto> {
  const userId = currentUserId ?? requireCurrentUserId();
  const response = await fetch(`${API_BASE}/api/teams/${encodeURIComponent(teamId)}?currentUserId=${encodeURIComponent(userId)}`, {
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
  const response = await fetch(
    `${API_BASE}/api/teams/${encodeURIComponent(teamId)}/members/me?currentUserId=${encodeURIComponent(userId)}`,
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
  const response = await fetch(
    `${API_BASE}/api/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}?currentUserId=${encodeURIComponent(actorId)}`,
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
  const response = await fetch(
    `${API_BASE}/api/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}?currentUserId=${encodeURIComponent(actorId)}`,
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
