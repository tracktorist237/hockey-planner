import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlayerAvatar } from "src/components/PlayerAvatar";
import { InternalPageHeader } from "src/components/InternalPageHeader";
import { roleToLabel } from "src/constants/roles";
import { useAuth } from "src/hooks/useAuth";
import { getRoleColor } from "src/utils/colors";

export function ProfilePage() {
  const navigate = useNavigate();
  const { changeEmail, changePassword, currentUser, logout, resendEmailConfirmation } = useAuth();
  const [isEmailFormOpen, setIsEmailFormOpen] = useState(false);
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordRepeat, setNewPasswordRepeat] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  if (!currentUser) {
    return null;
  }

  const fullName = `${currentUser.lastName ?? ""} ${currentUser.firstName ?? ""}`.trim();

  const handleChangeEmail = async (event: FormEvent) => {
    event.preventDefault();
    setEmailLoading(true);
    setEmailError(null);
    setEmailMessage(null);

    try {
      await changeEmail({ newEmail, password: emailPassword });
      setEmailMessage(`Почта изменена. Письмо подтверждения отправлено на ${newEmail.trim()}.`);
      setNewEmail("");
      setEmailPassword("");
      setIsEmailFormOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось изменить почту.";
      setEmailError(
        message.includes("Invalid password") || message.includes("Пароль введен неверно")
          ? "Пароль введен неверно."
          : message.includes("Email is already registered") || message.includes("Эта почта уже используется")
            ? "Эта почта уже используется."
            : message,
      );
    } finally {
      setEmailLoading(false);
    }
  };

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordMessage(null);

    if (newPassword !== newPasswordRepeat) {
      setPasswordError("Новые пароли не совпадают.");
      setPasswordLoading(false);
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordMessage("Пароль изменен.");
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordRepeat("");
      setIsPasswordFormOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось изменить пароль.";
      setPasswordError(
        message.includes("Invalid password") || message.includes("Пароль введен неверно")
          ? "Текущий пароль введен неверно."
          : message.includes("Password must be at least 8 characters long") || message.includes("Пароль должен быть не короче")
            ? "Новый пароль должен быть не короче 8 символов."
            : message,
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleResendEmailConfirmation = async () => {
    setResendLoading(true);
    setEmailError(null);
    setEmailMessage(null);

    try {
      await resendEmailConfirmation();
      setEmailMessage(`Письмо подтверждения отправлено на ${currentUser.email ?? "ваш email"}.`);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "Не удалось отправить письмо подтверждения.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "16px",
        minHeight: "100vh",
        background: "var(--hp-bg-gradient)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <InternalPageHeader title="Профиль" onBack={() => navigate("/settings")} position="static" marginBottom={16} fullBleedInset={16} />

      <section
        style={{
          backgroundColor: "var(--hp-surface)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "16px",
          boxShadow: "var(--hp-shadow-sm)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <PlayerAvatar
            size={72}
            shape="rounded"
            photoUrl={currentUser.photoUrl}
            jerseyNumber={currentUser.jerseyNumber}
            fallbackBg={getRoleColor(currentUser.role)}
            fallbackColor="white"
            fallbackPrefix="#"
            badgePrefix="#"
            badgeSizePx={20}
            badgeFontSizePx={11}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--hp-heading)", marginBottom: "6px" }}>
              {fullName || "Без имени"}
            </div>
          <div style={{ fontSize: "14px", color: "var(--hp-muted)" }}>ID: {currentUser.id}</div>
          </div>
        </div>

        <div style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: "999px",
              backgroundColor: "var(--hp-primary-soft)",
              color: "var(--hp-primary-text)",
            }}
          >
            {roleToLabel[currentUser.role]}
          </span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: "999px",
              backgroundColor: "var(--hp-neutral-soft)",
              color: "var(--hp-neutral)",
            }}
          >
            Игровой № {currentUser.jerseyNumber ?? "—"}
          </span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: "999px",
              backgroundColor: currentUser.emailConfirmed === false ? "var(--hp-warning-soft)" : "var(--hp-success-soft)",
              color: currentUser.emailConfirmed === false ? "var(--hp-warning)" : "var(--hp-success)",
            }}
          >
            {currentUser.email ?? "Почта не указана"}
          </span>
        </div>
      </section>

      {currentUser.emailConfirmed === false && (
        <section
          style={{
            backgroundColor: "var(--hp-warning-soft)",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "16px",
            border: "1px solid var(--hp-warning-border)",
            color: "var(--hp-warning)",
            fontWeight: 700,
            lineHeight: 1.45,
          }}
        >
          <div style={{ marginBottom: "10px" }}>
            Подтвердите почту, чтобы восстановить доступ к профилю, если забудете пароль.
            Письмо уже отправлено на {currentUser.email ?? "ваш email"}.
          </div>
          <button
            type="button"
            onClick={handleResendEmailConfirmation}
            disabled={resendLoading}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid var(--hp-warning)",
              backgroundColor: "var(--hp-warning-border)",
              color: "var(--hp-text-strong)",
              fontWeight: 800,
              cursor: resendLoading ? "default" : "pointer",
              opacity: resendLoading ? 0.7 : 1,
            }}
          >
            {resendLoading ? "Отправляем..." : "Отправить письмо ещё раз"}
          </button>
        </section>
      )}

      {emailMessage && (
        <section
          style={{
            backgroundColor: "var(--hp-success-soft)",
            borderRadius: "16px",
            padding: "14px 16px",
            marginBottom: "16px",
            border: "1px solid var(--hp-success-border)",
            color: "var(--hp-success)",
            fontWeight: 700,
            lineHeight: 1.45,
          }}
        >
          {emailMessage}
        </section>
      )}

      {passwordMessage && (
        <section
          style={{
            backgroundColor: "var(--hp-success-soft)",
            borderRadius: "16px",
            padding: "14px 16px",
            marginBottom: "16px",
            border: "1px solid var(--hp-success-border)",
            color: "var(--hp-success)",
            fontWeight: 700,
            lineHeight: 1.45,
          }}
        >
          {passwordMessage}
        </section>
      )}

      {emailError && (
        <section
          style={{
            backgroundColor: "var(--hp-danger-soft)",
            borderRadius: "16px",
            padding: "14px 16px",
            marginBottom: "16px",
            border: "1px solid var(--hp-danger-border)",
            color: "var(--hp-danger)",
            fontWeight: 700,
            lineHeight: 1.45,
          }}
        >
          {emailError}
        </section>
      )}

      {passwordError && (
        <section
          style={{
            backgroundColor: "var(--hp-danger-soft)",
            borderRadius: "16px",
            padding: "14px 16px",
            marginBottom: "16px",
            border: "1px solid var(--hp-danger-border)",
            color: "var(--hp-danger)",
            fontWeight: 700,
            lineHeight: 1.45,
          }}
        >
          {passwordError}
        </section>
      )}

      <section
        style={{
          backgroundColor: "var(--hp-surface)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "16px",
          boxShadow: "var(--hp-shadow-sm)",
          display: "grid",
          gap: "10px",
        }}
      >
        <button
          onClick={() => navigate(`/users/${currentUser.id}/edit`)}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: "12px",
            border: "1px solid var(--hp-purple-border)",
            backgroundColor: "var(--hp-purple-soft)",
            color: "var(--hp-purple)",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Редактировать профиль
        </button>

        <button
          onClick={() => {
            setIsEmailFormOpen((value) => !value);
            setIsPasswordFormOpen(false);
            setEmailError(null);
            setEmailMessage(null);
            setPasswordError(null);
            setPasswordMessage(null);
            setNewEmail(currentUser.email ?? "");
            setEmailPassword("");
          }}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: "12px",
            border: "1px solid var(--hp-info-border)",
            backgroundColor: "var(--hp-info-soft)",
            color: "var(--hp-info)",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Изменить email
        </button>

        {isEmailFormOpen && (
          <form
            onSubmit={handleChangeEmail}
            style={{
              display: "grid",
              gap: "10px",
              padding: "14px",
              borderRadius: "14px",
              background: "var(--hp-bg-gradient)",
              border: "1px solid var(--hp-border)",
            }}
          >
            <div style={{ color: "var(--hp-muted)", fontSize: "14px", lineHeight: 1.4 }}>
              Укажите новый email и текущий пароль. На новый адрес придет письмо подтверждения.
            </div>
            <input
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              placeholder="Новый email"
              type="email"
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                borderRadius: "12px",
                border: "1px solid var(--hp-border)",
                fontSize: "16px",
              }}
            />
            <input
              value={emailPassword}
              onChange={(event) => setEmailPassword(event.target.value)}
              placeholder="Текущий пароль"
              type="password"
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                borderRadius: "12px",
                border: "1px solid var(--hp-border)",
                fontSize: "16px",
              }}
            />
            <button
              type="submit"
              disabled={emailLoading}
              style={{
                width: "100%",
                padding: "13px 16px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: "var(--hp-primary)",
                color: "white",
                fontWeight: 800,
                cursor: emailLoading ? "default" : "pointer",
                opacity: emailLoading ? 0.7 : 1,
              }}
            >
              {emailLoading ? "Отправляем..." : "Сохранить email"}
            </button>
          </form>
        )}

        <button
          onClick={() => {
            setIsPasswordFormOpen((value) => !value);
            setIsEmailFormOpen(false);
            setEmailError(null);
            setEmailMessage(null);
            setPasswordError(null);
            setPasswordMessage(null);
            setCurrentPassword("");
            setNewPassword("");
            setNewPasswordRepeat("");
          }}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: "12px",
            border: "1px solid var(--hp-success-border)",
            backgroundColor: "var(--hp-success-soft)",
            color: "var(--hp-success)",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Изменить пароль
        </button>

        {isPasswordFormOpen && (
          <form
            onSubmit={handleChangePassword}
            style={{
              display: "grid",
              gap: "10px",
              padding: "14px",
              borderRadius: "14px",
              background: "var(--hp-bg-gradient)",
              border: "1px solid var(--hp-border)",
            }}
          >
            <div style={{ color: "var(--hp-muted)", fontSize: "14px", lineHeight: 1.4 }}>
              Введите текущий пароль и новый пароль. Новый пароль должен быть не короче 8 символов.
            </div>
            <input
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Текущий пароль"
              type="password"
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                borderRadius: "12px",
                border: "1px solid var(--hp-border)",
                fontSize: "16px",
              }}
            />
            <input
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Новый пароль"
              type="password"
              required
              minLength={8}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                borderRadius: "12px",
                border: "1px solid var(--hp-border)",
                fontSize: "16px",
              }}
            />
            <input
              value={newPasswordRepeat}
              onChange={(event) => setNewPasswordRepeat(event.target.value)}
              placeholder="Повторите новый пароль"
              type="password"
              required
              minLength={8}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                borderRadius: "12px",
                border: "1px solid var(--hp-border)",
                fontSize: "16px",
              }}
            />
            <button
              type="submit"
              disabled={passwordLoading}
              style={{
                width: "100%",
                padding: "13px 16px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: "var(--hp-success)",
                color: "white",
                fontWeight: 800,
                cursor: passwordLoading ? "default" : "pointer",
                opacity: passwordLoading ? 0.7 : 1,
              }}
            >
              {passwordLoading ? "Сохраняем..." : "Сохранить пароль"}
            </button>
          </form>
        )}

        <button
          onClick={async () => {
            await logout();
            navigate("/login", { replace: true });
          }}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: "12px",
            border: "1px solid var(--hp-danger-border)",
            backgroundColor: "var(--hp-danger-soft)",
            color: "var(--hp-danger)",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Выйти из профиля
        </button>
      </section>

    </div>
  );
}

export default ProfilePage;
