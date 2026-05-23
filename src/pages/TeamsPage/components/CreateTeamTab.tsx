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
      <h2 style={{ margin: 0, fontSize: 20, color: "var(--hp-text-strong)" }}>Создать команду</h2>
      <p style={{ margin: 0, color: "var(--hp-muted)", lineHeight: 1.4 }}>
        Создавайте команду, если её ещё нет. Создатель становится владельцем.
      </p>
      <input value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="Название команды" style={inputStyle} />
      <label style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--hp-text)", fontWeight: 700, cursor: "pointer", userSelect: "none" }}>
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(event) => onPublicChange(event.target.checked)}
          style={{
            position: "absolute",
            opacity: 0,
            pointerEvents: "none",
          }}
        />
        <span
          aria-hidden="true"
          style={{
            width: 22,
            height: 22,
            margin: 0,
            borderRadius: 7,
            border: `2px solid ${isPublic ? "var(--hp-primary)" : "var(--hp-border)"}`,
            backgroundColor: isPublic ? "var(--hp-primary)" : "var(--hp-surface)",
            color: "white",
            boxShadow: isPublic ? "var(--hp-shadow-sm)" : "inset 0 0 0 1px var(--hp-surface-soft)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 900,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {isPublic ? "✓" : ""}
        </span>
        <span>Публичная команда</span>
      </label>
      <button type="button" onClick={onCreate} disabled={loading} style={{ ...buttonStyle, background: "#0f766e", color: "white", opacity: loading ? 0.72 : 1 }}>
        {loading ? "Создаём..." : "Создать команду"}
      </button>
    </div>
  );
}

