import { buttonStyle, inputStyle } from "./styles";

interface CreateTeamTabProps {
  name: string;
  isPublic: boolean;
  loading: boolean;
  onNameChange: (value: string) => void;
  onPublicChange: (value: boolean) => void;
  onCreate: () => void;
}

export function CreateTeamTab({ name, isPublic, loading, onNameChange, onPublicChange, onCreate }: CreateTeamTabProps) {
  return (
    <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
      <h2 style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>Создать команду</h2>
      <p style={{ margin: 0, color: "#64748b", lineHeight: 1.4 }}>
        Создавайте команду, если её ещё нет. Создатель становится владельцем.
      </p>
      <input value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="Название команды" style={inputStyle} />
      <label style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontWeight: 700 }}>
        <input type="checkbox" checked={isPublic} onChange={(event) => onPublicChange(event.target.checked)} />
        Публичная команда
      </label>
      <button type="button" onClick={onCreate} disabled={loading} style={{ ...buttonStyle, background: "#0f766e", color: "white", opacity: loading ? 0.72 : 1 }}>
        {loading ? "Создаём..." : "Создать команду"}
      </button>
    </div>
  );
}
