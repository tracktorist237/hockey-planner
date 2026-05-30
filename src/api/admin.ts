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

export async function createAppReport(request: CreateAppReportRequest): Promise<AppReportDto> {
  const response = await authFetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  return requireJson(response);
}
