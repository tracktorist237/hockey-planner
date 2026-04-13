import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CurrentPlayerHeader } from "./CurrentPlayerHeader";
import { APP_VERSION } from "./config/version";
import { getVersionInfo } from "src/api/version";
import { getPushPublicKey, subscribePush } from "src/api/push";

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isPushSubscribing, setIsPushSubscribing] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported",
  );

  const currentUserId = (() => {
    try {
      const raw = localStorage.getItem("currentUser");
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as { id?: string | null };
      return parsed?.id ?? null;
    } catch {
      return null;
    }
  })();

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

  return (
    <div
      style={{
        padding: "0",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "16px",
          borderBottom: "1px solid #e0e0e0",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
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
              border: "1px solid #e0e0e0",
              background: "white",
              fontSize: "20px",
              cursor: "pointer",
              borderRadius: "10px",
              marginRight: "12px",
              flexShrink: 0,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = "#f5f5f5";
              event.currentTarget.style.borderColor = "#1976d2";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = "white";
              event.currentTarget.style.borderColor = "#e0e0e0";
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

      <div style={{ padding: "16px" }}>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h1 style={{ margin: "0 0 8px 0", fontSize: "22px", fontWeight: "700", color: "#1a237e" }}>
            Настройки приложения
          </h1>
        </div>

        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <div style={{ backgroundColor: "#f8f9fa", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Текущая версия</div>
            <div style={{ fontSize: "36px", fontWeight: "700", color: "#1a237e", marginBottom: "8px" }}>v{APP_VERSION}</div>
            <div
              style={{
                fontSize: "14px",
                color: "#f57c00",
                backgroundColor: "#fff3e0",
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
              disabled={isBusy || notificationPermission === "granted"}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: notificationPermission === "granted" ? "#e8f5e9" : "#fff8e1",
                color: notificationPermission === "granted" ? "#2e7d32" : "#ef6c00",
                border: "1px solid #ffe0b2",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: notificationPermission === "granted" || isPushSubscribing ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                opacity: isBusy ? 0.7 : 1,
              }}
              onMouseEnter={(event) => {
                if (notificationPermission !== "granted" && !isBusy) {
                  event.currentTarget.style.backgroundColor = "#ffecb3";
                  event.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(event) => {
                if (notificationPermission !== "granted" && !isBusy) {
                  event.currentTarget.style.backgroundColor = "#fff8e1";
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
              onClick={() => currentUserId && navigate(`/users/${currentUserId}/edit`)}
              disabled={!currentUserId || isBusy}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: !currentUserId ? "#eceff1" : "#ede7f6",
                color: !currentUserId ? "#90a4ae" : "#5e35b1",
                border: "1px solid #d1c4e9",
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
                  event.currentTarget.style.backgroundColor = "#e1bee7";
                  event.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(event) => {
                if (currentUserId && !isBusy) {
                  event.currentTarget.style.backgroundColor = "#ede7f6";
                  event.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <span style={{ fontSize: "20px" }}>👤</span>
              <span>{currentUserId ? "Редактировать профиль" : "Профиль не выбран"}</span>
            </button>

            <button
              onClick={handleUpdate}
              disabled={isBusy}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: isUpdating ? "#78909c" : "#1976d2",
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
                  event.currentTarget.style.backgroundColor = "#1565c0";
                  event.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(event) => {
                if (!isBusy) {
                  event.currentTarget.style.backgroundColor = "#1976d2";
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
                backgroundColor: isClearing ? "#78909c" : "#ffebee",
                color: isClearing ? "white" : "#d32f2f",
                border: "1px solid #ffcdd2",
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
                  event.currentTarget.style.backgroundColor = "#ffcdd2";
                  event.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(event) => {
                if (!isBusy) {
                  event.currentTarget.style.backgroundColor = "#ffebee";
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
                backgroundColor: "#6e6c6c",
                color: "white",
                border: "1px solid #424242",
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
                event.currentTarget.style.backgroundColor = "#000";
                event.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = "#212121";
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
                backgroundColor: messageType === "success" ? "#e8f5e9" : messageType === "error" ? "#ffebee" : "#e3f2fd",
                color: messageType === "success" ? "#2e7d32" : messageType === "error" ? "#c62828" : "#1976d2",
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
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600", color: "#1a237e" }}>ℹ️ Информация</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                padding: "12px",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#666",
                lineHeight: "1.5",
              }}
            >
              <strong>Что такое очистка кэша?</strong>
              <br />• удаляет сохраненные файлы приложения
              <br />• удаляет service worker
              <br />• перезагружает приложение
              <br />• ваши данные (игроки, мероприятия) не удаляются
            </div>

            <div style={{ padding: "12px", backgroundColor: "#e3f2fd", borderRadius: "8px", fontSize: "14px", color: "#1976d2" }}>
              <strong>💡 Совет:</strong> используйте «Проверить обновления», если интерфейс не соответствует последней версии.
            </div>
          </div>
        </div>
      </div>

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
              border-left: 1px solid #e0e0e0;
              border-right: 1px solid #e0e0e0;
            }
          }
        `}
      </style>
    </div>
  );
}
