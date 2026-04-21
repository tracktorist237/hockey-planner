import { CreateTeamRequest, JoinTeamByCodeRequest, TeamDto, TeamMemberDto } from "src/types/teams";

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
