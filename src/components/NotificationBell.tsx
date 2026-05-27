import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "src/api/notifications";
import { NotificationDto } from "src/types/notifications";

interface NotificationBellProps {
  currentUserId?: string | null;
}

export function NotificationBell({ currentUserId }: NotificationBellProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!currentUserId) {
      setItems([]);
      setUnreadCount(0);
      return;
    }

    try {
      const data = await getNotifications(currentUserId, 8);
      setItems(data.items ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      setItems([]);
      setUnreadCount(0);
    }
  }, [currentUserId]);

  useEffect(() => {
    void loadNotifications();
    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 15000);

    const handleFocus = () => {
      void loadNotifications();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadNotifications();
      }
    };

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if ((event.data as { type?: string } | undefined)?.type === "HP_NOTIFICATION_RECEIVED") {
        void loadNotifications();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      navigator.serviceWorker?.removeEventListener("message", handleServiceWorkerMessage);
    };
  }, [loadNotifications]);

  if (!currentUserId) {
    return null;
  }

  const openNotification = async (notification: NotificationDto) => {
    if (!notification.isRead) {
      await markNotificationRead(currentUserId, notification.id).catch(() => undefined);
      setUnreadCount((value) => Math.max(0, value - 1));
      setItems((current) => current.map((item) => item.id === notification.id ? { ...item, isRead: true } : item));
    }

    setIsOpen(false);
    if (notification.url) {
      navigate(notification.url);
    }
  };

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((value) => !value);
          void loadNotifications();
        }}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          border: "1px solid var(--hp-border)",
          background: "var(--hp-surface-soft)",
          color: "var(--hp-heading)",
          cursor: "pointer",
          position: "relative",
          fontSize: "18px",
          fontWeight: 900,
        }}
        aria-label="Уведомления"
        title="Уведомления"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              minWidth: "18px",
              height: "18px",
              padding: "0 4px",
              borderRadius: "999px",
              background: "var(--hp-danger)",
              color: "white",
              fontSize: "10px",
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--hp-surface)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "46px",
            zIndex: 200,
            width: "min(340px, calc(100vw - 32px))",
            maxHeight: "420px",
            overflow: "hidden",
            border: "1px solid var(--hp-border)",
            borderRadius: "14px",
            background: "var(--hp-surface)",
            boxShadow: "var(--hp-shadow-md)",
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderBottom: "1px solid var(--hp-border)" }}>
            <strong style={{ color: "var(--hp-heading)" }}>Уведомления</strong>
            <button
              type="button"
              onClick={() => {
                void markAllNotificationsRead(currentUserId).then(loadNotifications);
              }}
              style={{ border: "none", background: "transparent", color: "var(--hp-primary)", cursor: "pointer", fontSize: "12px", fontWeight: 800 }}
            >
              Прочитать все
            </button>
          </div>
          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {items.length === 0 ? (
              <div style={{ padding: "18px", color: "var(--hp-muted)", textAlign: "center" }}>Пока пусто</div>
            ) : (
              items.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    void openNotification(notification);
                  }}
                  style={{
                    width: "100%",
                    border: "none",
                    borderBottom: "1px solid var(--hp-border)",
                    background: notification.isRead ? "var(--hp-surface)" : "var(--hp-primary-soft)",
                    color: "var(--hp-text)",
                    cursor: "pointer",
                    padding: "12px",
                    textAlign: "left",
                    display: "grid",
                    gap: "4px",
                  }}
                >
                  <span style={{ color: "var(--hp-heading)", fontWeight: 900, fontSize: "13px" }}>{notification.title}</span>
                  <span style={{ color: "var(--hp-muted)", fontSize: "12px", lineHeight: 1.35 }}>{notification.body}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
