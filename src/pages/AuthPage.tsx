import { CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ReportProblemDialog } from "src/components/ReportProblemDialog";
import { useAuth } from "src/hooks/useAuth";
import { useTheme } from "src/context/ThemeContext";
import { getVersionInfo } from "src/api/version";

const panelStyle: CSSProperties = {
  minHeight: "100vh",
  padding: 0,
  background: "var(--hp-bg-gradient)",
  color: "var(--hp-text)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 18,
  boxSizing: "border-box",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 500,
  borderRadius: 28,
  padding: 22,
  background: "var(--hp-surface)",
  boxShadow: "var(--hp-shadow-md)",
  border: "1px solid var(--hp-border)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid var(--hp-border)",
  padding: "15px 14px",
  fontSize: 17,
  outline: "none",
  boxSizing: "border-box",
  background: "var(--hp-input-bg)",
  color: "var(--hp-text)",
};

const buttonStyle: CSSProperties = {
  width: "100%",
  border: 0,
  borderRadius: 16,
  padding: "15px 16px",
  fontSize: 17,
  fontWeight: 900,
  cursor: "pointer",
  background: "linear-gradient(135deg, #0f766e, #2563eb)",
  color: "white",
};

const tabButtonStyle: CSSProperties = {
  border: 0,
  borderRadius: 14,
  padding: "13px 12px",
  fontSize: 16,
  fontWeight: 900,
  cursor: "pointer",
};

const mutedButtonStyle: CSSProperties = {
  border: 0,
  background: "transparent",
  color: "var(--hp-primary)",
  fontWeight: 800,
  fontSize: 15,
  cursor: "pointer",
};

const legalLinkStyle: CSSProperties = {
  color: "var(--hp-primary)",
  fontWeight: 800,
};

const authFooterStyle: CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  background: "var(--hp-surface)",
  borderTop: "1px solid var(--hp-border)",
  boxShadow: "var(--hp-shadow-sm)",
  boxSizing: "border-box",
};

const authFooterInnerStyle: CSSProperties = {
  width: "100%",
  maxWidth: 500,
  margin: "0 auto",
  display: "flex",
  justifyContent: "center",
  gap: 14,
  flexWrap: "wrap",
  fontSize: 13,
};

type Mode = "login" | "register" | "forgot" | "reset";
type ServerStatus = "checking" | "online" | "offline";

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { appliedTheme, setTheme } = useTheme();
  const {
    authLoading,
    isAuthenticated,
    loginWithPassword,
    registerWithPassword,
    forgotPassword,
    resetPassword,
  } = useAuth();

  const resetToken = searchParams.get("resetToken") ?? searchParams.get("token") ?? "";
  const legacyConfirmToken = searchParams.get("confirmToken") ?? "";
  const initialMode = useMemo<Mode>(() => (resetToken ? "reset" : "login"), [resetToken]);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordRepeat, setNewPasswordRepeat] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus>("checking");

  useEffect(() => {
    let active = true;

    const checkServer = async () => {
      if (!navigator.onLine) {
        if (active) setServerStatus("offline");
        return;
      }

      try {
        await getVersionInfo();
        if (active) setServerStatus("online");
      } catch {
        if (active) setServerStatus("offline");
      }
    };

    const handleOnline = () => {
      setServerStatus("checking");
      void checkServer();
    };
    const handleOffline = () => setServerStatus("offline");

    void checkServer();
    const intervalId = window.setInterval(() => void checkServer(), 60_000);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (legacyConfirmToken) {
      navigate(`/confirm-email?token=${encodeURIComponent(legacyConfirmToken)}`, { replace: true });
    }
  }, [legacyConfirmToken, navigate]);

  useEffect(() => {
    if (authLoading || loading || mode === "register" || resetToken || legacyConfirmToken) {
      return;
    }

    if (isAuthenticated) {
      navigate("/events", { replace: true });
    }
  }, [authLoading, isAuthenticated, legacyConfirmToken, loading, mode, navigate, resetToken]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "login") {
        await loginWithPassword(email, password);
        navigate("/events", { replace: true });
        return;
      }

      if (mode === "register") {
        if (password !== passwordRepeat) {
          setError("Пароли не совпадают.");
          return;
        }

        if (!termsAccepted) {
          setError("Чтобы зарегистрироваться, примите пользовательское соглашение и политику конфиденциальности.");
          return;
        }

        const registeredUser = await registerWithPassword({
          firstName: "Новый",
          lastName: "Игрок",
          email,
          password,
        });
        navigate(`/users/${registeredUser.id}/edit?next=${encodeURIComponent("/teams")}`, { replace: true });
        return;
      }

      if (mode === "forgot") {
        await forgotPassword(email);
        setMessage("Если такая почта есть в системе, мы отправили письмо для смены пароля.");
        return;
      }

      if (newPassword !== newPasswordRepeat) {
        setError("Пароли не совпадают.");
        return;
      }

      await resetPassword(resetToken, newPassword);
      setMode("login");
      setMessage("Пароль обновлен. Теперь можно войти.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так.");
      if (mode === "login" && err instanceof Error && err.message.toLowerCase().includes("invalid email or password")) {
        setError("Не получилось войти. Возможно, аккаунт еще не создан или пароль введен неверно.");
      }
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "register"
      ? "Регистрация"
      : mode === "forgot"
        ? "Восстановить пароль"
        : mode === "reset"
          ? "Новый пароль"
          : "Вход";

  return (
    <div style={panelStyle}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          width: "100%",
          padding: "11px 16px",
          borderBottom: "1px solid var(--hp-border)",
          backgroundColor: "var(--hp-surface)",
          boxShadow: "var(--hp-shadow-sm)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 720,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--hp-text-strong)", fontWeight: 900 }}>
            <span aria-hidden="true" style={{ fontSize: 22, lineHeight: 1 }}>🏒</span>
            <span>Hockey Planner</span>
            <span
              role="status"
              aria-label={serverStatus === "online" ? "Сервер доступен" : serverStatus === "offline" ? "Нет соединения с сервером" : "Проверяем соединение с сервером"}
              title={serverStatus === "online" ? "Сервер доступен" : serverStatus === "offline" ? "Нет соединения с сервером" : "Проверяем соединение"}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: serverStatus === "online" ? "var(--hp-success)" : serverStatus === "offline" ? "var(--hp-danger)" : "var(--hp-border-strong)",
                boxShadow: serverStatus === "online" ? "0 0 0 2px var(--hp-success-soft)" : serverStatus === "offline" ? "0 0 0 2px var(--hp-danger-soft)" : "none",
                flexShrink: 0,
              }}
            />
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={appliedTheme === "dark"}
            aria-label="Переключить цветовую тему"
            title={appliedTheme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
            onClick={() => setTheme(appliedTheme === "dark" ? "light" : "dark")}
            style={{
              border: "1px solid var(--hp-border)",
              borderRadius: 999,
              padding: "3px",
              width: 58,
              height: 32,
              backgroundColor: appliedTheme === "dark" ? "var(--hp-primary)" : "var(--hp-surface-muted)",
              cursor: "pointer",
              position: "relative",
              flexShrink: 0,
              transition: "background-color 0.2s ease",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 3,
                left: appliedTheme === "dark" ? 29 : 3,
                width: 24,
                height: 24,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "var(--hp-surface)",
                boxShadow: "0 2px 5px rgba(15, 23, 42, 0.25)",
                fontSize: 14,
                lineHeight: 1,
                transition: "left 0.2s ease",
              }}
            >
              {appliedTheme === "dark" ? "🌙" : "☀️"}
            </span>
          </button>
        </div>
      </header>
      <div style={{ width: "100%", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 14px", boxSizing: "border-box" }}>
      <form style={cardStyle} onSubmit={submit}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#0f766e", textTransform: "uppercase", letterSpacing: 1 }}>
            Hockey Planner
          </div>
          <h1 style={{ margin: "8px 0 6px", fontSize: 30, color: "var(--hp-text-strong)" }}>{title}</h1>
          <p style={{ margin: 0, color: "var(--hp-muted)", fontSize: 16, lineHeight: 1.45 }}>
            {mode === "login"
              ? "Введите email и пароль, которые указывали при регистрации."
              : mode === "register"
                ? "Введите email и придумайте пароль."
                : mode === "forgot"
                  ? "Введите email, и мы отправим письмо для смены пароля."
                  : "Введите новый пароль для вашего аккаунта."}
          </p>
        </div>

        {(mode === "login" || mode === "register") && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
              padding: 6,
              marginBottom: 18,
              borderRadius: 18,
              background: "var(--hp-surface-muted)",
            }}
          >
            <button
              type="button"
              style={{
                ...tabButtonStyle,
                background: mode === "login" ? "var(--hp-surface)" : "transparent",
                color: mode === "login" ? "var(--hp-text-strong)" : "var(--hp-muted)",
                boxShadow: mode === "login" ? "var(--hp-shadow-sm)" : "none",
              }}
              onClick={() => setMode("login")}
            >
              Войти
            </button>
            <button
              type="button"
              style={{
                ...tabButtonStyle,
                background: mode === "register" ? "var(--hp-surface)" : "transparent",
                color: mode === "register" ? "var(--hp-text-strong)" : "var(--hp-muted)",
                boxShadow: mode === "register" ? "var(--hp-shadow-sm)" : "none",
              }}
              onClick={() => setMode("register")}
            >
              Регистрация
            </button>
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {mode !== "reset" && (
            <input style={inputStyle} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" autoComplete="email" required />
          )}

          {(mode === "login" || mode === "register") && (
            <>
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...inputStyle, paddingRight: 96 }}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === "login" ? "Пароль" : "Пароль, минимум 8 символов"}
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: 0,
                    borderRadius: 10,
                    background: "var(--hp-surface-muted)",
                    color: "#334155",
                    padding: "8px 10px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? "Скрыть" : "Показать"}
                </button>
              </div>

              {mode === "register" && (
                <input
                  style={inputStyle}
                  value={passwordRepeat}
                  onChange={(event) => setPasswordRepeat(event.target.value)}
                  placeholder="Повторите пароль"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              )}
            </>
          )}

          {mode === "reset" && (
            <>
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...inputStyle, paddingRight: 96 }}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Новый пароль"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: 0,
                    borderRadius: 10,
                    background: "var(--hp-surface-muted)",
                    color: "#334155",
                    padding: "8px 10px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? "Скрыть" : "Показать"}
                </button>
              </div>
              <input
                style={inputStyle}
                value={newPasswordRepeat}
                onChange={(event) => setNewPasswordRepeat(event.target.value)}
                placeholder="Повторите новый пароль"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </>
          )}
        </div>

        {error && <div style={{ marginTop: 14, padding: 12, borderRadius: 14, background: "#fee2e2", color: "#991b1b" }}>{error}</div>}
        {message && <div style={{ marginTop: 14, padding: 12, borderRadius: 14, background: "#dcfce7", color: "#166534" }}>{message}</div>}

        {mode === "register" && (
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              marginTop: 14,
              padding: "12px 13px",
              borderRadius: 14,
              border: "1px solid var(--hp-border)",
              background: "var(--hp-surface-soft)",
              color: "var(--hp-text)",
              fontSize: 14,
              lineHeight: 1.5,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              required
              style={{
                position: "absolute",
                width: 1,
                height: 1,
                opacity: 0,
                pointerEvents: "none",
              }}
            />
            <span
              aria-hidden="true"
              style={{
                width: 20,
                height: 20,
                minWidth: 20,
                marginTop: 1,
                borderRadius: 6,
                border: termsAccepted ? "1px solid var(--hp-primary)" : "1px solid var(--hp-border-strong)",
                background: termsAccepted ? "var(--hp-primary)" : "var(--hp-surface)",
                color: "white",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                fontWeight: 900,
                lineHeight: 1,
                boxSizing: "border-box",
              }}
            >
              {termsAccepted ? "✓" : ""}
            </span>
            <span>
              Я принимаю{" "}
              <Link to="/terms" style={legalLinkStyle}>
                Пользовательское соглашение
              </Link>{" "}
              и{" "}
              <Link to="/privacy" style={legalLinkStyle}>
                Политику конфиденциальности
              </Link>
            </span>
          </label>
        )}

        <button
          type="submit"
          style={{
            ...buttonStyle,
            marginTop: 18,
            opacity: loading || (mode === "register" && !termsAccepted) ? 0.55 : 1,
            cursor: loading || (mode === "register" && !termsAccepted) ? "not-allowed" : "pointer",
          }}
          disabled={loading || (mode === "register" && !termsAccepted)}
        >
          {loading
            ? "Подождите..."
            : mode === "forgot"
              ? "Отправить письмо"
              : mode === "reset"
                ? "Сменить пароль"
                : mode === "register"
                  ? "Продолжить"
                  : "Войти"}
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          {mode === "login" && (
            <button type="button" style={mutedButtonStyle} onClick={() => setMode("forgot")}>
              Забыли пароль?
            </button>
          )}
          {(mode === "forgot" || mode === "reset") && (
            <button type="button" style={mutedButtonStyle} onClick={() => setMode("login")}>
              Вернуться ко входу
            </button>
          )}
          <button type="button" style={mutedButtonStyle} onClick={() => setIsReportOpen(true)}>
            Сообщить о проблеме
          </button>
        </div>
        <button
          type="button"
          onClick={() => navigate("/instructions", { state: { from: "/login" } })}
          style={{
            ...mutedButtonStyle,
            width: "100%",
            marginTop: 14,
            padding: "8px 0",
            color: "var(--hp-muted)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>
            ℹ️
          </span>
          <span>Инструкция</span>
        </button>
      </form>
      </div>
      <footer style={authFooterStyle}>
        <div style={authFooterInnerStyle}>
          <Link to="/terms" style={{ ...legalLinkStyle, color: "var(--hp-muted)" }}>
            Пользовательское соглашение
          </Link>
          <Link to="/privacy" style={{ ...legalLinkStyle, color: "var(--hp-muted)" }}>
            Политика конфиденциальности
          </Link>
        </div>
      </footer>
      <ReportProblemDialog isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </div>
  );
}
