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
  createAdminRelease,
  getAdminDashboard,
  getAdminReleases,
  getAdminReports,
  getAdminUsers,
  getNotificationDeliveries,
  getNotificationDeliverySummary,
  publishAdminRelease,
  sendAdminTestNotification,
  updateAdminRelease,
  updateAdminReportStatus,
} from "src/api/admin";
import { broadcastPush, PushBroadcastResult } from "src/api/push";
import { NotificationBell } from "src/components/NotificationBell";
import { useAuth } from "src/hooks/useAuth";

type AdminTab = "dashboard" | "reports" | "users" | "push" | "releases" | "notifications";

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
    return "dashboard";
  }, [location.pathname]);

  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [reports, setReports] = useState<AdminReportsListResponse | null>(null);
  const [users, setUsers] = useState<AdminUserListResponse | null>(null);
  const [releases, setReleases] = useState<ReleaseNoticeDto[]>([]);
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
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushUrl, setPushUrl] = useState("/events");
  const [pushResult, setPushResult] = useState<PushBroadcastResult | null>(null);
  const [pushSubmitting, setPushSubmitting] = useState(false);
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
