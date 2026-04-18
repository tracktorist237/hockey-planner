export function Legend() {
  return (
    <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", padding: "16px", backgroundColor: "#f8f9fa", borderRadius: "12px", border: "1px solid #e0e0e0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "16px", height: "16px", backgroundColor: "#4caf50", borderRadius: "4px" }} /><span style={{ fontSize: "14px", color: "#333" }}>Тренировка</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "16px", height: "16px", backgroundColor: "#2196f3", borderRadius: "4px" }} /><span style={{ fontSize: "14px", color: "#333" }}>Матч</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "16px", height: "16px", backgroundColor: "#9c27b0", borderRadius: "4px" }} /><span style={{ fontSize: "14px", color: "#333" }}>Встреча</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "16px", height: "16px", backgroundColor: "#e3f2fd", border: "2px solid #1976d2", borderRadius: "4px" }} /><span style={{ fontSize: "14px", color: "#333" }}>Сегодня</span></div>
      </div>
    </div>
  );
}
