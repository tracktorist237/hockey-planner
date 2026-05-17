import { EventType } from "src/types/events";

interface EventTypeSelectorProps {
  currentType: EventType;
  onChange: (type: EventType) => void;
}

export const EventTypeSelector = ({ currentType, onChange }: EventTypeSelectorProps) => {
  const isPractice = currentType === EventType.Practice;
  const isGame = currentType === EventType.Game;
  const isMeeting = currentType === EventType.Meeting;

  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "block", marginBottom: "12px", fontWeight: "600", fontSize: "16px", color: "var(--hp-text)" }}>
        Тип события *
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", width: "100%", boxSizing: "border-box" }}>
        <button
          type="button"
          onClick={() => onChange(EventType.Practice)}
          style={{
            padding: "14px 8px",
            border: `2px solid ${isPractice ? "var(--hp-primary)" : "var(--hp-border)"}`,
            background: isPractice ? "var(--hp-primary-soft)" : "var(--hp-surface)",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            minHeight: "70px",
            width: "100%",
            boxSizing: "border-box",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (!isPractice) {
              e.currentTarget.style.backgroundColor = "var(--hp-surface-soft)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isPractice) {
              e.currentTarget.style.backgroundColor = "var(--hp-surface)";
            }
          }}
        >
          <span style={{ fontSize: "20px" }}>🏒</span>
          <span>Тренировка</span>
        </button>

        <button
          type="button"
          onClick={() => onChange(EventType.Game)}
          style={{
            padding: "14px 8px",
            border: `2px solid ${isGame ? "var(--hp-primary)" : "var(--hp-border)"}`,
            background: isGame ? "var(--hp-primary-soft)" : "var(--hp-surface)",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            minHeight: "70px",
            width: "100%",
            boxSizing: "border-box",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (!isGame) {
              e.currentTarget.style.backgroundColor = "var(--hp-surface-soft)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isGame) {
              e.currentTarget.style.backgroundColor = "var(--hp-surface)";
            }
          }}
        >
          <span style={{ fontSize: "20px" }}>⚽</span>
          <span>Матч</span>
        </button>

        <button
          type="button"
          onClick={() => onChange(EventType.Meeting)}
          style={{
            padding: "14px 8px",
            border: `2px solid ${isMeeting ? "var(--hp-primary)" : "var(--hp-border)"}`,
            background: isMeeting ? "var(--hp-primary-soft)" : "var(--hp-surface)",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            minHeight: "70px",
            width: "100%",
            boxSizing: "border-box",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (!isMeeting) {
              e.currentTarget.style.backgroundColor = "var(--hp-surface-soft)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isMeeting) {
              e.currentTarget.style.backgroundColor = "var(--hp-surface)";
            }
          }}
        >
          <span style={{ fontSize: "20px" }}>👥</span>
          <span>Встреча</span>
        </button>
      </div>
    </div>
  );
};
