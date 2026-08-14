import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotificationPreferences, sendTestNotification, updateNotificationPreferences } from "src/api/notifications";
import { getPushPublicKey, subscribePush, unsubscribePush } from "src/api/push";
import { InternalPageHeader } from "src/components/InternalPageHeader";
import { useAuth } from "src/hooks/useAuth";
import { NotificationPreferencesDto } from "src/types/notifications";

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

type PreferenceKey = keyof NotificationPreferencesDto;

interface PreferenceOption {
  key: PreferenceKey;
  title: string;
  description: string;
}

const preferenceOptions: PreferenceOption[] = [
  {
    key: "attendanceRequiredEnabled",
    title: "Нужно отметиться",
    description: "Матч или тренировка опубликованы, пора дать ответ по явке.",
  },
  {
    key: "rosterReadyEnabled",
    title: "Состав готов",
    description: "Уведомление, когда тренер подготовил звенья.",
  },
  {
    key: "teamNewsEnabled",
    title: "Новости команды",
    description: "Только новости, для которых автор включил уведомление.",
  },
  {
    key: "goaliesEnabled",
    title: "Вратарские уведомления",
    description: "Заявки, ответы и изменения по вратарям.",
  },
  {
    key: "birthdaysEnabled",
    title: "Дни рождения",
    description: "Напоминания о днях рождения игроков.",
  },
  {
    key: "appUpdatesEnabled",
    title: "Обновления приложения",
    description: "Важные изменения и новые версии Hockey Planner.",
  },
];

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ title, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: "100%",
        border: "1px solid var(--hp-border)",
        borderRadius: "14px",
        padding: "14px",
        background: "var(--hp-surface-soft)",
        color: "var(--hp-text)",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "12px",
        alignItems: "center",
        textAlign: "left",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.65 : 1,
      }}
    >
      <span style={{ display: "grid", gap: "4px" }}>
        <span style={{ color: "var(--hp-heading)", fontSize: "15px", fontWeight: 900 }}>{title}</span>
        <span style={{ color: "var(--hp-muted)", fontSize: "13px", lineHeight: 1.35 }}>{description}</span>
      </span>
      <span
        aria-hidden="true"
        style={{
          width: "48px",
          height: "28px",
          borderRadius: "999px",
          padding: "2px",
          border: checked ? "1px solid var(--hp-primary)" : "1px solid var(--hp-border)",
          background: checked ? "var(--hp-primary)" : "var(--hp-surface)",
          boxSizing: "border-box",
          transition: "all 0.18s ease",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            display: "block",
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: checked ? "white" : "var(--hp-muted)",
            transform: checked ? "translateX(20px)" : "translateX(0)",
            transition: "all 0.18s ease",
            boxShadow: "var(--hp-shadow-sm)",
          }}
        />
      </span>
    </button>
  );
}

export function NotificationSettingsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id ?? null;
  const [preferences, setPreferences] = useState<NotificationPreferencesDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPushSubscribing, setIsPushSubscribing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported",
  );

  useEffect(() => {
    if (!currentUserId) {
      setPreferences(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    void getNotificationPreferences()
      .then((nextPreferences) => {
        if (active) setPreferences(nextPreferences);
      })
      .catch(() => {
        if (active) {
          setMessage("Не удалось загрузить настройки уведомлений");
          setPreferences(null);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentUserId]);

  const messageType = useMemo<"success" | "error" | "info">(() => {
    if (message?.startsWith("Готово")) return "success";
    if (message?.startsWith("Не удалось") || message?.startsWith("Уведомления заблокированы")) return "error";
    return "info";
  }, [message]);

  const savePreference = async (key: PreferenceKey, value: boolean) => {
    if (!currentUserId || !preferences) return;

    const previous = preferences;
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    setIsSaving(true);
    setMessage(null);

    try {
      setPreferences(await updateNotificationPreferences(next));
    } catch {
      setPreferences(previous);
      setMessage("Не удалось сохранить настройки уведомлений");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnablePushNotifications = async () => {
    if (!currentUserId) {
      setMessage("Не удалось включить push: пользователь не выбран");
      return;
    }

    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      setMessage("Не удалось включить push: браузер не поддерживает уведомления");
      return;
    }

    if (!("serviceWorker" in navigator)) {
      setMessage("Не удалось включить push: Service Worker не поддерживается");
      return;
    }

    setIsPushSubscribing(true);
    setMessage(null);

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission !== "granted") {
        setMessage(permission === "denied" ? "Уведомления заблокированы в браузере" : "Разрешение на уведомления не выдано");
        return;
      }

      const vapidPublicKey = await getPushPublicKey();
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register(`${process.env.PUBLIC_URL}/service-worker.js`);
      }

      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        const existingJson = existingSubscription.toJSON();
        const existingP256dh = existingJson.keys?.p256dh;
        const existingAuth = existingJson.keys?.auth;

        if (!existingP256dh || !existingAuth) {
          throw new Error("Existing push subscription keys are missing.");
        }

        await subscribePush({
          endpoint: existingSubscription.endpoint,
          keys: { p256dh: existingP256dh, auth: existingAuth },
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          deviceName: navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop",
        });
        await unsubscribePush(existingSubscription.endpoint);
        await existingSubscription.unsubscribe();
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(vapidPublicKey),
      });

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
        platform: navigator.platform,
        deviceName: navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop",
      });

      setMessage("Готово: push-уведомления включены");
    } catch (error) {
      console.error("Ошибка запроса разрешения уведомлений:", error);
      setMessage("Не удалось включить push-уведомления");
    } finally {
      setIsPushSubscribing(false);
    }
  };

  const handleSendTest = async () => {
    if (!currentUserId) return;

    setMessage(null);
    try {
      await sendTestNotification();
      setMessage("Готово: тестовое уведомление отправлено");
    } catch {
      setMessage("Не удалось отправить тестовое уведомление");
    }
  };

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
      <InternalPageHeader title="Уведомления" onBack={() => navigate("/settings")} />

      <div style={{ padding: "16px", paddingBottom: "32px", display: "grid", gap: "16px" }}>
        <div
          style={{
            backgroundColor: "var(--hp-surface)",
            borderRadius: "16px",
            padding: "18px",
            boxShadow: "var(--hp-shadow-sm)",
          }}
        >
          <h2 style={{ margin: "0 0 6px", fontSize: "18px", color: "var(--hp-heading)" }}>Push</h2>
          <div style={{ marginBottom: "14px", color: "var(--hp-muted)", fontSize: "14px", lineHeight: 1.45 }}>
            Push отвечает только за доставку на устройство. Сами уведомления остаются в приложении.
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            <button
              type="button"
              onClick={handleEnablePushNotifications}
              disabled={!currentUserId || isPushSubscribing}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "12px",
                border: `1px solid ${notificationPermission === "granted" ? "var(--hp-success-border)" : "var(--hp-warning-border)"}`,
                background: notificationPermission === "granted" ? "var(--hp-success-soft)" : "var(--hp-warning-soft)",
                color: notificationPermission === "granted" ? "var(--hp-success)" : "var(--hp-warning)",
                fontWeight: 900,
                cursor: !currentUserId ? "not-allowed" : isPushSubscribing ? "wait" : "pointer",
                opacity: !currentUserId || isPushSubscribing ? 0.7 : 1,
              }}
            >
              {isPushSubscribing
                ? "Подключаем push..."
                : notificationPermission === "granted"
                  ? "Push-уведомления включены"
                  : "Включить push-уведомления"}
            </button>

            <button
              type="button"
              onClick={handleSendTest}
              disabled={!currentUserId || isPushSubscribing}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid var(--hp-border)",
                background: "var(--hp-surface-soft)",
                color: "var(--hp-heading)",
                fontWeight: 900,
                cursor: currentUserId && !isPushSubscribing ? "pointer" : "not-allowed",
                opacity: currentUserId && !isPushSubscribing ? 1 : 0.7,
              }}
            >
              Отправить тестовое уведомление
            </button>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "var(--hp-surface)",
            borderRadius: "16px",
            padding: "18px",
            boxShadow: "var(--hp-shadow-sm)",
          }}
        >
          <h2 style={{ margin: "0 0 6px", fontSize: "18px", color: "var(--hp-heading)" }}>Категории</h2>
          <div style={{ marginBottom: "14px", color: "var(--hp-muted)", fontSize: "14px", lineHeight: 1.45 }}>
            Выключенная категория останется в приложении, но push по ней отправляться не будет.
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {isLoading ? (
              <div style={{ padding: "18px", color: "var(--hp-muted)", textAlign: "center" }}>Загрузка настроек...</div>
            ) : (
              preferenceOptions.map((option) => (
                <ToggleRow
                  key={option.key}
                  title={option.title}
                  description={option.description}
                  checked={Boolean(preferences?.[option.key])}
                  disabled={!preferences || isSaving}
                  onChange={(checked) => {
                    void savePreference(option.key, checked);
                  }}
                />
              ))
            )}
          </div>
        </div>

        {message && (
          <div
            style={{
              padding: "12px",
              borderRadius: "12px",
              background:
                messageType === "success" ? "var(--hp-success-soft)" : messageType === "error" ? "var(--hp-danger-soft)" : "var(--hp-primary-soft)",
              color: messageType === "success" ? "var(--hp-success)" : messageType === "error" ? "var(--hp-danger)" : "var(--hp-primary)",
              border: `1px solid ${
                messageType === "success" ? "var(--hp-success-border)" : messageType === "error" ? "var(--hp-danger-border)" : "var(--hp-primary)"
              }`,
              fontSize: "14px",
              fontWeight: 800,
            }}
          >
            {message}
          </div>
        )}
      </div>

      <style>
        {`
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
