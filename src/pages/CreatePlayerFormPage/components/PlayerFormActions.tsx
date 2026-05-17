import { MouseEvent } from "react";

interface PlayerFormActionsProps {
  submitting: boolean;
  onCancel: () => void;
  submitText?: string;
  submittingText?: string;
  cancelText?: string;
}

export function PlayerFormActions({
  submitting,
  onCancel,
  submitText = "Создать игрока",
  submittingText = "Создание анкеты...",
  cancelText = "Отмена",
}: PlayerFormActionsProps) {
  const updateButtonState = (
    event: MouseEvent<HTMLButtonElement>,
    state: "enter" | "leave",
    disabled = false,
  ) => {
    if (disabled) {
      return;
    }

    if (event.currentTarget.type === "submit") {
      event.currentTarget.style.backgroundColor = state === "enter" ? "var(--hp-primary-hover)" : "var(--hp-primary)";
    } else {
      event.currentTarget.style.backgroundColor = state === "enter" ? "var(--hp-border)" : "var(--hp-surface-soft)";
    }

    event.currentTarget.style.transform = state === "enter" ? "translateY(-1px)" : "translateY(0)";
  };

  return (
    <div style={{ backgroundColor: "var(--hp-surface)", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "var(--hp-shadow-sm)" }}>
      <div style={{ display: "flex", gap: "12px", flexDirection: "column" }}>
        <button
          type="submit"
          disabled={submitting}
          onMouseEnter={(event) => updateButtonState(event, "enter", submitting)}
          onMouseLeave={(event) => updateButtonState(event, "leave", submitting)}
          style={{ width: "100%", padding: "16px 24px", backgroundColor: "var(--hp-primary)", color: "white", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "600", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, transition: "all 0.2s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        >
          {submitting ? (
            <>
              <span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              <span>{submittingText}</span>
            </>
          ) : (
            <span>{submitText}</span>
          )}
        </button>

        <button
          type="button"
          onClick={onCancel}
          onMouseEnter={(event) => updateButtonState(event, "enter")}
          onMouseLeave={(event) => updateButtonState(event, "leave")}
          style={{ width: "100%", padding: "14px 24px", backgroundColor: "var(--hp-surface-soft)", color: "var(--hp-muted)", border: "1px solid var(--hp-border)", borderRadius: "12px", fontSize: "15px", fontWeight: "500", cursor: "pointer", transition: "all 0.2s ease" }}
        >
          {cancelText}
        </button>
      </div>
    </div>
  );
}
