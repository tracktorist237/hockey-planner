import { buttonStyle, inputStyle } from "./styles";

interface JoinByCodeTabProps {
  code: string;
  teamNumber: string;
  loading: boolean;
  onCodeChange: (value: string) => void;
  onTeamNumberChange: (value: string) => void;
  onJoin: () => void;
}

export function JoinByCodeTab({ code, teamNumber, loading, onCodeChange, onTeamNumberChange, onJoin }: JoinByCodeTabProps) {
  return (
    <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
      <h2 style={{ margin: 0, fontSize: 20, color: "var(--hp-text-strong)" }}>Вступить по коду</h2>
      <p style={{ margin: 0, color: "var(--hp-muted)", lineHeight: 1.4 }}>
        Для закрытых команд. Код можно получить у владельца или администратора команды.
      </p>
      <input value={code} onChange={(event) => onCodeChange(event.target.value)} placeholder="Код приглашения" style={inputStyle} />
      <input type="number" min={0} max={99} inputMode="numeric" value={teamNumber} onChange={(event) => onTeamNumberChange(event.target.value)} placeholder="Внутрикомандный номер (если требуется)" style={inputStyle} />
      <button type="button" onClick={onJoin} disabled={loading} style={{ ...buttonStyle, background: "#1d4ed8", color: "white", opacity: loading ? 0.72 : 1 }}>
        {loading ? "Вступаем..." : "Вступить"}
      </button>
    </div>
  );
}

