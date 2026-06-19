import { useState } from "react";
import { useLocation } from "react-router-dom";
import { usePwaInstallPrompt } from "src/hooks/usePwaInstallPrompt";

interface PwaInstallPromptProps {
  isAuthenticated: boolean;
}

export function PwaInstallPrompt({ isAuthenticated }: PwaInstallPromptProps) {
  const location = useLocation();
  const { canInstall, install, dismiss } = usePwaInstallPrompt(isAuthenticated);
  const [isInstalling, setIsInstalling] = useState(false);

  const isTeamDetailsPage = /^\/teams\/[^/]+\/?$/.test(location.pathname);

  if (!canInstall || isTeamDetailsPage) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        left: "12px",
        right: "12px",
        bottom: "82px",
        zIndex: 500,
        maxWidth: "560px",
        margin: "0 auto",
        border: "1px solid var(--hp-border)",
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
              Установить Hockey Planner
            </div>
            <div style={{ color: "var(--hp-muted)", fontSize: "14px", lineHeight: 1.35 }}>
              Быстрый запуск с экрана телефона и удобная работа как в приложении.
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Скрыть предложение установки"
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <button
            type="button"
            onClick={dismiss}
            style={{
              border: "1px solid var(--hp-border)",
              borderRadius: "12px",
              padding: "11px 10px",
              background: "var(--hp-surface-soft)",
              color: "var(--hp-text)",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Позже
          </button>
          <button
            type="button"
            onClick={() => void handleInstall()}
            disabled={isInstalling}
            style={{
              border: 0,
              borderRadius: "12px",
              padding: "11px 10px",
              background: "var(--hp-primary)",
              color: "white",
              fontWeight: 900,
              cursor: isInstalling ? "wait" : "pointer",
              opacity: isInstalling ? 0.75 : 1,
            }}
          >
            {isInstalling ? "Открываем..." : "Установить"}
          </button>
        </div>
      </div>
    </div>
  );
}
