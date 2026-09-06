interface ActionMenuProps {
  eventId: string;
  isOpen: boolean;
  onToggle: () => void;
  canManage: boolean;
}

export const ActionMenu = ({ eventId, isOpen, onToggle, canManage }: ActionMenuProps) => {
  if (!canManage) {
    return null;
  }

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
          backgroundColor: "var(--hp-surface-soft)",
          color: "var(--hp-heading)",
          border: "1px solid var(--hp-border)",
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
          e.currentTarget.style.backgroundColor = "var(--hp-primary-soft)";
          e.currentTarget.style.borderColor = "var(--hp-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--hp-surface-soft)";
          e.currentTarget.style.borderColor = "var(--hp-border)";
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
            backgroundColor: "var(--hp-surface-soft)",
            borderRadius: "12px",
            border: "1px solid var(--hp-border)",
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
                backgroundColor: "var(--hp-primary)",
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
                e.currentTarget.style.backgroundColor = "var(--hp-primary-hover)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--hp-primary)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span>✏️</span>
              <span>Редактировать</span>
            </button>

            <button
              onClick={() => {
                window.location.href = `/events/${eventId}/transfer`;
              }}
              style={{
                flex: 1,
                minWidth: "140px",
                padding: "14px 20px",
                backgroundColor: "var(--hp-surface)",
                color: "var(--hp-heading)",
                border: "1px solid var(--hp-border)",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Перенести данные
            </button>

            <button
              onClick={() => {
                window.location.href = `/events/${eventId}/delete`;
              }}
              style={{
                flex: 1,
                minWidth: "140px",
                padding: "14px 20px",
                backgroundColor: "var(--hp-danger-soft)",
                color: "var(--hp-danger)",
                border: "1px solid var(--hp-danger-border)",
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
                e.currentTarget.style.backgroundColor = "var(--hp-danger-border)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--hp-danger-soft)";
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
              color: "var(--hp-muted)",
              textAlign: "center",
              borderTop: "1px solid var(--hp-border)",
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
