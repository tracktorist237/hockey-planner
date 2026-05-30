import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AdminDashboardResponse,
  AdminReportsListResponse,
  AdminUserListResponse,
  AppReportDto,
  AppReportSeverity,
  AppReportStatus,
  AppReportType,
  getAdminDashboard,
  getAdminReports,
  getAdminUsers,
  sendAdminTestNotification,
  updateAdminReportStatus,
} from "src/api/admin";
import { broadcastPush, PushBroadcastResult } from "src/api/push";
import { NotificationBell } from "src/components/NotificationBell";
import { useAuth } from "src/hooks/useAuth";

type AdminTab = "dashboard" | "reports" | "users" | "push";

const pageStyle = {
  minHeight: "100vh",
  background: "var(--hp-bg-gradient)",
  color: "var(--hp-text)",
  paddingBottom: 40,
} as const;

const shellStyle = {
  width: "100%",
  maxWidth: 1040,
  margin: "0 auto",
} as const;

const cardStyle = {
  background: "var(--hp-surface)",
  border: "1px solid var(--hp-border)",
  borderRadius: 16,
  boxShadow: "var(--hp-shadow-sm)",
  padding: 16,
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

const formatDate = (value: string) => new Date(value).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });

export function AdminPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const tab = useMemo<AdminTab>(() => {
    if (location.pathname.endsWith("/reports")) return "reports";
    if (location.pathname.endsWith("/users")) return "users";
    if (location.pathname.endsWith("/push")) return "push";
    return "dashboard";
  }, [location.pathname]);

  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [reports, setReports] = useState<AdminReportsListResponse | null>(null);
  const [users, setUsers] = useState<AdminUserListResponse | null>(null);
  const [selectedReport, setSelectedReport] = useState<AppReportDto | null>(null);
  const [reportStatus, setReportStatus] = useState<AppReportStatus | "">("");
  const [reportType, setReportType] = useState<AppReportType | "">("");
  const [reportSeverity, setReportSeverity] = useState<AppReportSeverity | "">("");
  const [userSearch, setUserSearch] = useState("");
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushUrl, setPushUrl] = useState("/events");
  const [pushResult, setPushResult] = useState<PushBroadcastResult | null>(null);
  const [pushSubmitting, setPushSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setDashboard(await getAdminDashboard());
  };

  const loadReports = async () => {
    const data = await getAdminReports({ status: reportStatus, type: reportType, severity: reportSeverity });
    setReports(data);
    if (selectedReport) {
      setSelectedReport(data.items.find((item) => item.id === selectedReport.id) ?? null);
    }
  };

  const loadUsers = async () => {
    setUsers(await getAdminUsers(userSearch));
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    const run = tab === "dashboard" ? loadDashboard : tab === "reports" ? loadReports : loadUsers;
    if (tab === "push") {
      setLoading(false);
      return;
    }

    void run()
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить админ-панель."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, reportStatus, reportType, reportSeverity]);

  const openTab = (nextTab: AdminTab) => {
    navigate(nextTab === "dashboard" ? "/admin" : `/admin/${nextTab}`);
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

            <div style={{ display: "grid", gridTemplateColumns: selectedReport ? "minmax(0, 1fr) minmax(280px, 380px)" : "1fr", gap: 12 }}>
              <div style={{ display: "grid", gap: 10 }}>
                {(reports?.items ?? []).map((report) => (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => setSelectedReport(report)}
                    style={{
                      ...cardStyle,
                      textAlign: "left",
                      cursor: "pointer",
                      borderColor: selectedReport?.id === report.id ? "var(--hp-primary)" : "var(--hp-border)",
                    }}
                  >
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
                      style={{ border: "1px solid var(--hp-border)", background: "var(--hp-input-bg)", color: "var(--hp-text)", borderRadius: 12, padding: 11 }}
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
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void loadUsers();
              }}
              style={{ ...cardStyle, display: "flex", gap: 8 }}
            >
              <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Поиск по имени или email" style={{ flex: 1, minWidth: 0, border: "1px solid var(--hp-border)", background: "var(--hp-input-bg)", color: "var(--hp-text)", borderRadius: 12, padding: 12 }} />
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

        {tab === "push" && (
          <div style={{ ...cardStyle, display: "grid", gap: 14 }}>
            <div>
              <h2 style={{ margin: 0, color: "var(--hp-heading)", fontSize: 18 }}>Push-рассылка</h2>
              <div style={{ marginTop: 4, color: "var(--hp-muted)", fontSize: 13 }}>
                Массовая отправка всем активным push-подпискам. Используй осторожно.
              </div>
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
                  const result = await broadcastPush({
                    title: pushTitle.trim(),
                    body: pushBody.trim(),
                    url: pushUrl.trim() || "/events",
                  });
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
              <label style={{ display: "grid", gap: 6, color: "var(--hp-heading)", fontSize: 13, fontWeight: 800 }}>
                Заголовок
                <input
                  value={pushTitle}
                  onChange={(event) => setPushTitle(event.target.value)}
                  maxLength={120}
                  style={{ border: "1px solid var(--hp-border)", background: "var(--hp-input-bg)", color: "var(--hp-text)", borderRadius: 12, padding: 12 }}
                />
              </label>

              <label style={{ display: "grid", gap: 6, color: "var(--hp-heading)", fontSize: 13, fontWeight: 800 }}>
                Текст
                <textarea
                  value={pushBody}
                  onChange={(event) => setPushBody(event.target.value)}
                  rows={4}
                  maxLength={500}
                  style={{ border: "1px solid var(--hp-border)", background: "var(--hp-input-bg)", color: "var(--hp-text)", borderRadius: 12, padding: 12, resize: "vertical" }}
                />
              </label>

              <label style={{ display: "grid", gap: 6, color: "var(--hp-heading)", fontSize: 13, fontWeight: 800 }}>
                Ссылка при клике
                <input
                  value={pushUrl}
                  onChange={(event) => setPushUrl(event.target.value)}
                  placeholder="/events"
                  style={{ border: "1px solid var(--hp-border)", background: "var(--hp-input-bg)", color: "var(--hp-text)", borderRadius: 12, padding: 12 }}
                />
              </label>

              <button
                type="submit"
                disabled={pushSubmitting}
                style={{
                  justifySelf: "start",
                  border: 0,
                  borderRadius: 12,
                  padding: "12px 16px",
                  background: pushSubmitting ? "var(--hp-muted)" : "var(--hp-primary)",
                  color: "white",
                  fontWeight: 900,
                  cursor: pushSubmitting ? "wait" : "pointer",
                }}
              >
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
      <select value={value} onChange={(event) => onChange(event.target.value)} style={{ border: "1px solid var(--hp-border)", background: "var(--hp-input-bg)", color: "var(--hp-text)", borderRadius: 12, padding: 11 }}>
        <option value="">Все</option>
        {Object.entries(options).map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel as string}</option>)}
      </select>
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
