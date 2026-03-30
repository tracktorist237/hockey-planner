import { EventDto, EventType } from "src/types/events";
import { getEventTypeColor, getLeagueColor } from "src/utils/colors";
import { formatRuDateLabel } from "src/utils/date";

interface EventInfoCardProps {
  event: EventDto;
  copySuccess: boolean;
  copyEventLink: () => void;
}

const getEventTypeName = (type: EventType): string => {
  switch (type) {
    case EventType.Practice:
      return "Тренировка";
    case EventType.Game:
      return "Матч";
    case EventType.Meeting:
      return "Встреча";
    default:
      return "Событие";
  }
};

export const EventInfoCard = ({ event, copySuccess, copyEventLink }: EventInfoCardProps) => {
  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "14px",
              color: "#fff",
              backgroundColor: getEventTypeColor(event.type as EventType),
              padding: "4px 12px",
              borderRadius: "20px",
              fontWeight: "600",
            }}
          >
            {getEventTypeName(event.type as EventType)}
          </span>
          <span
            style={{
              fontSize: "18px",
              color: "#666",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            🕒 {formatRuDateLabel(event.startTime)}
          </span>

          {event.type === EventType.Game && event.leagueName && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: getLeagueColor(event.leagueName),
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "500",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              <span style={{ fontSize: "14px" }}>🏆</span>
              <span>{event.leagueName}</span>
            </div>
          )}
        </div>
      </div>

      {event.type !== EventType.Game && (
        <h1
          style={{
            margin: "0 0 12px 0",
            fontSize: "22px",
            fontWeight: "700",
            color: "#1a237e",
          }}
        >
          {event.title}
        </h1>
      )}

      {event.type === EventType.Game && event.homeTeamName && event.awayTeamName && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "8px",
            marginBottom: "12px",
            padding: "12px 16px",
            backgroundColor: "#f8f9fa",
            borderRadius: "12px",
            border: "1px solid #e0e0e0",
          }}
        >
          <span style={{ fontSize: "18px", fontWeight: "700", color: "#1a237e", flex: 1, textAlign: "center" }}>
            {event.homeTeamName}
          </span>
          <span
            style={{
              fontSize: "14px",
              color: "#666",
              backgroundColor: "white",
              padding: "4px 12px",
              borderRadius: "16px",
              border: "1px solid #e0e0e0",
              fontWeight: "600",
            }}
          >
            VS
          </span>
          <span style={{ fontSize: "18px", fontWeight: "700", color: "#1a237e", flex: 1, textAlign: "center" }}>
            {event.awayTeamName}
          </span>
        </div>
      )}

      <div style={{ position: "relative" }}>
        <button
          onClick={copyEventLink}
          style={{
            width: "100%",
            padding: "8px 12px",
            backgroundColor: copySuccess ? "#4caf50" : "#f5f5f5",
            color: copySuccess ? "white" : "#666",
            border: "1px solid",
            borderColor: copySuccess ? "#4caf50" : "#e0e0e0",
            borderRadius: "8px",
            fontSize: "13px",
            cursor: "pointer",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (!copySuccess) {
              e.currentTarget.style.backgroundColor = "#e3f2fd";
              e.currentTarget.style.borderColor = "#1976d2";
              e.currentTarget.style.color = "#1976d2";
            }
          }}
          onMouseLeave={(e) => {
            if (!copySuccess) {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
              e.currentTarget.style.borderColor = "#e0e0e0";
              e.currentTarget.style.color = "#666";
            }
          }}
        >
          {copySuccess ? (
            <>
              <span>✓</span>
              <span>Скопировано!</span>
            </>
          ) : (
            <>
              <span>🔗</span>
              <span>Копировать ссылку</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
