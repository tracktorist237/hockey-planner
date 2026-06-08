import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AdminDashboardResponse,
  AdminReportsListResponse,
  AdminUserListResponse,
  AppReportDto,
  AppReportSeverity,
  AppReportStatus,
  AppReportType,
  CreateUpdateReleaseNoticeRequest,
  NotificationDeliveryListResponse,
  NotificationDeliveryStatus,
  NotificationDeliverySummaryResponse,
  ReleaseNoticeDto,
  createAdminInstruction,
  createAdminRelease,
  deleteAdminInstruction,
  downloadDatabaseBackup,
  getAdminDashboard,
  getAdminInstructions,
  getAdminReleases,
  getAdminReports,
  getAdminUsers,
  getNotificationDeliveries,
  getNotificationDeliverySummary,
  publishAdminInstruction,
  publishAdminRelease,
  sendAdminTestNotification,
  unpublishAdminInstruction,
  updateAdminInstruction,
  updateAdminRelease,
  updateAdminReportStatus,
  uploadAdminInstructionImage,
} from "src/api/admin";
import { CreateUpdateInstructionArticleRequest, InstructionArticleDto } from "src/api/instructions";
import { broadcastPush, PushBroadcastResult } from "src/api/push";
import { NotificationBell } from "src/components/NotificationBell";
import { useAuth } from "src/hooks/useAuth";

type AdminTab = "dashboard" | "reports" | "users" | "push" | "releases" | "notifications" | "instructions";

const pageStyle = {
  minHeight: "100vh",
  background: "var(--hp-bg-gradient)",
  color: "var(--hp-text)",
  paddingBottom: 40,
  overflowX: "hidden",
} as const;

const shellStyle = {
  width: "100%",
  maxWidth: 1040,
  margin: "0 auto",
  boxSizing: "border-box",
} as const;

const cardStyle = {
  background: "var(--hp-surface)",
  border: "1px solid var(--hp-border)",
  borderRadius: 16,
  boxShadow: "var(--hp-shadow-sm)",
  padding: 16,
  minWidth: 0,
  boxSizing: "border-box",
} as const;

const inputStyle = {
  width: "100%",
  border: "1px solid var(--hp-border)",
  background: "var(--hp-input-bg)",
  color: "var(--hp-text)",
  borderRadius: 12,
  padding: 12,
  boxSizing: "border-box",
} as const;

const typeLabels: Record<AppReportType, string> = {
  [AppReportType.Bug]: "Ошибка",
  [AppReportType.Complaint]: "Жалоба",
  [AppReportType.Idea]: "Идея",
  [AppReportType.Abuse]: "Нарушение",
  [AppReportType.Other]: "Другое",
};

const statusLabels: Record<AppReportStatus, string> = {
  [AppReportStatus.New]: "Новое",
  [AppReportStatus.Triage]: "Разбор",
  [AppReportStatus.InProgress]: "В работе",
  [AppReportStatus.Resolved]: "Решено",
  [AppReportStatus.Rejected]: "Отклонено",
};

const severityLabels: Record<AppReportSeverity, string> = {
  [AppReportSeverity.Low]: "Низкая",
  [AppReportSeverity.Medium]: "Средняя",
  [AppReportSeverity.High]: "Высокая",
  [AppReportSeverity.Critical]: "Критичная",
};

const deliveryStatusLabels: Record<NotificationDeliveryStatus, string> = {
  [NotificationDeliveryStatus.Pending]: "Pending",
  [NotificationDeliveryStatus.Sent]: "Sent",
  [NotificationDeliveryStatus.Failed]: "Failed",
  [NotificationDeliveryStatus.Skipped]: "Skipped",
  [NotificationDeliveryStatus.EndpointInactive]: "Endpoint inactive",
};

const emptyReleaseForm: CreateUpdateReleaseNoticeRequest = {
  version: "",
  title: "",
  body: "",
  sendNotification: true,
};

const emptyInstructionForm: CreateUpdateInstructionArticleRequest = {
  slug: "",
  title: "",
  summary: "",
  content: "",
  imageUrl: "",
  isPublished: false,
  sortOrder: 0,
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });
};

export function AdminPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 720);
  const tab = useMemo<AdminTab>(() => {
    if (location.pathname.endsWith("/reports")) return "reports";
    if (location.pathname.endsWith("/users")) return "users";
    if (location.pathname.endsWith("/push")) return "push";
    if (location.pathname.endsWith("/releases")) return "releases";
    if (location.pathname.endsWith("/notifications")) return "notifications";
    if (location.pathname.endsWith("/instructions")) return "instructions";
    return "dashboard";
  }, [location.pathname]);

  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [reports, setReports] = useState<AdminReportsListResponse | null>(null);
  const [users, setUsers] = useState<AdminUserListResponse | null>(null);
  const [releases, setReleases] = useState<ReleaseNoticeDto[]>([]);
  const [instructions, setInstructions] = useState<InstructionArticleDto[]>([]);
  const [deliverySummary, setDeliverySummary] = useState<NotificationDeliverySummaryResponse | null>(null);
  const [deliveries, setDeliveries] = useState<NotificationDeliveryListResponse | null>(null);
  const [selectedReport, setSelectedReport] = useState<AppReportDto | null>(null);
  const [reportStatus, setReportStatus] = useState<AppReportStatus | "">("");
  const [reportType, setReportType] = useState<AppReportType | "">("");
  const [reportSeverity, setReportSeverity] = useState<AppReportSeverity | "">("");
  const [deliveryStatus, setDeliveryStatus] = useState<NotificationDeliveryStatus | "">("");
  const [userSearch, setUserSearch] = useState("");
  const [releaseForm, setReleaseForm] = useState<CreateUpdateReleaseNoticeRequest>(emptyReleaseForm);
  const [editingReleaseId, setEditingReleaseId] = useState<string | null>(null);
  const [instructionForm, setInstructionForm] = useState<CreateUpdateInstructionArticleRequest>(emptyInstructionForm);
  const [editingInstructionId, setEditingInstructionId] = useState<string | null>(null);
  const [instructionImageUploading, setInstructionImageUploading] = useState(false);
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushUrl, setPushUrl] = useState("/events");
  const [pushResult, setPushResult] = useState<PushBroadcastResult | null>(null);
  const [pushSubmitting, setPushSubmitting] = useState(false);
  const [backupDownloading, setBackupDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => setIsNarrow(window.innerWidth < 720);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadDashboard = async () => setDashboard(await getAdminDashboard());

  const loadReports = async () => {
    const data = await getAdminReports({ status: reportStatus, type: reportType, severity: reportSeverity });
    setReports(data);
    if (selectedReport) setSelectedReport(data.items.find((item) => item.id === selectedReport.id) ?? null);
  };

  const loadUsers = async () => setUsers(await getAdminUsers(userSearch));
  const loadReleases = async () => setReleases(await getAdminReleases());
  const loadInstructions = async () => setInstructions(await getAdminInstructions());

  const loadDeliveries = async () => {
    const [summary, list] = await Promise.all([
      getNotificationDeliverySummary({ status: deliveryStatus }),
      getNotificationDeliveries({ status: deliveryStatus }),
    ]);
    setDeliverySummary(summary);
    setDeliveries(list);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    const run =
      tab === "dashboard"
        ? loadDashboard
        : tab === "reports"
          ? loadReports
          : tab === "users"
            ? loadUsers
            : tab === "releases"
              ? loadReleases
              : tab === "notifications"
                ? loadDeliveries
                : tab === "instructions"
                  ? loadInstructions
                  : null;

    if (!run) {
      setLoading(false);
      return;
    }

    void run()
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить админ-панель."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, reportStatus, reportType, reportSeverity, deliveryStatus]);

  const openTab = (nextTab: AdminTab) => navigate(nextTab === "dashboard" ? "/admin" : `/admin/${nextTab}`);

  const downloadBackup = async () => {
    setError(null);
    setMessage(null);
    setBackupDownloading(true);

    try {
      const { blob, fileName } = await downloadDatabaseBackup();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage("Бэкап БД скачан.");
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Не удалось скачать бэкап БД.");
    } finally {
      setBackupDownloading(false);
    }
  };

  const saveRelease = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      if (editingReleaseId) {
        await updateAdminRelease(editingReleaseId, releaseForm);
        setMessage("Release обновлён.");
      } else {
        await createAdminRelease(releaseForm);
        setMessage("Release создан как черновик.");
      }

      setReleaseForm(emptyReleaseForm);
      setEditingReleaseId(null);
      await loadReleases();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Не удалось сохранить release.");
    }
  };

  const saveInstruction = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      if (editingInstructionId) {
        await updateAdminInstruction(editingInstructionId, instructionForm);
        setMessage("Инструкция обновлена.");
      } else {
        await createAdminInstruction(instructionForm);
        setMessage("Инструкция создана.");
      }

      setInstructionForm(emptyInstructionForm);
      setEditingInstructionId(null);
      await loadInstructions();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Не удалось сохранить инструкцию.");
    }
  };

  const editInstruction = (instruction: InstructionArticleDto) => {
    setEditingInstructionId(instruction.id);
    setInstructionForm({
      slug: instruction.slug,
      title: instruction.title,
      summary: instruction.summary ?? "",
      content: instruction.content,
      imageUrl: instruction.imageUrl ?? "",
      isPublished: Boolean(instruction.isPublished),
      sortOrder: instruction.sortOrder,
    });
  };

  const uploadInstructionImage = async (file?: File) => {
    if (!file) {
      return;
    }

    setError(null);
    setMessage(null);
    setInstructionImageUploading(true);

    try {
      const imageUrl = await uploadAdminInstructionImage(file);
      setInstructionForm((current) => ({ ...current, imageUrl }));
      setMessage("Изображение загружено.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Не удалось загрузить изображение.");
    } finally {
      setInstructionImageUploading(false);
    }
  };

  const metricCards = dashboard
    ? [
        ["Пользователи", dashboard.totalUsers],
        ["Команды", dashboard.totalTeams],
        ["Мероприятия", dashboard.totalEvents],
        ["За 7 дней", dashboard.eventsLast7Days],
        ["Активные push", dashboard.activePushSubscriptions],
        ["Открытые обращения", dashboard.openReports],
      ]
    : [];

  return (
    <div style={pageStyle}>
      <div style={{ background: "var(--hp-surface)", borderBottom: "1px solid var(--hp-border)", boxShadow: "var(--hp-shadow-sm)" }}>
        <div style={{ ...shellStyle, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <button type="button" onClick={() => navigate("/settings")} style={{ border: "1px solid var(--hp-border)", borderRadius: 999, padding: "7px 11px", background: "var(--hp-surface-soft)", color: "var(--hp-heading)", fontWeight: 900, cursor: "pointer", marginBottom: 10 }}>
                ← Назад
              </button>
              <h1 style={{ margin: 0, fontSize: 22, color: "var(--hp-heading)" }}>Админ-панель</h1>
              <div style={{ marginTop: 4, color: "var(--hp-muted)", fontSize: 13 }}>Глобальное управление HockeyPlanner</div>
            </div>
            <NotificationBell currentUserId={currentUser?.id} />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16, overflowX: "auto" }}>
            {[
              ["dashboard", "Обзор"],
              ["reports", "Обращения"],
              ["users", "Пользователи"],
              ["notifications", "Доставки"],
              ["releases", "Что нового"],
              ["instructions", "Инструкции"],
              ["push", "Push"],
            ].map(([key, label]) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => openTab(key as AdminTab)}
                  style={{
                    border: active ? "1px solid var(--hp-primary)" : "1px solid var(--hp-border)",
                    borderRadius: 999,
                    padding: "9px 13px",
                    background: active ? "var(--hp-primary)" : "var(--hp-surface-soft)",
                    color: active ? "white" : "var(--hp-heading)",
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ ...shellStyle, padding: 16, display: "grid", gap: 14 }}>
        {error && <div style={{ ...cardStyle, background: "var(--hp-danger-soft)", color: "var(--hp-danger)", fontWeight: 800 }}>{error}</div>}
        {message && <div style={{ ...cardStyle, background: "var(--hp-success-soft)", color: "var(--hp-success)", fontWeight: 800 }}>{message}</div>}
        {loading && <div style={cardStyle}>Загрузка...</div>}

        {tab === "dashboard" && dashboard && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10 }}>
              {metricCards.map(([label, value]) => (
                <div key={label} style={cardStyle}>
                  <div style={{ color: "var(--hp-muted)", fontSize: 13, marginBottom: 6 }}>{label}</div>
                  <div style={{ color: "var(--hp-heading)", fontSize: 28, fontWeight: 900 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ ...cardStyle, display: "grid", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: "var(--hp-heading)" }}>Состояние сервиса</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                <StatusItem label="Backend" value={`v${dashboard.backendVersion}`} ok />
                <StatusItem label="Environment" value={dashboard.environment} ok />
                <StatusItem label="Email" value={dashboard.emailConfigured ? "Настроен" : "Не настроен"} ok={dashboard.emailConfigured} />
                <StatusItem label="Push" value={dashboard.pushConfigured ? "Настроен" : "Не настроен"} ok={dashboard.pushConfigured} />
                <StatusItem label="ImageKit" value={dashboard.imageKitConfigured ? "Настроен" : "Не настроен"} ok={dashboard.imageKitConfigured} />
                <StatusItem label="Inactive push" value={String(dashboard.inactivePushSubscriptions)} ok={dashboard.inactivePushSubscriptions === 0} />
                <StatusItem label="Notifications" value={String(dashboard.totalNotifications)} ok />
                <StatusItem label="Failed deliveries" value={String(dashboard.failedDeliveries)} ok={dashboard.failedDeliveries === 0} />
              </div>
              <button
                type="button"
                onClick={async () => {
                  setError(null);
                  setMessage(null);
                  try {
                    await sendAdminTestNotification();
                    setMessage("Тестовое уведомление отправлено.");
                  } catch (sendError) {
                    setError(sendError instanceof Error ? sendError.message : "Не удалось отправить тестовое уведомление.");
                  }
                }}
                style={{ justifySelf: "start", border: 0, borderRadius: 12, padding: "11px 14px", background: "var(--hp-primary)", color: "white", fontWeight: 900, cursor: "pointer" }}
              >
                Отправить тестовое уведомление себе
              </button>
            </div>
            <div style={{ ...cardStyle, display: "grid", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: "var(--hp-heading)" }}>Резервная копия</h2>
              <div style={{ color: "var(--hp-muted)", fontSize: 13 }}>
                Бэкап содержит персональные данные. Храните файл безопасно.
              </div>
              <button
                type="button"
                onClick={downloadBackup}
                disabled={backupDownloading}
                style={{
                  justifySelf: "start",
                  border: 0,
                  borderRadius: 12,
                  padding: "11px 14px",
                  background: backupDownloading ? "var(--hp-muted)" : "var(--hp-primary)",
                  color: "white",
                  fontWeight: 900,
                  cursor: backupDownloading ? "wait" : "pointer",
                }}
              >
                {backupDownloading ? "Скачивание..." : "Скачать бэкап БД"}
              </button>
            </div>
          </>
        )}

        {tab === "reports" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ ...cardStyle, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
              <FilterSelect value={reportStatus} onChange={(value) => setReportStatus(value ? Number(value) as AppReportStatus : "")} label="Статус" options={statusLabels} />
              <FilterSelect value={reportType} onChange={(value) => setReportType(value ? Number(value) as AppReportType : "")} label="Тип" options={typeLabels} />
              <FilterSelect value={reportSeverity} onChange={(value) => setReportSeverity(value ? Number(value) as AppReportSeverity : "")} label="Важность" options={severityLabels} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: selectedReport && !isNarrow ? "minmax(0, 1fr) minmax(280px, 380px)" : "1fr", gap: 12 }}>
              <div style={{ display: "grid", gap: 10 }}>
                {(reports?.items ?? []).map((report) => (
                  <button key={report.id} type="button" onClick={() => setSelectedReport(report)} style={{ ...cardStyle, textAlign: "left", cursor: "pointer", borderColor: selectedReport?.id === report.id ? "var(--hp-primary)" : "var(--hp-border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
                      <div>
                        <div style={{ color: "var(--hp-heading)", fontWeight: 900 }}>{report.title}</div>
                        <div style={{ color: "var(--hp-muted)", fontSize: 13, marginTop: 4 }}>{formatDate(report.createdAt)} · {report.userName || "Анонимно"}</div>
                      </div>
                      <Badge text={statusLabels[report.status]} tone={report.status === AppReportStatus.New ? "warning" : report.status === AppReportStatus.Resolved ? "success" : "neutral"} />
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                      <Badge text={typeLabels[report.type]} tone="primary" />
                      <Badge text={severityLabels[report.severity]} tone={report.severity >= AppReportSeverity.High ? "danger" : "neutral"} />
                    </div>
                  </button>
                ))}
                {!loading && reports?.items.length === 0 && <div style={cardStyle}>Обращений не найдено.</div>}
              </div>
              {selectedReport && (
                <div style={{ ...cardStyle, alignSelf: "start", display: "grid", gap: 10 }}>
                  <h2 style={{ margin: 0, color: "var(--hp-heading)", fontSize: 18 }}>{selectedReport.title}</h2>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{selectedReport.message}</div>
                  <Meta label="Пользователь" value={selectedReport.userName || selectedReport.userEmail || "Анонимно"} />
                  <Meta label="Route" value={selectedReport.route || "-"} />
                  <Meta label="Версия" value={selectedReport.appVersion || "-"} />
                  <Meta label="Платформа" value={selectedReport.platform || "-"} />
                  <label style={{ display: "grid", gap: 6, fontWeight: 800, color: "var(--hp-heading)" }}>
                    Статус
                    <select
                      value={selectedReport.status}
                      onChange={async (event) => {
                        const nextStatus = Number(event.target.value) as AppReportStatus;
                        const updated = await updateAdminReportStatus(selectedReport.id, nextStatus);
                        setSelectedReport(updated);
                        await loadReports();
                      }}
                      style={inputStyle}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "users" && (
          <div style={{ display: "grid", gap: 12 }}>
            <form onSubmit={(event) => { event.preventDefault(); void loadUsers(); }} style={{ ...cardStyle, display: "flex", gap: 8 }}>
              <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Поиск по имени или email" style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
              <button type="submit" style={{ border: 0, borderRadius: 12, padding: "0 14px", background: "var(--hp-primary)", color: "white", fontWeight: 900 }}>Найти</button>
            </form>
            <div style={{ display: "grid", gap: 10 }}>
              {(users?.items ?? []).map((user) => (
                <div key={user.id} style={cardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ color: "var(--hp-heading)", fontWeight: 900 }}>{user.lastName} {user.firstName}</div>
                      <div style={{ color: "var(--hp-muted)", fontSize: 13 }}>{user.email || "email не указан"} · {formatDate(user.createdAt)}</div>
                    </div>
                    <Badge text={user.appRole === 2 ? "SuperAdmin" : "User"} tone={user.appRole === 2 ? "primary" : "neutral"} />
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    <Badge text={user.emailConfirmed ? "email подтверждён" : "email не подтверждён"} tone={user.emailConfirmed ? "success" : "warning"} />
                    <Badge text={`команд: ${user.teamsCount}`} tone="neutral" />
                    <Badge text={`push: ${user.pushSubscriptionsCount}`} tone="neutral" />
                  </div>
                </div>
              ))}
              {!loading && users?.items.length === 0 && <div style={cardStyle}>Пользователей не найдено.</div>}
            </div>
          </div>
        )}

        {tab === "releases" && (
          <div style={{ display: "grid", gap: 12 }}>
            <form onSubmit={saveRelease} style={{ ...cardStyle, display: "grid", gap: 12 }}>
              <h2 style={{ margin: 0, color: "var(--hp-heading)", fontSize: 18 }}>{editingReleaseId ? "Редактировать release" : "Новый release"}</h2>
              <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "120px minmax(0, 1fr)", gap: 10 }}>
                <label style={{ display: "grid", gap: 6, color: "var(--hp-heading)", fontSize: 13, fontWeight: 800, minWidth: 0 }}>
                  Version
                  <input value={releaseForm.version} onChange={(event) => setReleaseForm({ ...releaseForm, version: event.target.value })} maxLength={50} style={inputStyle} />
                </label>
                <label style={{ display: "grid", gap: 6, color: "var(--hp-heading)", fontSize: 13, fontWeight: 800, minWidth: 0 }}>
                  Заголовок
                  <input value={releaseForm.title} onChange={(event) => setReleaseForm({ ...releaseForm, title: event.target.value })} maxLength={180} style={inputStyle} />
                </label>
              </div>
              <label style={{ display: "grid", gap: 6, color: "var(--hp-heading)", fontSize: 13, fontWeight: 800, minWidth: 0 }}>
                Что нового
                <textarea value={releaseForm.body} onChange={(event) => setReleaseForm({ ...releaseForm, body: event.target.value })} rows={5} maxLength={4000} style={{ ...inputStyle, resize: "vertical" }} />
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "var(--hp-heading)", fontWeight: 800, cursor: "pointer", userSelect: "none", minWidth: 0, lineHeight: 1.35, overflowWrap: "anywhere", overflow: "hidden" }}>
                <span style={{ position: "relative", width: 22, height: 22, flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={releaseForm.sendNotification}
                    onChange={(event) => setReleaseForm({ ...releaseForm, sendNotification: event.target.checked })}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      margin: 0,
                      opacity: 0,
                      cursor: "pointer",
                    }}
                  />
                  <span
                    aria-hidden="true"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      border: releaseForm.sendNotification ? "1px solid var(--hp-primary)" : "1px solid var(--hp-border)",
                      background: releaseForm.sendNotification ? "var(--hp-primary)" : "var(--hp-input-bg)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      fontWeight: 900,
                      boxShadow: releaseForm.sendNotification ? "var(--hp-shadow-sm)" : "inset 0 0 0 1px var(--hp-surface-soft)",
                    }}
                  >
                    {releaseForm.sendNotification ? "✓" : ""}
                  </span>
                </span>
                <span>Отправить уведомление при публикации</span>
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="submit" style={{ border: 0, borderRadius: 12, padding: "12px 16px", background: "var(--hp-primary)", color: "white", fontWeight: 900, cursor: "pointer" }}>
                  {editingReleaseId ? "Сохранить" : "Создать"}
                </button>
                {editingReleaseId && (
                  <button type="button" onClick={() => { setEditingReleaseId(null); setReleaseForm(emptyReleaseForm); }} style={{ border: "1px solid var(--hp-border)", borderRadius: 12, padding: "12px 16px", background: "var(--hp-surface-soft)", color: "var(--hp-heading)", fontWeight: 900, cursor: "pointer" }}>
                    Отмена
                  </button>
                )}
              </div>
            </form>

            <div style={{ display: "grid", gap: 10 }}>
              {releases.map((release) => (
                <div key={release.id} style={{ ...cardStyle, overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0, flex: "1 1 220px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <strong style={{ color: "var(--hp-heading)", fontSize: 16, overflowWrap: "anywhere" }}>{release.version}</strong>
                        <Badge text={release.isPublished ? "Published" : "Draft"} tone={release.isPublished ? "success" : "warning"} />
                        {release.notificationSent && <Badge text="notification sent" tone="primary" />}
                      </div>
                      <div style={{ color: "var(--hp-heading)", fontWeight: 900, marginTop: 8, overflowWrap: "anywhere" }}>{release.title}</div>
                      <div style={{ color: "var(--hp-muted)", fontSize: 13, marginTop: 4 }}>Создано: {formatDate(release.createdAt)} · Опубликовано: {formatDate(release.publishedAt)}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: isNarrow ? "100%" : "auto" }}>
                      <button type="button" onClick={() => { setEditingReleaseId(release.id); setReleaseForm({ version: release.version, title: release.title, body: release.body, sendNotification: release.sendNotification }); }} style={{ border: "1px solid var(--hp-border)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-surface-soft)", color: "var(--hp-heading)", fontWeight: 900, cursor: "pointer", flex: isNarrow ? "1 1 0" : "0 0 auto", minWidth: 0 }}>
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setError(null);
                          setMessage(null);
                          try {
                            await publishAdminRelease(release.id);
                            setMessage("Release опубликован.");
                            await loadReleases();
                          } catch (publishError) {
                            setError(publishError instanceof Error ? publishError.message : "Не удалось опубликовать release.");
                          }
                        }}
                        style={{ border: 0, borderRadius: 12, padding: "10px 12px", background: "var(--hp-primary)", color: "white", fontWeight: 900, cursor: "pointer", flex: isNarrow ? "1 1 0" : "0 0 auto", minWidth: 0 }}
                      >
                        Опубликовать
                      </button>
                    </div>
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", color: "var(--hp-text)", marginTop: 12, lineHeight: 1.45, overflowWrap: "anywhere" }}>{release.body}</div>
                </div>
              ))}
              {!loading && releases.length === 0 && <div style={cardStyle}>Release notices пока нет.</div>}
            </div>
          </div>
        )}

        {tab === "instructions" && (
          <div style={{ display: "grid", gap: 12 }}>
            <form onSubmit={saveInstruction} style={{ ...cardStyle, display: "grid", gap: 12 }}>
              <h2 style={{ margin: 0, color: "var(--hp-heading)", fontSize: 18 }}>{editingInstructionId ? "Редактировать инструкцию" : "Новая инструкция"}</h2>
              <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) 170px", gap: 10 }}>
                <Field label="Title">
                  <input value={instructionForm.title} onChange={(event) => setInstructionForm({ ...instructionForm, title: event.target.value })} maxLength={180} style={inputStyle} />
                </Field>
                <Field label="Sort order">
                  <input type="number" value={instructionForm.sortOrder} onChange={(event) => setInstructionForm({ ...instructionForm, sortOrder: Number(event.target.value) || 0 })} style={inputStyle} />
                </Field>
              </div>
              <Field label="Slug">
                <input value={instructionForm.slug} onChange={(event) => setInstructionForm({ ...instructionForm, slug: event.target.value.toLowerCase() })} maxLength={120} placeholder="getting-started" style={inputStyle} />
              </Field>
              <Field label="Summary">
                <textarea value={instructionForm.summary ?? ""} onChange={(event) => setInstructionForm({ ...instructionForm, summary: event.target.value })} rows={2} maxLength={500} style={{ ...inputStyle, resize: "vertical" }} />
              </Field>
              <Field label="Content">
                <textarea value={instructionForm.content} onChange={(event) => setInstructionForm({ ...instructionForm, content: event.target.value })} rows={8} maxLength={12000} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.45 }} />
              </Field>
              <Field label="Image">
                <div style={{ display: "grid", gap: 8 }}>
                  <input value={instructionForm.imageUrl ?? ""} onChange={(event) => setInstructionForm({ ...instructionForm, imageUrl: event.target.value })} placeholder="https://..." style={inputStyle} />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => void uploadInstructionImage(event.target.files?.[0])}
                    style={{ ...inputStyle, padding: 10 }}
                  />
                  {instructionImageUploading && <div style={{ color: "var(--hp-muted)", fontSize: 13 }}>Загрузка изображения...</div>}
                  {instructionForm.imageUrl && (
                    <img src={instructionForm.imageUrl} alt="" style={{ width: "100%", maxWidth: 360, borderRadius: 12, border: "1px solid var(--hp-border)", background: "var(--hp-surface-soft)" }} />
                  )}
                </div>
              </Field>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "var(--hp-heading)", fontWeight: 800, cursor: "pointer", userSelect: "none", lineHeight: 1.35 }}>
                <span style={{ position: "relative", width: 22, height: 22, flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={instructionForm.isPublished}
                    onChange={(event) => setInstructionForm({ ...instructionForm, isPublished: event.target.checked })}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      margin: 0,
                      opacity: 0,
                      cursor: "pointer",
                    }}
                  />
                  <span
                    aria-hidden="true"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      border: instructionForm.isPublished ? "1px solid var(--hp-primary)" : "1px solid var(--hp-border)",
                      background: instructionForm.isPublished ? "var(--hp-primary)" : "var(--hp-input-bg)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      fontWeight: 900,
                      boxShadow: instructionForm.isPublished ? "var(--hp-shadow-sm)" : "inset 0 0 0 1px var(--hp-surface-soft)",
                    }}
                  >
                    {instructionForm.isPublished ? "✓" : ""}
                  </span>
                </span>
                <span>Опубликовать инструкцию</span>
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="submit" style={{ border: 0, borderRadius: 12, padding: "12px 16px", background: "var(--hp-primary)", color: "white", fontWeight: 900, cursor: "pointer" }}>
                  {editingInstructionId ? "Сохранить" : "Создать"}
                </button>
                {editingInstructionId && (
                  <button type="button" onClick={() => { setEditingInstructionId(null); setInstructionForm(emptyInstructionForm); }} style={{ border: "1px solid var(--hp-border)", borderRadius: 12, padding: "12px 16px", background: "var(--hp-surface-soft)", color: "var(--hp-heading)", fontWeight: 900, cursor: "pointer" }}>
                    Отмена
                  </button>
                )}
              </div>
            </form>

            <div style={{ display: "grid", gap: 10 }}>
              {instructions.map((instruction) => (
                <div key={instruction.id} style={{ ...cardStyle, display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0, flex: "1 1 240px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <strong style={{ color: "var(--hp-heading)", overflowWrap: "anywhere" }}>{instruction.title}</strong>
                        <Badge text={instruction.isPublished ? "Published" : "Draft"} tone={instruction.isPublished ? "success" : "warning"} />
                        <Badge text={`#${instruction.sortOrder}`} tone="neutral" />
                      </div>
                      <div style={{ color: "var(--hp-muted)", fontSize: 13, marginTop: 4, overflowWrap: "anywhere" }}>
                        /instructions/{instruction.slug}
                      </div>
                      {instruction.summary && <div style={{ marginTop: 8, color: "var(--hp-text)", lineHeight: 1.45 }}>{instruction.summary}</div>}
                    </div>
                    {instruction.imageUrl && <img src={instruction.imageUrl} alt="" style={{ width: 92, aspectRatio: "16 / 10", objectFit: "cover", borderRadius: 10, border: "1px solid var(--hp-border)" }} />}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button type="button" onClick={() => editInstruction(instruction)} style={{ border: "1px solid var(--hp-border)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-surface-soft)", color: "var(--hp-heading)", fontWeight: 900, cursor: "pointer" }}>
                      Изменить
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setError(null);
                        setMessage(null);
                        try {
                          if (instruction.isPublished) {
                            await unpublishAdminInstruction(instruction.id);
                            setMessage("Инструкция скрыта.");
                          } else {
                            await publishAdminInstruction(instruction.id);
                            setMessage("Инструкция опубликована.");
                          }
                          await loadInstructions();
                        } catch (publishError) {
                          setError(publishError instanceof Error ? publishError.message : "Не удалось изменить публикацию.");
                        }
                      }}
                      style={{ border: 0, borderRadius: 12, padding: "10px 12px", background: instruction.isPublished ? "var(--hp-warning)" : "var(--hp-primary)", color: "white", fontWeight: 900, cursor: "pointer" }}
                    >
                      {instruction.isPublished ? "Скрыть" : "Опубликовать"}
                    </button>
                    <button type="button" onClick={() => window.open(`/instructions/${instruction.slug}`, "_blank", "noopener,noreferrer")} style={{ border: "1px solid var(--hp-border)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-surface-soft)", color: "var(--hp-heading)", fontWeight: 900, cursor: "pointer" }}>
                      Открыть
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm("Удалить инструкцию?")) {
                          return;
                        }
                        setError(null);
                        setMessage(null);
                        try {
                          await deleteAdminInstruction(instruction.id);
                          setMessage("Инструкция удалена.");
                          if (editingInstructionId === instruction.id) {
                            setEditingInstructionId(null);
                            setInstructionForm(emptyInstructionForm);
                          }
                          await loadInstructions();
                        } catch (deleteError) {
                          setError(deleteError instanceof Error ? deleteError.message : "Не удалось удалить инструкцию.");
                        }
                      }}
                      style={{ border: "1px solid var(--hp-danger)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-danger-soft)", color: "var(--hp-danger)", fontWeight: 900, cursor: "pointer" }}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
              {!loading && instructions.length === 0 && <div style={cardStyle}>Инструкций пока нет.</div>}
            </div>
          </div>
        )}

        {tab === "notifications" && (
          <div style={{ display: "grid", gap: 12 }}>
            {deliverySummary && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10 }}>
                <Metric label="Total" value={deliverySummary.total} />
                <Metric label="Sent" value={deliverySummary.sent} tone="success" />
                <Metric label="Failed" value={deliverySummary.failed} tone="danger" />
                <Metric label="Skipped" value={deliverySummary.skipped} tone="warning" />
                <Metric label="Inactive endpoint" value={deliverySummary.endpointInactive} tone="warning" />
                <Metric label="Active push" value={deliverySummary.activePushSubscriptions} />
                <Metric label="Inactive push" value={deliverySummary.inactivePushSubscriptions} />
              </div>
            )}

            <div style={{ ...cardStyle, display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(180px, 260px) 1fr", gap: 10 }}>
              <FilterSelect value={deliveryStatus} onChange={(value) => setDeliveryStatus(value ? Number(value) as NotificationDeliveryStatus : "")} label="Статус доставки" options={deliveryStatusLabels} />
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {(deliveries?.items ?? []).map((delivery) => (
                <div key={delivery.id} style={cardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ color: "var(--hp-heading)", fontWeight: 900 }}>{delivery.notificationTitle || "Notification"}</div>
                      <div style={{ color: "var(--hp-muted)", fontSize: 13, marginTop: 4 }}>
                        {delivery.userName || delivery.userEmail || delivery.userId} · {formatDate(delivery.createdAt)}
                      </div>
                    </div>
                    <Badge text={deliveryStatusLabels[delivery.status]} tone={delivery.status === NotificationDeliveryStatus.Sent ? "success" : delivery.status === NotificationDeliveryStatus.Failed ? "danger" : delivery.status === NotificationDeliveryStatus.EndpointInactive ? "warning" : "neutral"} />
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    <Badge text={`type: ${delivery.notificationType ?? "-"}`} tone="neutral" />
                    <Badge text={`category: ${delivery.notificationCategory ?? "-"}`} tone="neutral" />
                    <Badge text={`sent: ${formatDate(delivery.sentAt)}`} tone="neutral" />
                    {delivery.endpointHash && <Badge text={`endpoint: ${delivery.endpointHash.slice(0, 12)}`} tone="neutral" />}
                  </div>
                  {delivery.error && <div style={{ marginTop: 10, color: "var(--hp-danger)", overflowWrap: "anywhere", fontSize: 13 }}>{delivery.error}</div>}
                </div>
              ))}
              {!loading && deliveries?.items.length === 0 && <div style={cardStyle}>Доставок не найдено.</div>}
            </div>
          </div>
        )}

        {tab === "push" && (
          <div style={{ ...cardStyle, display: "grid", gap: 14 }}>
            <div>
              <h2 style={{ margin: 0, color: "var(--hp-heading)", fontSize: 18 }}>Push-рассылка</h2>
              <div style={{ marginTop: 4, color: "var(--hp-muted)", fontSize: 13 }}>Массовая отправка всем активным push-подпискам. Используй осторожно.</div>
            </div>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                setError(null);
                setMessage(null);
                setPushResult(null);
                if (!pushTitle.trim() || !pushBody.trim()) {
                  setError("Заполните заголовок и текст push-уведомления.");
                  return;
                }
                setPushSubmitting(true);
                try {
                  const result = await broadcastPush({ title: pushTitle.trim(), body: pushBody.trim(), url: pushUrl.trim() || "/events" });
                  setPushResult(result);
                  setMessage("Push-рассылка завершена.");
                } catch (sendError) {
                  setError(sendError instanceof Error ? sendError.message : "Не удалось отправить push.");
                } finally {
                  setPushSubmitting(false);
                }
              }}
              style={{ display: "grid", gap: 12 }}
            >
              <Field label="Заголовок"><input value={pushTitle} onChange={(event) => setPushTitle(event.target.value)} maxLength={120} style={inputStyle} /></Field>
              <Field label="Текст"><textarea value={pushBody} onChange={(event) => setPushBody(event.target.value)} rows={4} maxLength={500} style={{ ...inputStyle, resize: "vertical" }} /></Field>
              <Field label="Ссылка при клике"><input value={pushUrl} onChange={(event) => setPushUrl(event.target.value)} placeholder="/events" style={inputStyle} /></Field>
              <button type="submit" disabled={pushSubmitting} style={{ justifySelf: "start", border: 0, borderRadius: 12, padding: "12px 16px", background: pushSubmitting ? "var(--hp-muted)" : "var(--hp-primary)", color: "white", fontWeight: 900, cursor: pushSubmitting ? "wait" : "pointer" }}>
                {pushSubmitting ? "Отправка..." : "Отправить всем"}
              </button>
            </form>
            {pushResult && (
              <div style={{ border: "1px solid var(--hp-success-border)", borderRadius: 12, padding: 12, background: "var(--hp-success-soft)", color: "var(--hp-success)", fontWeight: 800 }}>
                Отправлено: {pushResult.sent} из {pushResult.total}. Отключено неактуальных подписок: {pushResult.removed}.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusItem({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div style={{ border: "1px solid var(--hp-border)", borderRadius: 12, padding: 12, background: "var(--hp-surface-soft)" }}>
      <div style={{ color: "var(--hp-muted)", fontSize: 12, marginBottom: 4 }}>{label}</div>
      <div style={{ color: ok ? "var(--hp-success)" : "var(--hp-warning)", fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function Metric({ label, value, tone = "primary" }: { label: string; value: number; tone?: "primary" | "success" | "warning" | "danger" }) {
  const color = tone === "success" ? "var(--hp-success)" : tone === "warning" ? "var(--hp-warning)" : tone === "danger" ? "var(--hp-danger)" : "var(--hp-heading)";
  return (
    <div style={cardStyle}>
      <div style={{ color: "var(--hp-muted)", fontSize: 13, marginBottom: 6 }}>{label}</div>
      <div style={{ color, fontSize: 28, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function Badge({ text, tone }: { text: string; tone: "primary" | "success" | "warning" | "danger" | "neutral" }) {
  const colors = {
    primary: ["var(--hp-primary-soft)", "var(--hp-primary)"],
    success: ["var(--hp-success-soft)", "var(--hp-success)"],
    warning: ["var(--hp-warning-soft)", "var(--hp-warning)"],
    danger: ["var(--hp-danger-soft)", "var(--hp-danger)"],
    neutral: ["var(--hp-neutral-soft)", "var(--hp-neutral)"],
  }[tone];

  return <span style={{ borderRadius: 999, padding: "4px 9px", background: colors[0], color: colors[1], fontSize: 12, fontWeight: 900 }}>{text}</span>;
}

function FilterSelect<T extends number>({
  value,
  onChange,
  label,
  options,
}: {
  value: T | "";
  onChange: (value: string) => void;
  label: string;
  options: Record<T, string>;
}) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 800, color: "var(--hp-heading)" }}>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle}>
        <option value="">Все</option>
        {Object.entries(options).map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel as string}</option>)}
      </select>
    </label>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6, color: "var(--hp-heading)", fontSize: 13, fontWeight: 800 }}>
      {label}
      {children}
    </label>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ fontSize: 13 }}>
      <span style={{ color: "var(--hp-muted)" }}>{label}: </span>
      <span style={{ color: "var(--hp-text)", overflowWrap: "anywhere" }}>{value}</span>
    </div>
  );
}
