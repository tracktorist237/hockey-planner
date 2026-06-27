import { CSSProperties, useState } from "react";

const newAppUrl = (process.env.REACT_APP_MIGRATION_TARGET_URL || "https://hockeyplanner.ru").replace(/\/+$/, "");
const supportPhone = "+79080723092";

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
  padding: "16px 18px",
  border: 0,
  borderRadius: 16,
  background: "linear-gradient(135deg, var(--hp-success), #128a4a)",
  color: "#fff",
  fontSize: 17,
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(18, 138, 74, 0.28)",
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
          Старое приложение больше не работает
        </h1>

        <p style={{ ...paragraphStyle, textAlign: "center", fontSize: 17 }}>
          Hockey Planner переехал на новый адрес:
          <br />
          <strong style={{ color: "var(--hp-heading)", fontSize: 18 }}>hockeyplanner.ru</strong>
        </p>

        <p style={{ ...paragraphStyle, textAlign: "center", marginBottom: 0, fontWeight: 800 }}>
          Все данные сохранены.
        </p>

        <button
          type="button"
          style={primaryButtonStyle}
          onClick={() => handleCopy(newAppUrl, "✅ Адрес скопирован. Теперь откройте браузер и вставьте ссылку в адресную строку.")}
        >
          📋 Скопировать новый адрес
        </button>

        <p style={{ ...mutedStyle, margin: "10px 0 0", textAlign: "center" }}>
          Нажмите зелёную кнопку, затем откройте Safari, Chrome или Яндекс Браузер и вставьте ссылку в адресную строку.
        </p>

        <div style={infoBoxStyle}>
          <p style={{ ...paragraphStyle, marginBottom: 0, fontSize: 18, fontWeight: 900, textAlign: "center", color: "var(--hp-heading)" }}>
            ПОЧТА И ПАРОЛЬ ТОТ ЖЕ САМЫЙ
          </p>
        </div>

        <div style={infoBoxStyle}>
          <div style={{ marginBottom: 8, fontWeight: 900, color: "var(--hp-heading)" }}>
            Что сделать:
          </div>
          <ol style={{ margin: 0, paddingLeft: 20, ...mutedStyle }}>
            <li>Удалите старую иконку Hockey Planner с телефона.</li>
            <li>Откройте браузер: Safari, Chrome или Яндекс.</li>
            <li>Вставьте ссылку и войдите как обычно.</li>
          </ol>
        </div>

        <div style={infoBoxStyle}>
          <div style={{ marginBottom: 8, fontWeight: 900, color: "var(--hp-heading)" }}>
            Если не получается войти — звоните:
          </div>
          <p style={{ ...paragraphStyle, marginBottom: 0 }}>
            <a href={`tel:${supportPhone}`} style={{ color: "var(--hp-primary)", fontWeight: 900, fontSize: 18 }}>{supportPhone}</a>
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
