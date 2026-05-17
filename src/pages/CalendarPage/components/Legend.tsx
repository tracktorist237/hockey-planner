export function Legend() {
  return (
    <div style={{ backgroundColor: "var(--hp-surface)", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "var(--hp-shadow-sm)" }}>
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", padding: "16px", backgroundColor: "var(--hp-surface-soft)", borderRadius: "12px", border: "1px solid var(--hp-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "16px", height: "16px", backgroundColor: "#4caf50", borderRadius: "4px" }} /><span style={{ fontSize: "14px", color: "var(--hp-text)" }}>Тренировка</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "16px", height: "16px", backgroundColor: "#2196f3", borderRadius: "4px" }} /><span style={{ fontSize: "14px", color: "var(--hp-text)" }}>Матч</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "16px", height: "16px", backgroundColor: "#9c27b0", borderRadius: "4px" }} /><span style={{ fontSize: "14px", color: "var(--hp-text)" }}>Встреча</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "16px", height: "16px", backgroundColor: "var(--hp-primary-soft)", border: "2px solid var(--hp-primary)", borderRadius: "4px" }} /><span style={{ fontSize: "14px", color: "var(--hp-text)" }}>Сегодня</span></div>
      </div>
    </div>
  );
}
