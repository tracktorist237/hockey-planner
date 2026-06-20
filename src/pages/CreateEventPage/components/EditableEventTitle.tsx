import { useState } from "react";

interface EditableEventTitleProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  backgroundColor: string;
  borderColor: string;
  color: string;
  quoted?: boolean;
}

export const EditableEventTitle = ({
  label,
  value,
  onChange,
  backgroundColor,
  borderColor,
  color,
  quoted = false,
}: EditableEventTitleProps) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div
      style={{
        padding: "12px",
        backgroundColor,
        borderRadius: "10px",
        fontSize: "14px",
        color,
        textAlign: "center",
        border: `1px solid ${borderColor}`,
        width: "100%",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <strong>{label}:</strong>
      {isEditing ? (
        <input
          autoFocus
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          style={{
            display: "block",
            width: "100%",
            marginTop: "8px",
            padding: "9px 11px",
            border: `1px solid ${borderColor}`,
            borderRadius: "8px",
            backgroundColor: "var(--hp-surface)",
            color: "var(--hp-text)",
            fontSize: "15px",
            fontWeight: "600",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        />
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: "4px", padding: "0 38px", boxSizing: "border-box" }}>
          <span style={{ fontSize: "15px", fontWeight: "600", overflowWrap: "anywhere" }}>
            {quoted ? `"${value}"` : value}
          </span>
          <button
            type="button"
            aria-label={`Редактировать ${label.toLocaleLowerCase("ru-RU")}`}
            title="Редактировать название"
            onClick={() => setIsEditing(true)}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "32px",
              height: "32px",
              border: `1px solid ${borderColor}`,
              borderRadius: "8px",
              padding: 0,
              background: "var(--hp-surface)",
              color,
              cursor: "pointer",
              fontSize: "16px",
              lineHeight: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✏️
          </button>
        </div>
      )}
    </div>
  );
};
