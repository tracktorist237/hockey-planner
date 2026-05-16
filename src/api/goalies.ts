const API_BASE = process.env.REACT_APP_API_BASE || "";

export enum GoalieRequestVisibility {
  TeamGoaliesOnly = 1,
  AllGoalies = 2,
}

export enum GoalieRequestResponseMode {
  Manual = 1,
  AutoAccept = 2,
}

export enum GoalieRequestStatus {
  Open = 1,
  Filled = 2,
  Closed = 3,
}

export enum GoalieApplicationStatus {
  Pending = 1,
  Accepted = 2,
  Rejected = 3,
  Proposed = 4,
  Confirmed = 5,
  Declined = 6,
  Cancelled = 7,
}

export enum GoalieApplicationSource {
  Application = 1,
  ManualProposal = 2,
}

export interface GoalieEventConflictDto {
  eventId: string;
  title: string;
  startTime: string;
}

export interface GoalieUserDto {
  userId: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: number | null;
  photoUrl?: string | null;
  conflict?: GoalieEventConflictDto | null;
}

export interface GoalieApplicationDto extends GoalieUserDto {
  id: string;
  status: GoalieApplicationStatus;
  source: GoalieApplicationSource;
  message?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface GoalieRequestDto {
  id: string;
  eventId: string;
  teamId?: string | null;
  neededCount: number;
  visibility: GoalieRequestVisibility;
  responseMode: GoalieRequestResponseMode;
  status: GoalieRequestStatus;
  priceText?: string | null;
  description?: string | null;
  confirmedCount: number;
  createdAt: string;
  updatedAt?: string | null;
  applications: GoalieApplicationDto[];
}

export interface EventGoaliesDto {
  isGoalie: boolean;
  isTeamMember: boolean;
  canManage: boolean;
  canApply: boolean;
  currentUserConflict?: GoalieEventConflictDto | null;
  myApplication?: GoalieApplicationDto | null;
  request?: GoalieRequestDto | null;
  availableGoalies: GoalieUserDto[];
  previousRequests: GoalieRequestDto[];
}

export interface UpsertGoalieRequestPayload {
  neededCount: number;
  visibility: GoalieRequestVisibility;
  responseMode: GoalieRequestResponseMode;
  priceText?: string | null;
  description?: string | null;
}

const ensureOk = async (response: Response, fallbackMessage: string): Promise<void> => {
  if (response.ok) {
    return;
  }

  const errorData = await response.json().catch(() => null);
  throw new Error(errorData?.message || errorData?.error || `${fallbackMessage}: ${response.status}`);
};

const goalieUrl = (eventId: string, currentUserId: string, path = "") =>
  `${API_BASE}/api/events/${encodeURIComponent(eventId)}/goalies${path}?currentUserId=${encodeURIComponent(currentUserId)}`;

export const getEventGoalies = async (eventId: string, currentUserId: string): Promise<EventGoaliesDto> => {
  const response = await fetch(goalieUrl(eventId, currentUserId));
  await ensureOk(response, "Не удалось загрузить вкладку вратарей");
  return response.json();
};

export const upsertGoalieRequest = async (
  eventId: string,
  currentUserId: string,
  payload: UpsertGoalieRequestPayload,
): Promise<GoalieRequestDto> => {
  const response = await fetch(goalieUrl(eventId, currentUserId, "/request"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await ensureOk(response, "Не удалось сохранить объявление");
  return response.json();
};

export const applyForGoalieRequest = async (
  eventId: string,
  currentUserId: string,
  message?: string | null,
): Promise<GoalieApplicationDto> => {
  const response = await fetch(goalieUrl(eventId, currentUserId, "/apply"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  await ensureOk(response, "Не удалось отправить заявку");
  return response.json();
};

export const proposeGoalie = async (
  eventId: string,
  currentUserId: string,
  goalieUserId: string,
  message?: string | null,
): Promise<GoalieApplicationDto> => {
  const response = await fetch(goalieUrl(eventId, currentUserId, "/propose"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goalieUserId, message }),
  });
  await ensureOk(response, "Не удалось предложить вратарю");
  return response.json();
};

export const updateGoalieApplicationStatus = async (
  eventId: string,
  currentUserId: string,
  applicationId: string,
  status: GoalieApplicationStatus,
): Promise<GoalieApplicationDto> => {
  const response = await fetch(goalieUrl(eventId, currentUserId, `/applications/${applicationId}/status`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  await ensureOk(response, "Не удалось изменить статус заявки");
  return response.json();
};
