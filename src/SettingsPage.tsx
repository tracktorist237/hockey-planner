import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_VERSION } from "./config/version";
import { getVersionInfo } from "src/api/version";
import { BottomNav } from "src/components/BottomNav";
import { MainPageHeader } from "src/components/MainPageHeader";
import { ReportProblemDialog } from "src/components/ReportProblemDialog";
import { AppRole } from "src/constants/roles";
import { useAuth } from "src/hooks/useAuth";
import { ThemePreference, useTheme } from "src/context/ThemeContext";
import { getActiveTeamPwaId, isStandalonePwa } from "src/utils/teamPwa";

interface SettingsPageProps {
  onOpenDebug?: () => void;
}

export function SettingsPage({ onOpenDebug }: SettingsPageProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { theme, appliedTheme, setTheme } = useTheme();
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [updatePromptAction, setUpdatePromptAction] = useState<"update" | "clear" | null>(null);
  const [availableVersion, setAvailableVersion] = useState<string | null>(null);
  const [isUpdatePromptOpen, setIsUpdatePromptOpen] = useState(false);
  const [updatePromptMessage, setUpdatePromptMessage] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const currentUserId = currentUser?.id ?? null;
  const showTeamPwaSettings = isStandalonePwa() && Boolean(getActiveTeamPwaId());

  const compareVersions = (left: string, right: string): number => {
    const leftParts = left.split(".").map((part) => Number.parseInt(part, 10) || 0);
    const rightParts = right.split(".").map((part) => Number.parseInt(part, 10) || 0);
    const maxLength = Math.max(leftParts.length, rightParts.length);

    for (let index = 0; index < maxLength; index += 1) {
      const leftPart = leftParts[index] ?? 0;
      const rightPart = rightParts[index] ?? 0;
      if (leftPart > rightPart) return 1;
      if (leftPart < rightPart) return -1;
    }

    return 0;
  };

  const applyServiceWorkerUpdate = async (): Promise<boolean> => {
    try {
      if (!("serviceWorker" in navigator)) {
        return false;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        return false;
      }

      await registration.update();
      const registrationWithWaitingWorker = await new Promise<ServiceWorkerRegistration | null>((resolve) => {
        if (registration.waiting) {
          resolve(registration);
          return;
        }

        const installingWorker = registration.installing;
        if (!installingWorker) {
          resolve(null);
          return;
        }

        const timeoutId = window.setTimeout(() => resolve(null), 8000);
        installingWorker.addEventListener("statechange", () => {
          if (installingWorker.state === "installed" && registration.waiting) {
            window.clearTimeout(timeoutId);
            resolve(registration);
          }

          if (installingWorker.state === "redundant") {
            window.clearTimeout(timeoutId);
            resolve(null);
          }
        });
      });

      if (!registrationWithWaitingWorker?.waiting) {
        return false;
      }

      const reload = () => window.location.reload();
      navigator.serviceWorker.addEventListener("controllerchange", reload, { once: true });
      registrationWithWaitingWorker.waiting.postMessage({ type: "SKIP_WAITING" });
      window.setTimeout(reload, 4000);
      return true;
    } catch (error) {
      console.error("Ошибка при обновлении service worker:", error);
      return false;
    }
  };

  const handleUpdate = async () => {
    setIsUpdatePromptOpen(true);
    setAvailableVersion(null);
    setUpdatePromptMessage(null);
    setIsUpdating(true);
    setMessage(null);

    try {
      const versionInfo = await getVersionInfo();
      const backendVersion = versionInfo.version?.trim();

      if (!backendVersion) {
        setUpdatePromptMessage("Сервер не вернул номер версии. Можно повторить проверку позже или очистить кэш сейчас.");
        return;
      }

      const comparison = compareVersions(backendVersion, APP_VERSION);

      if (comparison > 0) {
        setAvailableVersion(backendVersion);
        return;
      }

      if (comparison === 0) {
        setUpdatePromptMessage(`У вас установлена последняя версия v${APP_VERSION}.`);
      } else {
        setUpdatePromptMessage(`Локальная версия v${APP_VERSION} новее серверной v${backendVersion}.`);
      }
    } catch (updateError) {
      console.error("Ошибка при проверке версии:", updateError);
      setUpdatePromptMessage("Не удалось проверить обновление. Возможно, сейчас нет соединения с сервером — очистка кэша всё равно доступна.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);

    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }

      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      setAvailableVersion(null);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Ошибка очистки кэша:", error);
      setMessage("❌ Ошибка при очистке кэша");
      setTimeout(() => setMessage(null), 2000);
    } finally {
      setIsClearing(false);
    }
  };

  const handleUpdateFromPrompt = async () => {
    setUpdatePromptAction("update");
    try {
      setIsClearing(true);
      const hasAppliedUpdate = await applyServiceWorkerUpdate();
      if (hasAppliedUpdate) {
        return;
      }

      await handleClearCache();
    } finally {
      setUpdatePromptAction(null);
    }
  };

  const handleClearCacheFromPrompt = async () => {
    setUpdatePromptAction("clear");
    try {
      await handleClearCache();
    } finally {
      setUpdatePromptAction(null);
    }
  };

  const isBusy = isUpdating || isClearing;
  const messageType: "success" | "error" | "info" =
    message?.startsWith("✅") ? "success" : message?.startsWith("❌") ? "error" : "info";
  const themeOptions: Array<{ value: ThemePreference; label: string; description: string }> = [
    { value: "system", label: "Системная", description: "Приложение повторяет тему телефона или браузера" },
    { value: "light", label: "Светлая", description: "Классический светлый интерфейс" },
    { value: "dark", label: "Тёмная", description: "Тёмный ледовый режим для вечера и телефона" },
  ];

  return (
    <div
      style={{
        padding: "0",
        minHeight: "100vh",
        background: "var(--hp-bg-gradient)",
        color: "var(--hp-text)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <MainPageHeader title="Настройки" />

      <div style={{ padding: "16px", paddingBottom: "120px" }}>
        <div
          style={{
            backgroundColor: "var(--hp-surface)",
            borderRadius: "16px",
            padding: "18px",
            marginBottom: "20px",
            boxShadow: "var(--hp-shadow-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", color: "var(--hp-heading)" }}>Тема оформления</h2>
              <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--hp-muted)" }}>
                Сейчас: {appliedTheme === "dark" ? "тёмная" : "светлая"}
              </div>
            </div>
            <span style={{ fontSize: "22px" }}>{appliedTheme === "dark" ? "🌙" : "☀️"}</span>
          </div>

          <div
            role="group"
            aria-label="Тема оформления"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "4px",
              padding: "4px",
              borderRadius: "14px",
              backgroundColor: "var(--hp-surface-soft)",
              border: "1px solid var(--hp-border)",
            }}
          >
            {themeOptions.map((option) => {
              const isSelected = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  title={option.description}
                  style={{
                    border: isSelected ? "1px solid var(--hp-primary)" : "1px solid transparent",
                    borderRadius: "11px",
                    padding: "10px 6px",
                    backgroundColor: isSelected ? "var(--hp-surface)" : "transparent",
                    color: isSelected ? "var(--hp-heading)" : "var(--hp-muted)",
                    boxShadow: isSelected ? "var(--hp-shadow-sm)" : "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: isSelected ? 900 : 700,
                    transition: "all 0.15s ease",
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "var(--hp-surface)",
            borderRadius: "16px",
            padding: "18px",
            marginBottom: "20px",
            boxShadow: "var(--hp-shadow-sm)",
          }}
        >
          <button
            type="button"
            onClick={() => setIsHelpOpen((value) => !value)}
            aria-expanded={isHelpOpen}
            style={{
              width: "100%",
              border: 0,
              padding: 0,
              background: "transparent",
              color: "var(--hp-heading)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              textAlign: "center",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "18px", color: "var(--hp-heading)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>
                ℹ️
              </span>
              Помощь и инструкции
            </h2>
            <span style={{ position: "absolute", right: 0, fontSize: "22px", fontWeight: 900, color: "var(--hp-muted)", transform: isHelpOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}>
              V
            </span>
          </button>
          {isHelpOpen && (
            <div style={{ display: "grid", gap: "8px", marginTop: "14px" }}>
              {[
                ["Все инструкции", "/instructions"],
                ["Как установить приложение", "/instructions/install-pwa"],
                ["Как включить уведомления", "/instructions/notifications"],
                ["Как вступить в команду", "/instructions/join-team"],
              ].map(([label, path]) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => navigate(path, { state: { from: "/settings" } })}
                  style={{
                    width: "100%",
                    border: "1px solid var(--hp-border)",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    backgroundColor: "var(--hp-surface-soft)",
                    color: "var(--hp-heading)",
                    textAlign: "left",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setIsHelpOpen(false);
                  setIsReportOpen(true);
                }}
                style={{
                  width: "100%",
                  border: "1px solid var(--hp-warning-border)",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  backgroundColor: "var(--hp-warning-soft)",
                  color: "var(--hp-warning)",
                  textAlign: "left",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Сообщить о проблеме
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsHelpOpen(false);
                  onOpenDebug?.();
                }}
                style={{
                  width: "100%",
                  border: "1px solid var(--hp-neutral-border)",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  backgroundColor: "var(--hp-neutral-soft)",
                  color: "var(--hp-neutral)",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "grid",
                  gap: "3px",
                }}
              >
                <span style={{ fontWeight: 800 }}>🛠️ Открыть debug-окно</span>
                <span style={{ color: "var(--hp-muted)", fontSize: "12px", fontWeight: 600 }}>Для разработчика</span>
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            backgroundColor: "var(--hp-surface)",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "20px",
            boxShadow: "var(--hp-shadow-sm)",
            textAlign: "center",
          }}
        >
          <div style={{ backgroundColor: "var(--hp-surface-soft)", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "14px", color: "var(--hp-muted)", marginBottom: "8px" }}>Текущая версия</div>
            <div style={{ fontSize: "36px", fontWeight: "700", color: "var(--hp-heading)", marginBottom: "8px" }}>v{APP_VERSION}</div>
            <div
              style={{
                fontSize: "14px",
                color: "var(--hp-warning)",
                backgroundColor: "var(--hp-warning-soft)",
                padding: "6px 16px",
                borderRadius: "20px",
                display: "inline-block",
              }}
            >
              🚧 Ранняя стадия разработки
            </div>
            <div style={{ marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => navigate("/updates")}
                style={{
                  border: "1px solid var(--hp-border)",
                  borderRadius: "999px",
                  padding: "7px 11px",
                  backgroundColor: "var(--hp-surface)",
                  color: "var(--hp-heading)",
                  fontSize: "12px",
                  fontWeight: 900,
                  cursor: "pointer",
                  boxShadow: "var(--hp-shadow-sm)",
                }}
              >
                Release notes
              </button>
            </div>
          </div>

          {message && (
            <div
              style={{
                marginBottom: "14px",
                padding: "12px",
                backgroundColor: messageType === "success" ? "var(--hp-success-soft)" : messageType === "error" ? "var(--hp-danger-soft)" : "var(--hp-primary-soft)",
                color: messageType === "success" ? "var(--hp-success)" : messageType === "error" ? "var(--hp-danger)" : "var(--hp-primary)",
                borderRadius: "8px",
                fontSize: "14px",
                textAlign: "center",
                animation: "fadeIn 0.3s ease",
              }}
            >
              {message}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {currentUser?.appRole === AppRole.SuperAdmin && (
              <button
                onClick={() => navigate("/admin")}
                style={{
                  order: 5,
                  width: "100%",
                  padding: "16px",
                  backgroundColor: "var(--hp-success-soft)",
                  color: "var(--hp-success)",
                  border: "1px solid var(--hp-success-border)",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                }}
              >
                <span>Админ-панель</span>
              </button>
            )}

            <button
              onClick={() => navigate("/settings/notifications")}
              style={{
                order: 3,
                width: "100%",
                padding: "16px",
                backgroundColor: "var(--hp-primary-soft)",
                color: "var(--hp-primary)",
                border: "1px solid var(--hp-primary)",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = "var(--hp-surface-soft)";
                event.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = "var(--hp-primary-soft)";
                event.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span style={{ fontSize: "20px" }}>🔔</span>
              <span>Настройки уведомлений</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/settings/privacy")}
              style={{
                order: 4,
                width: "100%",
                padding: "16px",
                backgroundColor: "var(--hp-surface-soft)",
                color: "var(--hp-heading)",
                border: "1px solid var(--hp-border)",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "20px" }}>🔒</span>
              <span>Настройки приватности</span>
            </button>

            {showTeamPwaSettings && (
              <button
                type="button"
                onClick={() => navigate("/settings/team-apps")}
                style={{
                  order: 6,
                  width: "100%",
                  padding: "16px",
                  backgroundColor: "var(--hp-info-soft)",
                  color: "var(--hp-info)",
                  border: "1px solid var(--hp-info-border)",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                }}
              >
                <span style={{ fontSize: "20px" }}>↗</span>
                <span>Стартовая страница приложения</span>
              </button>
            )}

            <button
              onClick={() => currentUserId && navigate("/profile")}
              disabled={!currentUserId || isBusy}
              style={{
                order: 2,
                width: "100%",
                padding: "16px",
                backgroundColor: !currentUserId ? "var(--hp-neutral-soft)" : "var(--hp-purple-soft)",
                color: !currentUserId ? "var(--hp-muted)" : "var(--hp-purple)",
                border: "1px solid var(--hp-purple-border)",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: !currentUserId ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                opacity: isBusy ? 0.7 : 1,
              }}
              onMouseEnter={(event) => {
                if (currentUserId && !isBusy) {
                  event.currentTarget.style.backgroundColor = "var(--hp-purple-soft)";
                  event.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(event) => {
                if (currentUserId && !isBusy) {
                  event.currentTarget.style.backgroundColor = "var(--hp-purple-soft)";
                  event.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <span style={{ fontSize: "20px" }}>👤</span>
              <span>{currentUserId ? "Профиль пользователя" : "Профиль не выбран"}</span>
            </button>

            <button
              onClick={handleUpdate}
              disabled={isBusy}
              style={{
                order: 1,
                width: "100%",
                padding: "16px",
                backgroundColor: isUpdating ? "var(--hp-muted)" : "var(--hp-primary)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: isUpdating ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                opacity: isBusy ? 0.7 : 1,
              }}
              onMouseEnter={(event) => {
                if (!isBusy) {
                  event.currentTarget.style.backgroundColor = "var(--hp-primary-hover)";
                  event.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(event) => {
                if (!isBusy) {
                  event.currentTarget.style.backgroundColor = "var(--hp-primary)";
                  event.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <span style={{ fontSize: "20px" }}>{isUpdating ? "⏳" : "🔄"}</span>
              <span>{isUpdating ? "Проверка обновления..." : "Проверить обновления"}</span>
            </button>

          </div>

        </div>

        <div
          style={{
            backgroundColor: "var(--hp-surface)",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "var(--hp-shadow-sm)",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600", color: "var(--hp-heading)" }}>Правовые документы</h3>

          <div style={{ display: "grid", gap: "10px" }}>
            {[
              ["О сервисе", "/about"],
              ["Оплата", "/payment"],
              ["Условия оказания услуг", "/service-terms"],
              ["Возврат денежных средств", "/refund"],
              ["Контакты", "/contacts"],
              ["Пользовательское соглашение", "/terms"],
              ["Политика конфиденциальности", "/privacy"],
              ["Реквизиты", "/seller-details"],
            ].map(([label, path]) => (
              <button
                key={path}
                type="button"
                onClick={() => navigate(path)}
                style={{
                  width: "100%",
                  border: "1px solid var(--hp-border)",
                  borderRadius: "12px",
                  padding: "13px 14px",
                  backgroundColor: "var(--hp-surface-soft)",
                  color: "var(--hp-heading)",
                  textAlign: "left",
                  fontSize: "15px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
            <div style={{ fontSize: "13px", color: "var(--hp-muted)", lineHeight: 1.5 }}>
              По вопросам данных и работы сервиса: support@hockeyplanner.ru
            </div>
          </div>
        </div>
      </div>
      <BottomNav activeTab="settings" />
      <ReportProblemDialog isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />

      {isUpdatePromptOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Обновление приложения"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 550,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "18px",
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "460px",
              padding: "18px",
              border: "1px solid var(--hp-primary)",
              borderRadius: "18px",
              backgroundColor: "var(--hp-surface)",
              color: "var(--hp-text)",
              boxShadow: "var(--hp-shadow-md)",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ fontSize: "15px", lineHeight: 1.5, fontWeight: 700 }}>
                {isUpdating
                  ? "⏳ Проверяем наличие обновлений..."
                  : availableVersion
                    ? `🆕 Доступна версия v${availableVersion}. Обновите приложение и перезапустите его.`
                    : updatePromptMessage ?? "Можно обновить приложение или очистить его кэш."}
              </div>
              <button
                type="button"
                aria-label="Закрыть сообщение об обновлении"
                onClick={() => setIsUpdatePromptOpen(false)}
                disabled={isClearing}
                style={{ border: 0, padding: "0 2px", background: "transparent", color: "var(--hp-muted)", fontSize: "24px", lineHeight: 1, cursor: "pointer" }}
              >
                ×
              </button>
            </div>
            <button
              type="button"
              onClick={() => void handleUpdateFromPrompt()}
              disabled={isClearing}
              style={{
                width: "100%",
                marginTop: "16px",
                padding: "12px",
                border: 0,
                borderRadius: "12px",
                backgroundColor: "var(--hp-primary)",
                color: "white",
                fontSize: "15px",
                fontWeight: 800,
                cursor: isClearing ? "wait" : "pointer",
                opacity: isClearing ? 0.72 : 1,
              }}
            >
              {isClearing && updatePromptAction === "update" ? "Обновляем..." : "Обновить"}
            </button>
            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--hp-border)" }}>
              <button
                type="button"
                onClick={() => void handleClearCacheFromPrompt()}
                disabled={isClearing}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid var(--hp-border)",
                  borderRadius: "12px",
                  backgroundColor: "var(--hp-surface-soft)",
                  color: "var(--hp-heading)",
                  fontSize: "14px",
                  fontWeight: 750,
                  cursor: isClearing ? "wait" : "pointer",
                  opacity: isClearing ? 0.72 : 1,
                }}
              >
                {isClearing && updatePromptAction === "clear" ? "Очищаем кэш..." : "Очистить кэш"}
              </button>
              <div style={{ marginTop: "6px", color: "var(--hp-muted)", fontSize: "11px", lineHeight: 1.4, textAlign: "center" }}>
                Удалит сохранённые файлы приложения и загрузит их заново. Используйте, если обычное обновление не помогло.
              </div>
            </div>
            {isUpdating && (
              <div style={{ marginTop: "7px", color: "var(--hp-muted)", fontSize: "11px", lineHeight: 1.4 }}>
                Если сервер недоступен, ждать ответа необязательно — очистить кэш можно кнопкой ниже.
              </div>
            )}
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @media (min-width: 768px) {
            div[style*="minHeight: 100vh"] {
              max-width: 600px;
              margin: 0 auto;
              border-left: 1px solid var(--hp-border);
              border-right: 1px solid var(--hp-border);
            }
          }
        `}
      </style>
    </div>
  );
}
