import { AttendanceLookUpDto, CreateEventDto, EventConflictDto, EventDto, EventListDto } from "../types/events";
import { authFetch } from "src/api/auth";
import { ApiError, apiErrorFromPayload, parseApiError } from "src/api/errors";

const readStoredCurrentUserId = (): string | null => {
  try {
    const saved = localStorage.getItem("currentUser");
    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved) as { id?: string | null };
    return parsed.id?.trim() || null;
  } catch {
    return null;
  }
};

const resolveCurrentUserId = (currentUserId?: string): string => {
  const userId = currentUserId?.trim() || readStoredCurrentUserId();
  if (!userId) {
    throw new Error("Необходимо авторизоваться для выполнения операции.");
  }

  return userId;
};

export async function getEvents(currentUserId?: string, teamId?: string | null): Promise<EventListDto> {
  const queryParts: string[] = [];
  if (currentUserId) {
    queryParts.push(`currentUserId=${encodeURIComponent(currentUserId)}`);
  }
  if (teamId) {
    queryParts.push(`teamId=${encodeURIComponent(teamId)}`);
  }
  const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const res = await authFetch(`/api/events${query}`, { credentials: "include" });
  if (!res.ok) {
    throw await parseApiError(res);
  }
  return res.json();
}

export async function getEvent(id: string): Promise<EventDto> {
  const res = await authFetch(`/api/events/${id}`, { credentials: "include" });
  if (!res.ok) {
    throw await parseApiError(res);
  }
  return res.json();
}

export interface TransferEventDataRequest {
  targetEventId: string;
  attendance: boolean;
  roster: boolean;
  guests: boolean;
  uniformColor: boolean;
  description: boolean;
  deleteSourceEvent: boolean;
  attendanceTransferMode: AttendanceTransferMode;
  attendanceOverrides?: AttendanceTransferOverride[];
}

export interface AttendanceTransferOverride { userId: string; resultingStatus: 1 | 2 | 3; }

export enum AttendanceTransferMode {
  ReplaceTarget = 1,
  MergePreferTarget = 2,
  ConfirmedOnly = 3,
}

export interface AttendanceTransferPreviewItem {
  userId: string;
  userDisplayName: string | null;
  sourceStatus: number;
  targetStatus: number | null;
  resultingStatus: number | null;
  automaticResultStatus?: number | null;
  finalResultStatus?: number | null;
  isOverridden?: boolean;
  willChange: boolean;
}

export interface AttendanceTransferPreview {
  items: AttendanceTransferPreviewItem[];
  changedCount: number;
}

export async function previewEventAttendanceTransfer(
  sourceEventId: string,
  targetEventId: string,
  attendanceTransferMode: AttendanceTransferMode,
): Promise<AttendanceTransferPreview> {
  const res = await authFetch(`/api/events/${encodeURIComponent(sourceEventId)}/transfer/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ targetEventId, attendanceTransferMode }),
  });
  if (!res.ok) {
    throw await parseApiError(res, "Не удалось проверить перенос явки.");
  }
  return res.json();
}

export async function transferEventData(sourceEventId: string, request: TransferEventDataRequest): Promise<{ targetEventId: string }> {
  const res = await authFetch(`/api/events/${encodeURIComponent(sourceEventId)}/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    throw await parseApiError(res, "Не удалось перенести данные мероприятия.");
  }
  return res.json();
}

export async function createEvent(data: CreateEventDto, currentUserId?: string): Promise<string> {
  const userId = resolveCurrentUserId(currentUserId);
  const res = await authFetch(`/api/events?currentUserId=${encodeURIComponent(userId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw await parseApiError(res, "Не удалось создать мероприятие.");
  }

  return res.json();
}

export async function updateEvent(
  eventId: string,
  data: Partial<CreateEventDto>,
  currentUserId?: string,
): Promise<void> {
  const userId = resolveCurrentUserId(currentUserId);
  const res = await authFetch(
    `/api/events?currentUserId=${encodeURIComponent(userId)}&eventId=${encodeURIComponent(eventId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    },
  );

  if (!res.ok) {
    throw await parseApiError(res, "Не удалось обновить мероприятие.");
  }
}

export async function deleteEvent(eventId: string, currentUserId?: string): Promise<{ message: string }> {
  const userId = resolveCurrentUserId(currentUserId);
  const res = await authFetch(
    `/api/events?currentUserId=${encodeURIComponent(userId)}&eventId=${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    },
  );

  if (!res.ok) {
    throw await parseApiError(res, "Не удалось удалить мероприятие.");
  }

  return res.json();
}

const parseAttendanceConflicts = (value: unknown): EventConflictDto[] | null => {
  if (!Array.isArray(value) || value.length === 0) return null;
  const conflicts: EventConflictDto[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    // M5 ProblemDetails extensions contain PascalCase DTOs; legacy MVC responses use camelCase.
    const field = (camel: string, pascal: string): unknown =>
      Object.prototype.hasOwnProperty.call(item, camel) ? item[camel] : item[pascal];
    const id = field("id", "Id");
    const title = field("title", "Title");
    const startTime = field("startTime", "StartTime");
    const durationMinutes = field("durationMinutes", "DurationMinutes");
    const status = field("status", "Status");
    const teamName = field("teamName", "TeamName");
    if (typeof id !== "string" || !id.trim() || typeof title !== "string"
      || typeof startTime !== "string" || !Number.isFinite(Date.parse(startTime))
      || typeof durationMinutes !== "number" || !Number.isInteger(durationMinutes) || durationMinutes < 0
      || typeof status !== "number" || !Number.isInteger(status)
      || (teamName != null && typeof teamName !== "string")) return null;
    const end = new Date(Date.parse(startTime) + durationMinutes * 60_000);
    if (!Number.isFinite(end.getTime())) return null;
    conflicts.push({ id, title, startTime, durationMinutes, status, teamName });
  }
  return conflicts;
};

export async function updateAttendance(
  eventId: string,
  userId: string,
  status: number,
  notes?: string | null,
  currentUserId?: string | null,
  ignoreConflicts = false,
): Promise<void> {
  const query = currentUserId ? `?currentUserId=${encodeURIComponent(currentUserId)}` : "";
  const res = await authFetch(`/api/events/${eventId}/attendance/${userId}${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status,
      notes: notes ?? null,
      ignoreConflicts,
    }),
  });

  if (!res.ok) {
    const data: unknown = await res.json().catch(() => null);
    const error = apiErrorFromPayload(res.status, data, "Не удалось обновить явку.");
    if (res.status === 409 && data && typeof data === "object" && "conflicts" in data) {
      const conflicts = parseAttendanceConflicts(data.conflicts);
      if (!conflicts) {
        throw new ApiError("Не удалось прочитать данные о пересечении мероприятий. Обновите страницу и попробуйте снова.", res.status, error.traceId);
      }
      throw new AttendanceConflictError(apiErrorFromPayload(res.status, data, "В это время у вас уже есть мероприятие").message, conflicts);
    }
    throw error;
  }
}

export class AttendanceConflictError extends Error {
  constructor(message: string, public readonly conflicts: EventConflictDto[]) {
    super(message);
    Object.setPrototypeOf(this, AttendanceConflictError.prototype);
    this.name = "AttendanceConflictError";
  }
}

export interface CreateEventGuestDto {
  firstName: string;
  lastName: string;
  handedness?: number | null;
  jerseyNumber?: number | null;
}

export async function createEventGuest(
  eventId: string,
  data: CreateEventGuestDto,
  currentUserId?: string | null,
): Promise<AttendanceLookUpDto> {
  const userId = resolveCurrentUserId(currentUserId ?? undefined);
  const res = await authFetch(`/api/events/${eventId}/guests?currentUserId=${encodeURIComponent(userId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw await parseApiError(res, "Не удалось добавить гостя.");
  }

  return res.json();
}

export async function updateEventGuestAttendance(
  eventId: string,
  guestId: string,
  status: number,
  notes?: string | null,
  currentUserId?: string | null,
): Promise<void> {
  const userId = resolveCurrentUserId(currentUserId ?? undefined);
  const res = await authFetch(`/api/events/${eventId}/guests/${guestId}/attendance?currentUserId=${encodeURIComponent(userId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      status,
      notes: notes ?? null,
    }),
  });

  if (!res.ok) {
    throw await parseApiError(res, "Не удалось обновить явку гостя.");
  }
}
