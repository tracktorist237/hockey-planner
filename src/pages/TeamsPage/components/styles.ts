import { CSSProperties } from "react";

export const cardStyle: CSSProperties = {
  background: "var(--hp-surface)",
  borderRadius: 18,
  padding: 16,
  border: "1px solid var(--hp-border)",
  boxShadow: "var(--hp-shadow-md)",
};

export const buttonStyle: CSSProperties = {
  width: "100%",
  border: 0,
  borderRadius: 14,
  padding: "13px 14px",
  fontSize: 16,
  fontWeight: 800,
  cursor: "pointer",
};

export const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid var(--hp-border)",
  borderRadius: 12,
  padding: "13px 12px",
  fontSize: 16,
  background: "var(--hp-input-bg)",
  color: "var(--hp-text)",
};
