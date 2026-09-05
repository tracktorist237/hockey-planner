import { ReactNode } from "react";
import "src/components/CheckboxControl.css";

interface CheckboxControlProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export function CheckboxControl({ checked, onChange, label, description, disabled = false }: CheckboxControlProps) {
  return (
    <label className={`hp-checkbox${disabled ? " hp-checkbox--disabled" : ""}`}
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
      <span className="hp-checkbox__control">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="hp-checkbox__input"
        />
        <span
          aria-hidden="true"
          className={`hp-checkbox__box${checked ? " hp-checkbox__box--checked" : ""}`}
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
