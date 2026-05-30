import { ReactNode } from "react";

interface CheckboxControlProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export function CheckboxControl({ checked, onChange, label, description, disabled = false }: CheckboxControlProps) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        color: "var(--hp-heading)",
        fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
        userSelect: "none",
        minWidth: 0,
        lineHeight: 1.35,
        opacity: disabled ? 0.65 : 1,
      }}
    >
      <span style={{ position: "relative", width: 22, height: 22, flexShrink: 0, marginTop: 1 }}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            margin: 0,
            opacity: 0,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        />
        <span
          aria-hidden="true"
          style={{
            width: 22,
            height: 22,
            borderRadius: 7,
            border: checked ? "1px solid var(--hp-primary)" : "1px solid var(--hp-border)",
            background: checked ? "var(--hp-primary)" : "var(--hp-input-bg)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            fontWeight: 900,
            lineHeight: 1,
            boxShadow: checked ? "var(--hp-shadow-sm)" : "inset 0 0 0 1px var(--hp-surface-soft)",
          }}
        >
          {checked ? "✓" : ""}
        </span>
      </span>
      {(label || description) && (
        <span style={{ display: "grid", gap: 4, minWidth: 0, overflowWrap: "anywhere" }}>
          {label && <span>{label}</span>}
          {description && <span style={{ color: "var(--hp-muted)", fontSize: 13, fontWeight: 600 }}>{description}</span>}
        </span>
      )}
    </label>
  );
}
