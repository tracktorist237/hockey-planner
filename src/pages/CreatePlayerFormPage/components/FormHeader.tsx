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
    event.currentTarget.style.backgroundColor = isEnter ? "var(--hp-surface-soft)" : "white";
    event.currentTarget.style.borderColor = isEnter ? "var(--hp-primary)" : "var(--hp-border)";
  };

  return (
    <div style={{ backgroundColor: "var(--hp-surface)", borderRadius: "16px", padding: "16px", marginBottom: "20px", boxShadow: "var(--hp-shadow-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
        <button
          onClick={onBack}
          onMouseEnter={(event) => handleHover(event, true)}
          onMouseLeave={(event) => handleHover(event, false)}
          style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--hp-border)", background: "var(--hp-surface)", fontSize: "20px", cursor: "pointer", borderRadius: "10px", marginRight: "12px", flexShrink: 0, transition: "all 0.2s ease" }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "600", color: "var(--hp-heading)" }}>{title}</h1>
      </div>
      <p style={{ margin: 0, fontSize: "15px", color: "var(--hp-muted)", lineHeight: "1.5" }}>{subtitle}</p>
    </div>
  );
}
