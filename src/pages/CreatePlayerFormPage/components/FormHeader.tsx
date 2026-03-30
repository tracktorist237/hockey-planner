import { MouseEvent } from "react";

interface FormHeaderProps {
  onBack: () => void;
  title?: string;
  subtitle?: string;
}

export function FormHeader({
  onBack,
  title = "Создание анкеты игрока",
  subtitle = "Заполните информацию о себе, чтобы участвовать в мероприятиях команды",
}: FormHeaderProps) {
  const handleHover = (event: MouseEvent<HTMLButtonElement>, isEnter: boolean) => {
    event.currentTarget.style.backgroundColor = isEnter ? "#f5f5f5" : "white";
    event.currentTarget.style.borderColor = isEnter ? "#1976d2" : "#e0e0e0";
  };

  return (
    <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "16px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
        <button
          onClick={onBack}
          onMouseEnter={(event) => handleHover(event, true)}
          onMouseLeave={(event) => handleHover(event, false)}
          style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e0e0", background: "white", fontSize: "20px", cursor: "pointer", borderRadius: "10px", marginRight: "12px", flexShrink: 0, transition: "all 0.2s ease" }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "600", color: "#1a237e" }}>{title}</h1>
      </div>
      <p style={{ margin: 0, fontSize: "15px", color: "#666", lineHeight: "1.5" }}>{subtitle}</p>
    </div>
  );
}
