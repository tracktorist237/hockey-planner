import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CurrentPlayerHeader } from "./CurrentPlayerHeader";
import { APP_VERSION } from "./config/version";
import { getVersionInfo } from "src/api/version";
import { getPushPublicKey, subscribePush } from "src/api/push";
import { BottomNav } from "src/components/BottomNav";
import { useAuth } from "src/hooks/useAuth";
import { ThemePreference, useTheme } from "src/context/ThemeContext";

interface SettingsPageProps {
  onOpenDebug?: () => void;
}

const base64UrlToUint8Array = (value: string): Uint8Array => {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);

  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }

  return output;
};

export function SettingsPage({ onOpenDebug }: SettingsPageProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { theme, appliedTheme, setTheme } = useTheme();
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isPushSubscribing, setIsPushSubscribing] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported",
  );

  const currentUserId = currentUser?.id ?? null;

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

      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });

        await new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            () => {
              resolve();
            },
            { once: true },
          );
        });

        window.location.reload();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Ошибка при обновлении:", error);
      return false;
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    setMessage(null);

    try {
      const versionInfo = await getVersionInfo();
      const backendVersion = versionInfo.version?.trim();

      if (!backendVersion) {
        setMessage("❌ Сервер не вернул версию");
        return;
      }

      const comparison = compareVersions(backendVersion, APP_VERSION);

      if (comparison > 0) {
        const hasUpdate = await applyServiceWorkerUpdate();
        if (!hasUpdate) {
          setMessage(`🆕 Доступна версия v${backendVersion}. Очистите кэш и перезагрузите приложение.`);
        }
        return;
      }

      if (comparison === 0) {
        setMessage(`✅ У вас последняя версия v${APP_VERSION}`);
      } else {
        setMessage(`ℹ️ Локальная версия v${APP_VERSION} новее серверной v${backendVersion}`);
      }
    } catch (updateError) {
      console.error("Ошибка при проверке версии:", updateError);
      setMessage("❌ Не удалось проверить обновление");
    } finally {
      setIsUpdating(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm("Вы уверены? Это очистит кэш и перезагрузит приложение.")) {
      return;
    }

    setIsClearing(true);

    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));

        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
        }

        setMessage("✅ Кэш очищен. Перезагрузка...");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error("Ошибка очистки кэша:", error);
      setMessage("❌ Ошибка при очистке кэша");
      setTimeout(() => setMessage(null), 2000);
    } finally {
      setIsClearing(false);
    }
  };

  const handleEnableBirthdayNotifications = async () => {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      setMessage("❌ Браузер не поддерживает push-уведомления");
      return;
    }

    if (!("serviceWorker" in navigator)) {
      setMessage("❌ Service Worker не поддерживается");
      return;
    }

    setIsPushSubscribing(true);

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === "granted") {
        const vapidPublicKey = await getPushPublicKey();

        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          registration = await navigator.serviceWorker.register(`${process.env.PUBLIC_URL}/service-worker.js`);
        }

        const existingSubscription = await registration.pushManager.getSubscription();
        const subscription =
          existingSubscription ||
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: base64UrlToUint8Array(vapidPublicKey),
          }));

        const subscriptionJson = subscription.toJSON();
        const p256dh = subscriptionJson.keys?.p256dh;
        const auth = subscriptionJson.keys?.auth;

        if (!p256dh || !auth) {
          throw new Error("Push subscription keys are missing.");
        }

        await subscribePush({
          endpoint: subscription.endpoint,
          keys: { p256dh, auth },
          userId: currentUserId,
          userAgent: navigator.userAgent,
        });

        setMessage("✅ Push-уведомления о днях рождения включены");
      } else if (permission === "denied") {
        setMessage("❌ Уведомления заблокированы в браузере");
      } else {
        setMessage("ℹ️ Разрешение на уведомления не выдано");
      }
    } catch (error) {
      console.error("Ошибка запроса разрешения уведомлений:", error);
      setMessage("❌ Не удалось включить push-уведомления");
    } finally {
      setIsPushSubscribing(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const isBusy = isUpdating || isClearing || isPushSubscribing;
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
      <div
        style={{
          backgroundColor: "var(--hp-surface)",
          padding: "16px",
          borderBottom: "1px solid var(--hp-border)",
          boxShadow: "var(--hp-shadow-sm)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
          <button
            onClick={() => navigate("/events")}
            style={{
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--hp-border)",
              background: "var(--hp-surface)",
              color: "var(--hp-text)",
              fontSize: "20px",
              cursor: "pointer",
              borderRadius: "10px",
              marginRight: "12px",
              flexShrink: 0,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = "var(--hp-surface-hover)";
              event.currentTarget.style.borderColor = "var(--hp-primary)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = "var(--hp-surface)";
              event.currentTarget.style.borderColor = "var(--hp-border)";
            }}
            aria-label="Назад к событиям"
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <CurrentPlayerHeader />
          </div>
        </div>
      </div>

      <div style={{ padding: "16px", paddingBottom: "120px" }}>
        <div
          style={{
            backgroundColor: "var(--hp-surface)",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "var(--hp-shadow-sm)",
          }}
        >
          <h1 style={{ margin: "0 0 8px 0", fontSize: "22px", fontWeight: "700", color: "var(--hp-heading)" }}>
            Настройки приложения
          </h1>
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
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button
              onClick={handleEnableBirthdayNotifications}
              disabled={isBusy}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: notificationPermission === "granted" ? "var(--hp-success-soft)" : "var(--hp-warning-soft)",
                color: notificationPermission === "granted" ? "var(--hp-success)" : "var(--hp-warning)",
                border: `1px solid ${notificationPermission === "granted" ? "var(--hp-success-border)" : "var(--hp-warning-border)"}`,
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: isPushSubscribing ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                opacity: isBusy ? 0.7 : 1,
              }}
              onMouseEnter={(event) => {
                if (!isBusy) {
                  event.currentTarget.style.backgroundColor = "var(--hp-warning-soft)";
                  event.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(event) => {
                if (!isBusy) {
                  event.currentTarget.style.backgroundColor =
                    notificationPermission === "granted" ? "var(--hp-success-soft)" : "var(--hp-warning-soft)";
                  event.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <span style={{ fontSize: "20px" }}>🔔</span>
              <span>
                {isPushSubscribing
                  ? "Подписка на push-уведомления..."
                  : notificationPermission === "granted"
                    ? "Уведомления о днях рождения включены"
                    : "Включить уведомления о днях рождения"}
              </span>
            </button>

            <button
              onClick={() => currentUserId && navigate("/profile")}
              disabled={!currentUserId || isBusy}
              style={{
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

            <button
              onClick={handleClearCache}
              disabled={isBusy}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: isClearing ? "var(--hp-neutral)" : "var(--hp-danger-soft)",
                color: isClearing ? "white" : "var(--hp-danger)",
                border: "1px solid var(--hp-danger-border)",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: isClearing ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                opacity: isBusy ? 0.7 : 1,
              }}
              onMouseEnter={(event) => {
                if (!isBusy) {
                  event.currentTarget.style.backgroundColor = "var(--hp-danger-border)";
                  event.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(event) => {
                if (!isBusy) {
                  event.currentTarget.style.backgroundColor = "var(--hp-danger-soft)";
                  event.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <span style={{ fontSize: "20px" }}>{isClearing ? "⏳" : "🧹"}</span>
              <span>{isClearing ? "Очистка кэша..." : "Очистить кэш"}</span>
            </button>

            <button
              onClick={onOpenDebug}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: "var(--hp-neutral-soft)",
                color: "var(--hp-neutral)",
                border: "1px solid var(--hp-neutral-border)",
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
                event.currentTarget.style.backgroundColor = "var(--hp-neutral-border)";
                event.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = "var(--hp-neutral-soft)";
                event.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span style={{ fontSize: "20px" }}>🛠️</span>
              <span>Открыть debug-окно</span>
            </button>
          </div>

          {message && (
            <div
              style={{
                marginTop: "20px",
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
        </div>

        <div
          style={{
            backgroundColor: "var(--hp-surface)",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "var(--hp-shadow-sm)",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600", color: "var(--hp-heading)" }}>ℹ️ Информация</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                padding: "12px",
                backgroundColor: "var(--hp-surface-soft)",
                borderRadius: "8px",
                fontSize: "14px",
                color: "var(--hp-muted)",
                lineHeight: "1.5",
              }}
            >
              <strong>Что такое очистка кэша?</strong>
              <br />• удаляет сохраненные файлы приложения
              <br />• удаляет service worker
              <br />• перезагружает приложение
              <br />• ваши данные (игроки, мероприятия) не удаляются
            </div>

            <div style={{ padding: "12px", backgroundColor: "var(--hp-primary-soft)", borderRadius: "8px", fontSize: "14px", color: "var(--hp-primary)" }}>
              <strong>💡 Совет:</strong> используйте «Проверить обновления», если интерфейс не соответствует последней версии.
            </div>
          </div>
        </div>
      </div>
      <BottomNav activeTab="settings" />

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
