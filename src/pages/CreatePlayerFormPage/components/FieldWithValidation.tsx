import { ChangeEvent } from "react";
import { FieldStatus } from "src/pages/CreatePlayerFormPage/types";

interface FieldWithValidationProps {
  label: string;
  name: string;
  value: string | number | null | undefined;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  status: FieldStatus;
  error?: string;
  placeholder?: string;
  type?: "text" | "number" | "date";
  required?: boolean;
  min?: string | number;
  max?: string | number;
}

export function FieldWithValidation({
  label,
  name,
  value,
  onChange,
  status,
  error,
  placeholder,
  type = "text",
  required = false,
  min,
  max,
}: FieldWithValidationProps) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "15px", color: "#333" }}>
        {label}{required ? " *" : ""}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={type}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          required={required}
          min={min}
          max={max}
          placeholder={placeholder}
          style={{ width: "100%", padding: "14px", border: `2px solid ${status === "error" ? "#d32f2f" : status === "success" ? "#4caf50" : "#e0e0e0"}`, borderRadius: "10px", fontSize: "16px", backgroundColor: "#fafafa", boxSizing: "border-box", transition: "all 0.2s ease" }}
        />
        {status === "success" && (
          <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#4caf50", fontSize: "18px" }}>✓</span>
        )}
      </div>
      {error && (
        <div style={{ marginTop: "6px", fontSize: "13px", color: "#d32f2f", display: "flex", alignItems: "center", gap: "4px" }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
