interface ActionMenuProps {
  eventId: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const ActionMenu = ({ eventId, isOpen, onToggle }: ActionMenuProps) => {
  return (
    <div
      style={{
        marginBottom: "20px",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          padding: "14px 16px",
          backgroundColor: "#f8f9fa",
          color: "#1a237e",
          border: "1px solid #e0e0e0",
          borderRadius: "10px",
          fontSize: "15px",
          fontWeight: "600",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#e3f2fd";
          e.currentTarget.style.borderColor = "#1976d2";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#f8f9fa";
          e.currentTarget.style.borderColor = "#e0e0e0";
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>⚙️</span>
          <span>Действия с мероприятием</span>
        </span>
        <span
          style={{
            fontSize: "20px",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            marginTop: "12px",
            padding: "16px",
            backgroundColor: "#f8f9fa",
            borderRadius: "12px",
            border: "1px solid #e0e0e0",
            animation: "slideDown 0.3s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => {
                window.location.href = `/events/${eventId}/edit`;
              }}
              style={{
                flex: 1,
                minWidth: "140px",
                padding: "14px 20px",
                backgroundColor: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
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
              <span>✏️</span>
              <span>Редактировать</span>
            </button>

            <button
              onClick={() => {
                window.location.href = `/events/${eventId}/delete`;
              }}
              style={{
                flex: 1,
                minWidth: "140px",
                padding: "14px 20px",
                backgroundColor: "#ffebee",
                color: "#d32f2f",
                border: "1px solid #ffcdd2",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#ffcdd2";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ffebee";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span>🗑️</span>
              <span>Удалить</span>
            </button>
          </div>

          <p
            style={{
              margin: "16px 0 0 0",
              fontSize: "13px",
              color: "#666",
              textAlign: "center",
              borderTop: "1px solid #e0e0e0",
              paddingTop: "16px",
            }}
          >
            Редактирование доступно для организаторов мероприятия
          </p>
        </div>
      )}
    </div>
  );
};
