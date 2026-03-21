import { useNavigate } from "react-router-dom";

export const AddPlayerButton = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#f8f9fa",
        borderRadius: "12px",
        border: "1px solid #e3f2fd",
        textAlign: "center",
      }}
    >
      <p
        style={{
          margin: "0 0 16px 0",
          fontSize: "16px",
          color: "#333",
          lineHeight: "1.5",
        }}
      >
        Не нашли себя в списке?
      </p>
      <button
        onClick={() => navigate("/create-player")}
        style={{
          width: "100%",
          padding: "16px 24px",
          backgroundColor: "#1976d2",
          color: "white",
          border: "none",
          borderRadius: "12px",
          fontSize: "16px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#1565c0";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#1976d2";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <span style={{ fontSize: 20 }}>+</span>
        <span>Заполнить анкету игрока</span>
      </button>
      <p
        style={{
          margin: "12px 0 0 0",
          fontSize: "13px",
          color: "#666",
          lineHeight: "1.4",
        }}
      >
        После заполнения анкеты вы сможете участвовать в мероприятиях
      </p>
    </div>
  );
};
