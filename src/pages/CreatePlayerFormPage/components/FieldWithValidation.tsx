import { ChangeEvent, useState } from "react";
import { FieldStatus } from "src/pages/CreatePlayerFormPage/types";

interface FieldWithValidationProps {
  label: string;
  name: string;
  value: string | number | null | undefined;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  status: FieldStatus;
  error?: string;
  placeholder?: string;
  type?: "text" | "number" | "date" | "tel";
  required?: boolean;
  min?: string | number;
  max?: string | number;
  allowManualDateInput?: boolean;
}

const formatIsoDateToManual = (dateValue: string | number | null | undefined): string => {
  if (typeof dateValue !== "string") {
    return "";
  }

  const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : dateValue;
};

const formatManualDateInput = (dateValue: string): string => {
  const digits = dateValue.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return [day, month, year].filter(Boolean).join(".");
};

const parseManualDateToIso = (dateValue: string): string | null => {
  const match = dateValue.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
  const isValidDate =
    parsedDate.getFullYear() === Number(year) &&
    parsedDate.getMonth() === Number(month) - 1 &&
    parsedDate.getDate() === Number(day);

  return isValidDate ? `${year}-${month}-${day}` : null;
};

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
  allowManualDateInput = false,
}: FieldWithValidationProps) {
  const [isManualDateInput, setIsManualDateInput] = useState(false);
  const [manualDateValue, setManualDateValue] = useState(formatIsoDateToManual(value));
  const canToggleManualDateInput = type === "date" && allowManualDateInput;
  const inputType = canToggleManualDateInput && isManualDateInput ? "text" : type;
  const inputValue = isManualDateInput ? manualDateValue : value ?? "";

  const emitChange = (nextValue: string) => {
    onChange({
      target: {
        name,
        value: nextValue,
      },
    } as ChangeEvent<HTMLInputElement>);
  };

  const handleManualDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatManualDateInput(event.target.value);
    setManualDateValue(formattedValue);

    if (!formattedValue) {
      emitChange("");
      return;
    }

    if (formattedValue.length !== 10) {
      return;
    }

    emitChange(parseManualDateToIso(formattedValue) ?? formattedValue);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (isManualDateInput) {
      handleManualDateChange(event);
      return;
    }

    onChange(event);
  };

  const handleManualDateToggle = () => {
    setIsManualDateInput((currentValue) => {
      const nextValue = !currentValue;
      if (nextValue) {
        setManualDateValue(formatIsoDateToManual(value));
      }
      return nextValue;
    });
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "15px", color: "var(--hp-text)" }}>
        {label}{required ? " *" : ""}
      </label>
      <div style={{ display: "grid", gridTemplateColumns: canToggleManualDateInput ? "minmax(0, 1fr) 132px" : "minmax(0, 1fr)", gap: "8px", alignItems: "stretch" }}>
        <div style={{ position: "relative", minWidth: 0 }}>
          <input
            type={inputType}
            name={name}
            value={inputValue}
            onChange={handleInputChange}
            required={required}
            min={inputType === type ? min : undefined}
            max={inputType === type ? max : undefined}
            placeholder={isManualDateInput ? "дд.мм.гггг" : placeholder}
            inputMode={isManualDateInput ? "numeric" : undefined}
            style={{ width: "100%", height: "50px", padding: "0 14px", border: `2px solid ${status === "error" ? "#d32f2f" : status === "success" ? "#4caf50" : "var(--hp-border)"}`, borderRadius: "10px", fontSize: "16px", backgroundColor: "var(--hp-input-bg)", boxSizing: "border-box", transition: "border-color 0.2s ease, box-shadow 0.2s ease" }}
          />
          {status === "success" && (
            <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#4caf50", fontSize: "18px" }}>✓</span>
          )}
        </div>
        {canToggleManualDateInput && (
          <button
            type="button"
            onClick={handleManualDateToggle}
            style={{ width: "132px", height: "50px", padding: "0 10px", border: "1px solid var(--hp-border)", borderRadius: "10px", backgroundColor: "var(--hp-surface)", color: "var(--hp-text)", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "normal", lineHeight: 1.15 }}
          >
            {isManualDateInput ? "Выбрать дату" : "Ввести вручную"}
          </button>
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
