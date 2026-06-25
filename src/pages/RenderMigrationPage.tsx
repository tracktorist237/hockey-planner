import { CSSProperties, useState } from "react";
import { hasStoredAuthTokens, requestMigrationTokenAuth } from "src/api/auth";

const targetUrl = (process.env.REACT_APP_MIGRATION_TARGET_URL || "https://hockeyplanner.ru").replace(/\/+$/, "");

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "28px 16px",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "radial-gradient(circle at top left, rgba(25, 118, 210, 0.20), transparent 32%), var(--hp-app-bg)",
  color: "var(--hp-text)",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 520,
  padding: 24,
  borderRadius: 24,
  border: "1px solid var(--hp-border)",
  background: "var(--hp-surface)",
  boxShadow: "var(--hp-shadow-lg)",
  textAlign: "center",
};

const buttonStyle: CSSProperties = {
  width: "100%",
  marginTop: 20,
  padding: "15px 18px",
  border: 0,
  borderRadius: 16,
  background: "linear-gradient(135deg, var(--hp-primary), var(--hp-primary-dark))",
  color: "#fff",
  fontSize: 16,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(25, 118, 210, 0.26)",
};

const secondaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  marginTop: 14,
  color: "var(--hp-primary)",
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
};

async function clearOldRenderClientData(): Promise<void> {
  try {
    localStorage.clear();
  } catch {
    // best effort cleanup
  }

  try {
    sessionStorage.clear();
  } catch {
    // best effort cleanup
  }

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } catch {
    // best effort cleanup
  }

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // best effort cleanup
  }
}

function redirectToLogin(): void {
  window.location.assign(`${targetUrl}/login?from=render-migration`);
}

export function RenderMigrationPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleGoToNewVersion = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setMessage("Проверяем, можно ли перенести вход автоматически...");

    try {
      if (!hasStoredAuthTokens()) {
        await clearOldRenderClientData();
        redirectToLogin();
        return;
      }

      const response = await requestMigrationTokenAuth();
      const migrationTargetUrl = (response.targetUrl || targetUrl).replace(/\/+$/, "");
      await clearOldRenderClientData();
      window.location.assign(`${migrationTargetUrl}/migrate-login?token=${encodeURIComponent(response.migrationToken)}`);
    } catch {
      await clearOldRenderClientData();
      redirectToLogin();
    }
  };

  return (
    <main style={pageStyle}>
      <section style={cardStyle} aria-labelledby="render-migration-title">
        <div
          aria-hidden="true"
          style={{
            width: 64,
            height: 64,
            margin: "0 auto 18px",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--hp-primary-soft)",
            color: "var(--hp-primary)",
            fontSize: 34,
            boxShadow: "var(--hp-shadow-sm)",
          }}
        >
          🏒
        </div>

        <h1 id="render-migration-title" style={{ margin: "0 0 10px", color: "var(--hp-heading)", fontSize: 26, lineHeight: 1.15 }}>
          Hockey Planner переехал на новый адрес
        </h1>

        <p style={{ margin: "0 0 12px", color: "var(--hp-text)", fontSize: 17, lineHeight: 1.45 }}>
          Новая версия доступна на <strong>hockeyplanner.ru</strong>
        </p>

        <p style={{ margin: 0, color: "var(--hp-muted)", fontSize: 14, lineHeight: 1.5 }}>
          Старый адрес больше не используется. Все данные перенесены на новую инфраструктуру.
        </p>

        <button type="button" style={buttonStyle} onClick={handleGoToNewVersion} disabled={loading}>
          {loading ? "Переходим..." : "Перейти в новую версию"}
        </button>

        {message && (
          <div style={{ marginTop: 12, color: "var(--hp-muted)", fontSize: 13, lineHeight: 1.4 }}>
            {message}
          </div>
        )}

        <a style={secondaryLinkStyle} href={targetUrl}>
          Открыть hockeyplanner.ru без переноса входа
        </a>
      </section>
    </main>
  );
}
