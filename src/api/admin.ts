import { authFetch } from "src/api/auth";

export enum AppReportType {
  Bug = 1,
  Complaint = 2,
  Idea = 3,
  Abuse = 4,
  Other = 5,
}

export enum AppReportStatus {
  New = 1,
  Triage = 2,
  InProgress = 3,
  Resolved = 4,
  Rejected = 5,
}

export enum AppReportSeverity {
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4,
}

export enum NotificationDeliveryStatus {
  Pending = 1,
  Sent = 2,
  Failed = 3,
  Skipped = 4,
  EndpointInactive = 5,
}

export interface AdminDashboardResponse {
  totalUsers: number;
  totalTeams: number;
  totalEvents: number;
  eventsLast7Days: number;
  activePushSubscriptions: number;
  inactivePushSubscriptions: number;
  totalNotifications: number;
  failedDeliveries: number;
  unreadReports: number;
  openReports: number;
  backendVersion: string;
  environment: string;
  emailConfigured: boolean;
  pushConfigured: boolean;
  imageKitConfigured: boolean;
}

export interface AdminUserDto {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  emailConfirmed: boolean;
  appRole: number;
  createdAt: string;
  teamsCount: number;
  pushSubscriptionsCount: number;
}

export interface AdminUserListResponse {
  page: number;
  pageSize: number;
  total: number;
  items: AdminUserDto[];
}

export interface AppReportDto {
  id: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  type: AppReportType;
  status: AppReportStatus;
  severity: AppReportSeverity;
  title: string;
  message: string;
  route?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  appVersion?: string | null;
  platform?: string | null;
  userAgent?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  resolvedAt?: string | null;
}

export interface AdminReportsListResponse {
  page: number;
  pageSize: number;
  total: number;
  items: AppReportDto[];
}

export interface CreateAppReportRequest {
  type: AppReportType;
  severity?: AppReportSeverity;
  title: string;
  message: string;
  route?: string;
  entityType?: string;
  entityId?: string;
  appVersion?: string;
  platform?: string;
  userAgent?: string;
}

export interface ReleaseNoticeDto {
  id: string;
  version: string;
  title: string;
  body: string;
  isPublished: boolean;
  sendNotification: boolean;
  notificationSent: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  createdByUserId?: string | null;
}

export interface CreateUpdateReleaseNoticeRequest {
  version: string;
  title: string;
  body: string;
  sendNotification: boolean;
}

export interface NotificationDeliverySummaryResponse {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  endpointInactive: number;
  activePushSubscriptions: number;
  inactivePushSubscriptions: number;
}

export interface NotificationDeliveryDto {
  id: string;
  notificationId: string;
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  pushSubscriptionId?: string | null;
  status: NotificationDeliveryStatus;
  error?: string | null;
  endpointHash?: string | null;
  createdAt: string;
  sentAt?: string | null;
  notificationTitle?: string | null;
  notificationType?: number | null;
  notificationCategory?: number | null;
}

export interface NotificationDeliveryListResponse {
  page: number;
  pageSize: number;
  total: number;
  items: NotificationDeliveryDto[];
}

export interface DatabaseBackupDownload {
  blob: Blob;
  fileName: string;
}

const readErrorMessage = async (response: Response): Promise<string> => {
  const text = await response.text();
  if (!text) {
    return `${response.status} ${response.statusText}`;
  }

  try {
    const data = JSON.parse(text) as { message?: string; error?: string };
    return data.message ?? data.error ?? text;
  } catch {
    return text;
  }
};

const requireJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as T;
};

const getFileNameFromContentDisposition = (contentDisposition: string | null): string | null => {
  if (!contentDisposition) {
    return null;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].replace(/"/g, ""));
  }

  const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return fileNameMatch?.[1] ?? null;
};

export async function getAdminDashboard(): Promise<AdminDashboardResponse> {
  return requireJson(await authFetch("/api/admin/dashboard"));
}

export async function getAdminUsers(search = "", page = 1, pageSize = 25): Promise<AdminUserListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search.trim()) {
    params.set("search", search.trim());
  }

  return requireJson(await authFetch(`/api/admin/users?${params.toString()}`));
}

export async function getAdminReports(params: {
  status?: AppReportStatus | "";
  type?: AppReportType | "";
  severity?: AppReportSeverity | "";
  userId?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<AdminReportsListResponse> {
  const search = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 25),
  });

  if (params.status) search.set("status", String(params.status));
  if (params.type) search.set("type", String(params.type));
  if (params.severity) search.set("severity", String(params.severity));
  if (params.userId) search.set("userId", params.userId);

  return requireJson(await authFetch(`/api/admin/reports?${search.toString()}`));
}

export async function getAdminReport(id: string): Promise<AppReportDto> {
  return requireJson(await authFetch(`/api/admin/reports/${encodeURIComponent(id)}`));
}

export async function updateAdminReportStatus(id: string, status: AppReportStatus): Promise<AppReportDto> {
  return requireJson(await authFetch(`/api/admin/reports/${encodeURIComponent(id)}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }));
}

export async function sendAdminTestNotification(): Promise<void> {
  const response = await authFetch("/api/admin/notifications/test", { method: "POST" });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}

export async function downloadDatabaseBackup(): Promise<DatabaseBackupDownload> {
  const response = await authFetch("/api/admin/backup/database");
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return {
    blob: await response.blob(),
    fileName: getFileNameFromContentDisposition(response.headers.get("Content-Disposition")) ?? "hockeyplanner-backup.dump",
  };
}

export async function getAdminReleases(): Promise<ReleaseNoticeDto[]> {
  return requireJson(await authFetch("/api/admin/releases"));
}

export async function createAdminRelease(request: CreateUpdateReleaseNoticeRequest): Promise<ReleaseNoticeDto> {
  return requireJson(await authFetch("/api/admin/releases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  }));
}

export async function updateAdminRelease(id: string, request: CreateUpdateReleaseNoticeRequest): Promise<ReleaseNoticeDto> {
  return requireJson(await authFetch(`/api/admin/releases/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  }));
}

export async function publishAdminRelease(id: string): Promise<ReleaseNoticeDto> {
  return requireJson(await authFetch(`/api/admin/releases/${encodeURIComponent(id)}/publish`, { method: "POST" }));
}

export async function getNotificationDeliverySummary(params: {
  status?: NotificationDeliveryStatus | "";
} = {}): Promise<NotificationDeliverySummaryResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set("status", String(params.status));

  const suffix = search.toString() ? `?${search.toString()}` : "";
  return requireJson(await authFetch(`/api/admin/notification-deliveries/summary${suffix}`));
}

export async function getNotificationDeliveries(params: {
  status?: NotificationDeliveryStatus | "";
  page?: number;
  pageSize?: number;
} = {}): Promise<NotificationDeliveryListResponse> {
  const search = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 25),
  });

  if (params.status) search.set("status", String(params.status));

  return requireJson(await authFetch(`/api/admin/notification-deliveries?${search.toString()}`));
}

export async function createAppReport(request: CreateAppReportRequest): Promise<AppReportDto> {
  const response = await authFetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  return requireJson(response);
}
