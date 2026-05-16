import { buttonStyle, inputStyle } from "./styles";

interface JoinByCodeTabProps {
  code: string;
  loading: boolean;
  onCodeChange: (value: string) => void;
  onJoin: () => void;
}

export function JoinByCodeTab({ code, loading, onCodeChange, onJoin }: JoinByCodeTabProps) {
  return (
    <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
      <h2 style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>Вступить по коду</h2>
      <p style={{ margin: 0, color: "#64748b", lineHeight: 1.4 }}>
        Для закрытых команд. Код можно получить у владельца или администратора команды.
      </p>
      <input value={code} onChange={(event) => onCodeChange(event.target.value)} placeholder="Код приглашения" style={inputStyle} />
      <button type="button" onClick={onJoin} disabled={loading} style={{ ...buttonStyle, background: "#1d4ed8", color: "white", opacity: loading ? 0.72 : 1 }}>
        {loading ? "Вступаем..." : "Вступить"}
      </button>
    </div>
  );
}
