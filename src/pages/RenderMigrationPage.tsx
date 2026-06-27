import { CSSProperties, useMemo, useState } from "react";

const newAppUrl = (process.env.REACT_APP_MIGRATION_TARGET_URL || "https://hockeyplanner.ru").replace(/\/+$/, "");
const supportPhone = "+79080723092";
const storedUserKey = "currentUser";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "22px 14px",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "radial-gradient(circle at top left, rgba(25, 118, 210, 0.22), transparent 34%), var(--hp-app-bg)",
  color: "var(--hp-text)",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 560,
  padding: 22,
  borderRadius: 24,
  border: "1px solid var(--hp-border)",
  background: "var(--hp-surface)",
  boxShadow: "var(--hp-shadow-lg)",
};

const titleStyle: CSSProperties = {
  margin: "0 0 10px",
  color: "var(--hp-heading)",
  fontSize: 26,
  lineHeight: 1.15,
  textAlign: "center",
};

const paragraphStyle: CSSProperties = {
  margin: "0 0 12px",
  color: "var(--hp-text)",
  fontSize: 15,
  lineHeight: 1.5,
};

const mutedStyle: CSSProperties = {
  color: "var(--hp-muted)",
  fontSize: 13,
  lineHeight: 1.45,
};

const primaryButtonStyle: CSSProperties = {
  width: "100%",
  marginTop: 16,
  padding: "15px 18px",
  border: 0,
  borderRadius: 16,
  background: "linear-gradient(135deg, var(--hp-primary), var(--hp-primary-dark))",
  color: "#fff",
  fontSize: 16,
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(25, 118, 210, 0.26)",
};

const secondaryButtonStyle: CSSProperties = {
  width: "100%",
  marginTop: 10,
  padding: "12px 14px",
  border: "1px solid var(--hp-border)",
  borderRadius: 14,
  background: "var(--hp-surface-soft)",
  color: "var(--hp-heading)",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
};

const infoBoxStyle: CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 16,
  border: "1px solid var(--hp-border)",
  background: "var(--hp-surface-soft)",
};

type StoredUser = {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
};

function readStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(storedUserKey);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(textarea);
      return copied;
    } catch {
      return false;
    }
  }
}

export function RenderMigrationPage() {
  const [message, setMessage] = useState<string | null>(null);
  const storedUser = useMemo(() => readStoredUser(), []);
  const displayName = [storedUser?.lastName, storedUser?.firstName].filter(Boolean).join(" ") || storedUser?.fullName || null;
  const email = storedUser?.email?.trim() || null;

  const handleCopy = async (value: string, successMessage: string) => {
    const copied = await copyText(value);
    setMessage(copied ? successMessage : "Не удалось скопировать автоматически. Выделите текст и скопируйте вручную.");
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

        <h1 id="render-migration-title" style={titleStyle}>
          Hockey Planner переехал
        </h1>

        <p style={{ ...paragraphStyle, textAlign: "center", fontSize: 17 }}>
          Старый адрес больше не используется. Новая версия доступна на{" "}
          <strong style={{ color: "var(--hp-heading)" }}>hockeyplanner.ru</strong>.
        </p>

        <button type="button" style={primaryButtonStyle} onClick={() => window.location.assign(newAppUrl)}>
          Открыть новый Hockey Planner
        </button>

        <button type="button" style={secondaryButtonStyle} onClick={() => handleCopy(newAppUrl, "Ссылка на новый адрес скопирована.")}>
          Скопировать новый адрес
        </button>

        <div style={infoBoxStyle}>
          <div style={{ marginBottom: 8, fontWeight: 900, color: "var(--hp-heading)" }}>
            Что нужно сделать
          </div>
          <ol style={{ margin: 0, paddingLeft: 20, ...mutedStyle }}>
            <li>Удалите старое установленное приложение Hockey Planner с телефона или компьютера.</li>
            <li>Откройте новый адрес: <strong style={{ color: "var(--hp-heading)" }}>{newAppUrl}</strong></li>
            <li>Войдите заново. При необходимости установите приложение повторно уже с нового адреса.</li>
          </ol>
        </div>

        <div style={infoBoxStyle}>
          <div style={{ marginBottom: 8, fontWeight: 900, color: "var(--hp-heading)" }}>
            Данные для входа
          </div>
          {displayName && (
            <p style={paragraphStyle}>
              Пользователь: <strong>{displayName}</strong>
            </p>
          )}
          {email ? (
            <>
              <p style={paragraphStyle}>
                Почта: <strong>{email}</strong>
              </p>
              <button type="button" style={secondaryButtonStyle} onClick={() => handleCopy(email, "Почта скопирована.")}>
                Скопировать почту
              </button>
            </>
          ) : (
            <p style={paragraphStyle}>
              Почту не удалось определить на этом устройстве. Если вход не получится, используйте восстановление пароля на новом сайте.
            </p>
          )}
          <p style={{ ...mutedStyle, margin: email ? "10px 0 0" : 0 }}>
            Пароль показать нельзя: приложение не хранит его открытым текстом. Если браузер сохранял пароль, его можно посмотреть в настройках паролей браузера/устройства. Если не помните пароль — нажмите «Забыли пароль?» на новой странице входа.
          </p>
        </div>

        <div style={infoBoxStyle}>
          <div style={{ marginBottom: 8, fontWeight: 900, color: "var(--hp-heading)" }}>
            Нужна помощь?
          </div>
          <p style={paragraphStyle}>
            Позвоните или напишите: <a href={`tel:${supportPhone}`} style={{ color: "var(--hp-primary)", fontWeight: 900 }}>{supportPhone}</a>
          </p>
          <button type="button" style={secondaryButtonStyle} onClick={() => handleCopy(supportPhone, "Телефон скопирован.")}>
            Скопировать телефон
          </button>
        </div>

        {message && (
          <div style={{ marginTop: 12, color: "var(--hp-success)", fontSize: 13, lineHeight: 1.4, textAlign: "center", fontWeight: 800 }}>
            {message}
          </div>
        )}
      </section>
    </main>
  );
}
