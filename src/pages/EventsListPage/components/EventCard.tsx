import { memo, useMemo } from "react";
import { EventLookUpDto, EventType } from "../../../types/events";
import { formatRuDateLabel } from "../../../utils/date";
import { getEventTypeColor, getLeagueColor } from "../../../utils/colors";

interface EventCardProps {
  event: EventLookUpDto;
  onOpen: (eventId: string) => void;
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

const getAttendanceStatusMeta = (attendanceStatus?: number | null) => {
  switch (attendanceStatus) {
    case 2:
      return { label: "Смогу", emoji: "✅", background: "#e8f5e9", color: "#2e7d32" };
    case 3:
      return { label: "Не смогу", emoji: "❌", background: "#ffebee", color: "#c62828" };
    case 1:
      return { label: "Ожидается ответ", emoji: "⏳", background: "#fff8e1", color: "#ef6c00" };
    default:
      return null;
  }
};

const EventCardComponent = ({ event, onOpen }: EventCardProps) => {
  const isToday = useMemo(() => {
    const eventDate = new Date(event.startTime);
    const eventDay = new Date(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate(),
    ).getTime();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    return eventDay === today;
  }, [event.startTime]);
  const attendanceStatusMeta = getAttendanceStatusMeta(event.attendanceStatus);

  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "16px",
        marginBottom: "12px",
        border: isToday ? "none" : "1px solid #e0e0e0",
        borderRadius: "14px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
        borderLeft: isToday ? "4px solid #1976d2" : "1px solid #e0e0e0",
      }}
      onClick={() => onOpen(event.id)}
      onMouseEnter={(elem) => {
        elem.currentTarget.style.backgroundColor = "#f9f9f9";
        elem.currentTarget.style.transform = "translateY(-2px)";
        elem.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(elem) => {
        elem.currentTarget.style.backgroundColor = "white";
        elem.currentTarget.style.transform = "translateY(0)";
        elem.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.04)";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "8px",
        }}
      >
        <h4
          style={{
            margin: "0",
            fontSize: "17px",
            fontWeight: "600",
            color: "#1a237e",
            lineHeight: "1.3",
            flex: 1,
          }}
        >
          {event.title ?? "Без названия"}
        </h4>
        <div
          style={{
            fontSize: "24px",
            color: "#1976d2",
            opacity: 0.7,
            marginLeft: "8px",
          }}
        >
          →
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "14px",
            color: isToday ? "#1976d2" : "#666",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontWeight: isToday ? "600" : "400",
          }}
        >
          🕒 {formatRuDateLabel(event.startTime)}
        </span>

        <span
          style={{
            fontSize: "12px",
            color: "#fff",
            backgroundColor: getEventTypeColor(event.type as EventType),
            padding: "2px 8px",
            borderRadius: "10px",
            fontWeight: "500",
          }}
        >
          {getEventTypeName(event.type as EventType)}
        </span>

        {event.type === EventType.Game && event.leagueName && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: getLeagueColor(event.leagueName),
              padding: "2px 10px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: "500",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <span style={{ fontSize: "12px" }}>🏆</span>
            <span>{event.leagueName}</span>
          </div>
        )}
      </div>
      
      {attendanceStatusMeta && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: attendanceStatusMeta.background,
              color: attendanceStatusMeta.color,
              padding: "4px 10px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            <span>{attendanceStatusMeta.emoji}</span>
            <span>{attendanceStatusMeta.label}</span>
          </div>
        </div>
      )}

      {event.locationName && (
        <div
          style={{
            fontSize: "14px",
            color: "#666",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "8px",
          }}
        >
          <span>📍</span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {event.locationName}
          </span>
        </div>
      )}
    </div>
  );
};

export const EventCard = memo(EventCardComponent);
