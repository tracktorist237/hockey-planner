import { CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ReportProblemDialog } from "src/components/ReportProblemDialog";
import { useAuth } from "src/hooks/useAuth";
import { markOnboardingRequired, shouldRunOnboarding } from "src/utils/onboarding";

const panelStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "20px 14px",
  background: "var(--hp-bg-gradient)",
  color: "var(--hp-text)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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

type Mode = "login" | "register" | "forgot" | "reset";

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    authLoading,
    isAuthenticated,
    loginWithPassword,
    registerWithPassword,
    forgotPassword,
    resetPassword,
    currentUser,
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
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    if (legacyConfirmToken) {
      navigate(`/confirm-email?token=${encodeURIComponent(legacyConfirmToken)}`, { replace: true });
    }
  }, [legacyConfirmToken, navigate]);

  useEffect(() => {
    if (authLoading || resetToken || legacyConfirmToken) {
      return;
    }

    if (isAuthenticated) {
      navigate(shouldRunOnboarding(currentUser) ? "/onboarding/link-player" : "/events", { replace: true });
    }
  }, [authLoading, currentUser, isAuthenticated, legacyConfirmToken, navigate, resetToken]);

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

        await registerWithPassword({
          firstName: "Новый",
          lastName: "Игрок",
          email,
          password,
        });
        markOnboardingRequired();
        navigate("/onboarding/link-player?emailConfirmation=sent", { replace: true });
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
                ? "Введите email и пароль. На следующем шаге можно будет выбрать себя из списка игроков."
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

        <button type="submit" style={{ ...buttonStyle, marginTop: 18, opacity: loading ? 0.7 : 1 }} disabled={loading}>
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
      <ReportProblemDialog isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </div>
  );
}
