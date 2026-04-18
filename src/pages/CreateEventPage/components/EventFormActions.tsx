import { useState } from "react";

interface EventFormActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  loading: boolean;
  isVisible: boolean;
  submitText?: string;
  loadingText?: string;
}

export const EventFormActions = ({
  onCancel,
  onSubmit,
  loading,
  isVisible,
  submitText = "✅ Создать событие",
  loadingText = "Создание...",
}: EventFormActionsProps) => {
  const [cancelHover, setCancelHover] = useState(false);
  const [submitHover, setSubmitHover] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "0",
        left: "0",
        right: "0",
        backgroundColor: "white",
        padding: "16px",
        borderTop: "1px solid #e0e0e0",
        boxShadow: isVisible ? "0 -2px 10px rgba(0,0,0,0.1)" : "none",
        display: "flex",
        gap: "12px",
        zIndex: "100",
        boxSizing: "border-box",
        height: "88px",
        transform: isVisible ? "translateY(0)" : "translateY(100%)",
        opacity: isVisible ? 1 : 0,
        transition: "transform 0.3s ease, opacity 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "100%", margin: "0 auto", padding: "0 16px", boxSizing: "border-box" }}>
        <button
          onClick={onCancel}
          onMouseEnter={() => setCancelHover(true)}
          onMouseLeave={() => setCancelHover(false)}
          style={{
            padding: "16px 20px",
            border: "1px solid #e0e0e0",
            background: cancelHover ? "#f5f5f5" : "white",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "500",
            flex: 1,
            color: "#333",
            minWidth: "120px",
            boxSizing: "border-box",
            transition: "all 0.2s ease",
            transform: cancelHover ? "translateY(-1px)" : "none",
          }}
        >
          Отмена
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          onMouseEnter={() => {
            if (!loading) {
              setSubmitHover(true);
            }
          }}
          onMouseLeave={() => setSubmitHover(false)}
          style={{
            padding: "16px 20px",
            border: "none",
            background: loading ? "#78909c" : submitHover ? "#1565c0" : "#1976d2",
            color: "white",
            borderRadius: "10px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "13px",
            fontWeight: "600",
            flex: 2,
            minWidth: "180px",
            boxSizing: "border-box",
            transition: "all 0.2s ease",
            transform: submitHover && !loading ? "translateY(-1px)" : "none",
          }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              {loadingText}
            </span>
          ) : (
            submitText
          )}
        </button>
      </div>
    </div>
  );
};
