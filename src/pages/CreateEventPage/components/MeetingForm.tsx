interface MeetingFormProps {
  title: string;
  onChange: (value: string) => void;
}

export const MeetingForm = ({ title, onChange }: MeetingFormProps) => {
  return (
    <div style={{ marginBottom: "20px", width: "100%", boxSizing: "border-box" }}>
      <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "16px", color: "var(--hp-text)" }}>
        Название встречи *
      </label>
      <input
        value={title}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Например: Собрание команды"
        style={{
          width: "100%",
          padding: "14px",
          border: "1px solid var(--hp-border)",
          borderRadius: "10px",
          fontSize: "16px",
          backgroundColor: "var(--hp-surface-soft)",
          color: "var(--hp-text)",
          boxSizing: "border-box",
          maxWidth: "100%",
        }}
      />
    </div>
  );
};
