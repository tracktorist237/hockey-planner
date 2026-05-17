import { useNavigate } from "react-router-dom";

interface PermissionDeniedProps {
  title?: string;
  message?: string;
  backPath?: string;
}

export function PermissionDenied({
  title = "Доступ ограничен",
  message = "У вас недостаточно прав для этого действия.",
  backPath = "/events",
}: PermissionDeniedProps) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--hp-bg-gradient)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "var(--hp-surface)",
          borderRadius: "16px",
          border: "1px solid var(--hp-border)",
          boxShadow: "var(--hp-shadow-sm)",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "42px", marginBottom: "10px" }}>🔒</div>
        <h1 style={{ margin: 0, color: "var(--hp-heading)", fontSize: "24px" }}>{title}</h1>
        <p style={{ margin: "10px 0 20px 0", color: "#546e7a", lineHeight: 1.5 }}>{message}</p>
        <button
          onClick={() => navigate(backPath)}
          style={{
            border: "none",
            borderRadius: "10px",
            padding: "12px 18px",
            fontSize: "15px",
            fontWeight: 600,
            backgroundColor: "var(--hp-primary)",
            color: "white",
            cursor: "pointer",
          }}
        >
          Вернуться к мероприятиям
        </button>
      </div>
    </div>
  );
}

export default PermissionDenied;
