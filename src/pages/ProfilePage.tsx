import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "src/components/BottomNav";
import { PlayerAvatar } from "src/components/PlayerAvatar";
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
        backgroundColor: "#f5f5f5",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <button
          onClick={() => navigate("/settings")}
          style={{
            width: "44px",
            height: "44px",
            border: "1px solid #e0e0e0",
            borderRadius: "10px",
            backgroundColor: "white",
            cursor: "pointer",
            fontSize: "20px",
          }}
          aria-label="Назад"
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: "22px", color: "#1a237e" }}>Профиль</h1>
      </div>

      <section
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
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
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#1a237e", marginBottom: "6px" }}>
              {fullName || "Без имени"}
            </div>
            <div style={{ fontSize: "14px", color: "#546e7a" }}>ID: {currentUser.id}</div>
          </div>
        </div>

        <div style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: "999px",
              backgroundColor: "#eef4ff",
              color: "#1f4fa5",
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
              backgroundColor: "#f3f5f7",
              color: "#455a64",
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
              backgroundColor: currentUser.emailConfirmed === false ? "#fff7ed" : "#ecfdf5",
              color: currentUser.emailConfirmed === false ? "#9a3412" : "#166534",
            }}
          >
            {currentUser.email ?? "Почта не указана"}
          </span>
        </div>
      </section>

      {currentUser.emailConfirmed === false && (
        <section
          style={{
            backgroundColor: "#fff7ed",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "16px",
            border: "1px solid #fed7aa",
            color: "#9a3412",
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
              border: "1px solid #fb923c",
              backgroundColor: "white",
              color: "#9a3412",
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
            backgroundColor: "#ecfdf5",
            borderRadius: "16px",
            padding: "14px 16px",
            marginBottom: "16px",
            border: "1px solid #bbf7d0",
            color: "#166534",
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
            backgroundColor: "#ecfdf5",
            borderRadius: "16px",
            padding: "14px 16px",
            marginBottom: "16px",
            border: "1px solid #bbf7d0",
            color: "#166534",
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
            backgroundColor: "#fef2f2",
            borderRadius: "16px",
            padding: "14px 16px",
            marginBottom: "16px",
            border: "1px solid #fecaca",
            color: "#991b1b",
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
            backgroundColor: "#fef2f2",
            borderRadius: "16px",
            padding: "14px 16px",
            marginBottom: "16px",
            border: "1px solid #fecaca",
            color: "#991b1b",
            fontWeight: 700,
            lineHeight: 1.45,
          }}
        >
          {passwordError}
        </section>
      )}

      <section
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
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
            border: "1px solid #d1c4e9",
            backgroundColor: "#ede7f6",
            color: "#5e35b1",
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
            border: "1px solid #bfdbfe",
            backgroundColor: "#eff6ff",
            color: "#1d4ed8",
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
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ color: "#475569", fontSize: "14px", lineHeight: 1.4 }}>
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
                border: "1px solid #cbd5e1",
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
                border: "1px solid #cbd5e1",
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
                backgroundColor: "#2563eb",
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
            border: "1px solid #bbf7d0",
            backgroundColor: "#ecfdf5",
            color: "#166534",
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
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ color: "#475569", fontSize: "14px", lineHeight: 1.4 }}>
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
                border: "1px solid #cbd5e1",
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
                border: "1px solid #cbd5e1",
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
                border: "1px solid #cbd5e1",
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
                backgroundColor: "#16a34a",
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
            navigate("/start-search", { replace: true });
          }}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: "12px",
            border: "1px solid #ffcdd2",
            backgroundColor: "#ffebee",
            color: "#c62828",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Выйти из профиля
        </button>
      </section>

      <BottomNav activeTab="settings" />
      <div style={{ height: "110px" }} />
    </div>
  );
}

export default ProfilePage;
