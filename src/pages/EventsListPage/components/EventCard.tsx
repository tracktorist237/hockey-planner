import { memo, useMemo } from "react";
import { EventLookUpDto, EventType } from "../../../types/events";
import { formatRuDateLabel } from "../../../utils/date";
import { getEventTypeColor, getLeagueColor } from "../../../utils/colors";
import { ExternalLeagueBadge } from "src/components/ExternalLeagueBadge";
import { EventStatusBadge } from "src/components/EventStatusBadge";

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
      return { label: "Смогу", emoji: "✅", background: "var(--hp-success-soft)", color: "var(--hp-success)" };
    case 3:
      return { label: "Не смогу", emoji: "❌", background: "var(--hp-danger-soft)", color: "var(--hp-danger)" };
    case 1:
      return { label: "Ожидается ответ", emoji: "⏳", background: "var(--hp-warning-soft)", color: "var(--hp-warning)" };
    default:
      return null;
  }
};

const getGoalieStatusMeta = (goalieApplicationStatus?: number | null) => {
  switch (goalieApplicationStatus) {
    case 1:
      return { label: "Заявка ждёт решения", emoji: "🥅", background: "var(--hp-warning-soft)", color: "var(--hp-warning)" };
    case 2:
      return { label: "Заявка принята", emoji: "🥅", background: "var(--hp-primary-soft)", color: "var(--hp-primary-text)" };
    case 3:
      return { label: "Заявка отклонена", emoji: "🥅", background: "var(--hp-danger-soft)", color: "var(--hp-danger)" };
    case 4:
      return { label: "Вам предложили", emoji: "🥅", background: "var(--hp-purple-soft)", color: "var(--hp-purple)" };
    case 5:
      return { label: "Вы подтверждены", emoji: "🥅", background: "var(--hp-success-soft)", color: "var(--hp-success)" };
    case 6:
      return { label: "Вы отказались", emoji: "🥅", background: "var(--hp-danger-soft)", color: "var(--hp-danger)" };
    case 7:
      return { label: "Заявка отменена", emoji: "🥅", background: "var(--hp-surface-soft)", color: "var(--hp-muted)" };
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
  const goalieStatusMeta = getGoalieStatusMeta(event.goalieApplicationStatus);
  const attendanceStatusMeta = goalieStatusMeta ?? getAttendanceStatusMeta(event.attendanceStatus);
  const hasGoalieRequest =
    event.goalieNeededCount !== null &&
    event.goalieNeededCount !== undefined &&
    event.goalieNeededCount > 0;
  const goalieConfirmedCount = event.goalieConfirmedCount ?? 0;
  const hasScore = event.status === 3 && event.homeScore != null && event.awayScore != null;

  return (
    <div
      style={{
        backgroundColor: "var(--hp-surface)",
        padding: "16px",
        marginBottom: "12px",
        border: isToday ? "none" : "1px solid var(--hp-border)",
        borderRadius: "14px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: "var(--hp-shadow-sm)",
        borderLeft: isToday ? "4px solid var(--hp-primary)" : "1px solid var(--hp-border)",
      }}
      onClick={() => onOpen(event.id)}
      onMouseEnter={(elem) => {
        elem.currentTarget.style.backgroundColor = "var(--hp-surface-hover)";
        elem.currentTarget.style.transform = "translateY(-2px)";
        elem.currentTarget.style.boxShadow = "var(--hp-shadow-md)";
      }}
      onMouseLeave={(elem) => {
        elem.currentTarget.style.backgroundColor = "var(--hp-surface)";
        elem.currentTarget.style.transform = "translateY(0)";
        elem.currentTarget.style.boxShadow = "var(--hp-shadow-sm)";
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
            color: "var(--hp-heading)",
            lineHeight: "1.3",
            flex: 1,
          }}
        >
          {event.title ?? "Без названия"}
        </h4>
        <div
          style={{
            fontSize: "24px",
            color: "var(--hp-primary)",
            opacity: 0.7,
            marginLeft: "8px",
          }}
        >
          →
        </div>
      </div>

      {event.teamName && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            maxWidth: "100%",
            marginBottom: "8px",
            padding: "3px 8px",
            borderRadius: "999px",
            background: "var(--hp-surface-soft)",
            color: "var(--hp-muted)",
            border: "1px solid var(--hp-border)",
            fontSize: "11px",
            fontWeight: 800,
            lineHeight: 1.2,
          }}
          title={event.teamName}
        >
          <span style={{ color: "var(--hp-primary)", fontSize: "11px" }}>●</span>
          <span
            style={{
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {event.teamName}
          </span>
        </div>
      )}

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
            color: isToday ? "var(--hp-primary)" : "var(--hp-muted)",
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
        {event.externalLeagueProvider != null && <ExternalLeagueBadge provider={event.externalLeagueProvider} division={event.externalDivisionName} />}
        <EventStatusBadge status={event.status} />
      </div>

      {hasScore && event.homeTeamName && event.awayTeamName && (
        <div style={{ marginBottom: 8, color: "var(--hp-heading)", fontWeight: 800, overflowWrap: "anywhere" }}>
          {event.homeTeamName} {event.homeScore} : {event.awayScore} {event.awayTeamName}
        </div>
      )}
      
      {attendanceStatusMeta && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
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
          {hasGoalieRequest && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: goalieConfirmedCount >= (event.goalieNeededCount ?? 0) ? "var(--hp-success-soft)" : "var(--hp-primary-soft)",
                color: goalieConfirmedCount >= (event.goalieNeededCount ?? 0) ? "var(--hp-success)" : "var(--hp-primary-text)",
                padding: "4px 10px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: "700",
              }}
            >
              <span>🥅</span>
              <span>Вратари {goalieConfirmedCount}/{event.goalieNeededCount}</span>
            </div>
          )}
        </div>
      )}

      {!attendanceStatusMeta && hasGoalieRequest && (
        <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: goalieConfirmedCount >= (event.goalieNeededCount ?? 0) ? "var(--hp-success-soft)" : "var(--hp-primary-soft)",
              color: goalieConfirmedCount >= (event.goalieNeededCount ?? 0) ? "var(--hp-success)" : "var(--hp-primary-text)",
              padding: "4px 10px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: "700",
            }}
          >
            <span>🥅</span>
            <span>Вратари {goalieConfirmedCount}/{event.goalieNeededCount}</span>
          </div>
        </div>
      )}

      {event.locationName && (
        <div
          style={{
            fontSize: "14px",
            color: "var(--hp-muted)",
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
              whiteSpace: "normal",
              overflowWrap: "anywhere",
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
