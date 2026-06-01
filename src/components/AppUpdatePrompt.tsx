import { useEffect, useRef, useState } from "react";

const UPDATE_EVENT_NAME = "hp-service-worker-update";

export function notifyServiceWorkerUpdate(registration: ServiceWorkerRegistration) {
  window.dispatchEvent(new CustomEvent<ServiceWorkerRegistration>(UPDATE_EVENT_NAME, { detail: registration }));
}

export function AppUpdatePrompt() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [hasActivatedUpdate, setHasActivatedUpdate] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const isReloadingRef = useRef(false);

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const updateEvent = event as CustomEvent<ServiceWorkerRegistration>;
      if (updateEvent.detail.waiting) {
        setRegistration(updateEvent.detail);
      }
    };

    window.addEventListener(UPDATE_EVENT_NAME, handleUpdate);

    if ("serviceWorker" in navigator) {
      const hadController = Boolean(navigator.serviceWorker.controller);
      const handleControllerChange = () => {
        if (hadController && !isReloadingRef.current) {
          setHasActivatedUpdate(true);
        }
      };

      navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

      void navigator.serviceWorker.getRegistration().then((currentRegistration) => {
        if (currentRegistration?.waiting) {
          setRegistration(currentRegistration);
        }
      });

      return () => {
        window.removeEventListener(UPDATE_EVENT_NAME, handleUpdate);
        navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      };
    }

    return () => {
      window.removeEventListener(UPDATE_EVENT_NAME, handleUpdate);
    };
  }, []);

  if (!registration && !hasActivatedUpdate) {
    return null;
  }

  const applyUpdate = async () => {
    if (!registration?.waiting) {
      window.location.reload();
      return;
    }

    setIsApplying(true);

    const reload = () => {
      if (isReloadingRef.current) {
        return;
      }

      isReloadingRef.current = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", reload, { once: true });
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
    window.setTimeout(reload, 4000);
  };

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        left: "12px",
        right: "12px",
        bottom: "82px",
        zIndex: 520,
        maxWidth: "560px",
        margin: "0 auto",
        border: "1px solid var(--hp-primary)",
        borderRadius: "18px",
        background: "var(--hp-surface)",
        color: "var(--hp-text)",
        boxShadow: "var(--hp-shadow-md)",
        padding: "14px",
      }}
    >
      <div style={{ display: "grid", gap: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
          <div>
            <div style={{ color: "var(--hp-text-strong)", fontSize: "16px", fontWeight: 900, marginBottom: "4px" }}>
              Доступно обновление
            </div>
            <div style={{ color: "var(--hp-muted)", fontSize: "14px", lineHeight: 1.35 }}>
              Обновите приложение, чтобы получить последнюю версию Hockey Planner.
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setRegistration(null);
              setHasActivatedUpdate(false);
            }}
            aria-label="Скрыть обновление"
            style={{
              border: 0,
              background: "transparent",
              color: "var(--hp-muted)",
              cursor: "pointer",
              fontSize: "24px",
              lineHeight: 1,
              padding: "0 2px",
            }}
          >
            ×
          </button>
        </div>

        <button
          type="button"
          onClick={() => void applyUpdate()}
          disabled={isApplying}
          style={{
            width: "100%",
            border: 0,
            borderRadius: "12px",
            padding: "12px 10px",
            background: "var(--hp-primary)",
            color: "white",
            fontWeight: 900,
            cursor: isApplying ? "wait" : "pointer",
            opacity: isApplying ? 0.75 : 1,
          }}
        >
          {isApplying ? "Обновляем..." : "Обновить сейчас"}
        </button>
      </div>
    </div>
  );
}
