import { useState } from "react";

const legendItems = [
  { label: "Тренировка", color: "#4caf50" },
  { label: "Матч", color: "#2196f3" },
  { label: "Встреча", color: "#9c27b0" },
];

export function Legend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ backgroundColor: "var(--hp-surface)", borderRadius: "12px", padding: "10px 12px", marginBottom: "14px", boxShadow: "var(--hp-shadow-sm)", border: "1px solid var(--hp-border)" }}>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          border: "none",
          padding: 0,
          background: "transparent",
          color: "var(--hp-heading)",
          cursor: "pointer",
          font: "inherit",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <span style={{ fontSize: "14px", fontWeight: 800, whiteSpace: "nowrap" }}>Легенда</span>
          <span style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: 0 }}>
            {legendItems.map((item) => (
              <span key={item.label} title={item.label} style={{ width: "10px", height: "10px", backgroundColor: item.color, borderRadius: "3px", flexShrink: 0 }} />
            ))}
            <span title="Сегодня" style={{ width: "10px", height: "10px", backgroundColor: "var(--hp-primary-soft)", border: "2px solid var(--hp-primary)", borderRadius: "3px", boxSizing: "border-box", flexShrink: 0 }} />
          </span>
        </span>
        <span style={{ color: "var(--hp-muted)", fontSize: "18px", lineHeight: 1, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>⌄</span>
      </button>

      {isOpen && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", padding: "12px", marginTop: "10px", backgroundColor: "var(--hp-surface-soft)", borderRadius: "10px", border: "1px solid var(--hp-border)" }}>
          {legendItems.map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "14px", height: "14px", backgroundColor: item.color, borderRadius: "4px" }} />
              <span style={{ fontSize: "13px", color: "var(--hp-text)" }}>{item.label}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "14px", height: "14px", backgroundColor: "var(--hp-primary-soft)", border: "2px solid var(--hp-primary)", borderRadius: "4px", boxSizing: "border-box" }} />
            <span style={{ fontSize: "13px", color: "var(--hp-text)" }}>Сегодня</span>
          </div>
        </div>
      )}
    </div>
  );
}
