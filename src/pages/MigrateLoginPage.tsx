import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthTokens, migrateLoginAuth } from "src/api/auth";
import { LoadingIndicator } from "src/components/LoadingIndicator";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "28px 16px",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--hp-app-bg)",
  color: "var(--hp-text)",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 480,
  padding: 22,
  borderRadius: 22,
  border: "1px solid var(--hp-border)",
  background: "var(--hp-surface)",
  boxShadow: "var(--hp-shadow-md)",
  textAlign: "center",
};

const buttonStyle: CSSProperties = {
  width: "100%",
  marginTop: 18,
  padding: "13px 16px",
  border: 0,
  borderRadius: 14,
  background: "var(--hp-primary)",
  color: "#fff",
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
};

export function MigrateLoginPage() {
  const navigate = useNavigate();
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token")?.trim() ?? "", []);
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    let cancelled = false;

    const run = async () => {
      if (!token) {
        clearAuthTokens();
        setStatus("error");
        return;
      }

      try {
        await migrateLoginAuth(token);
        if (cancelled) {
          return;
        }

        window.history.replaceState(window.history.state, "", "/migrate-login");
        navigate("/teams", { replace: true });
      } catch {
        if (cancelled) {
          return;
        }

        clearAuthTokens();
        window.history.replaceState(window.history.state, "", "/migrate-login");
        setStatus("error");
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [navigate, token]);

  if (status === "loading") {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <LoadingIndicator text="Переносим вход..." block />
          <p style={{ margin: "12px 0 0", color: "var(--hp-muted)", fontSize: 14 }}>
            Это займёт пару секунд.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <h1 style={{ margin: "0 0 10px", color: "var(--hp-heading)", fontSize: 22 }}>
          Не удалось перенести вход автоматически
        </h1>
        <p style={{ margin: 0, color: "var(--hp-muted)", fontSize: 15, lineHeight: 1.45 }}>
          Войдите заново — данные уже находятся на новом адресе.
        </p>
        <button type="button" style={buttonStyle} onClick={() => navigate("/login", { replace: true })}>
          Войти
        </button>
      </section>
    </main>
  );
}
