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
      <div style={{ display: "block", marginBottom: "12px", fontWeight: "600", fontSize: "16px", color: "#333" }}>
        Тип события *
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", width: "100%", boxSizing: "border-box" }}>
        <button
          type="button"
          onClick={() => onChange(EventType.Practice)}
          style={{
            padding: "14px 8px",
            border: `2px solid ${isPractice ? "#1976d2" : "#e0e0e0"}`,
            background: isPractice ? "#e3f2fd" : "#fff",
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
              e.currentTarget.style.backgroundColor = "#f5f5f5";
            }
          }}
          onMouseLeave={(e) => {
            if (!isPractice) {
              e.currentTarget.style.backgroundColor = "#fff";
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
            border: `2px solid ${isGame ? "#1976d2" : "#e0e0e0"}`,
            background: isGame ? "#e3f2fd" : "#fff",
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
              e.currentTarget.style.backgroundColor = "#f5f5f5";
            }
          }}
          onMouseLeave={(e) => {
            if (!isGame) {
              e.currentTarget.style.backgroundColor = "#fff";
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
            border: `2px solid ${isMeeting ? "#1976d2" : "#e0e0e0"}`,
            background: isMeeting ? "#e3f2fd" : "#fff",
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
              e.currentTarget.style.backgroundColor = "#f5f5f5";
            }
          }}
          onMouseLeave={(e) => {
            if (!isMeeting) {
              e.currentTarget.style.backgroundColor = "#fff";
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
