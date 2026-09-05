import { EventDto, EventType } from "src/types/events";
import { getEventTypeColor, getLeagueColor } from "src/utils/colors";
import { formatRuDateLabel } from "src/utils/date";
import { ExternalLeagueBadge } from "src/components/ExternalLeagueBadge";
import { EventStatusBadge } from "src/components/EventStatusBadge";

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

const formatDuration = (durationMinutes?: number | null): string => {
  const totalMinutes = durationMinutes && durationMinutes > 0 ? durationMinutes : 75;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return [hours ? `${hours} ч` : "", minutes ? `${minutes} мин` : ""].filter(Boolean).join(" ");
};

export const EventInfoCard = ({ event, copySuccess, copyEventLink }: EventInfoCardProps) => {
  const hasScore = event.homeScore != null && event.awayScore != null;
  return (
    <div
      style={{
        backgroundColor: "var(--hp-surface)",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: "var(--hp-shadow-sm)",
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
          {event.externalLeagueProvider != null && <ExternalLeagueBadge provider={event.externalLeagueProvider} division={event.externalDivisionName} />}
          <EventStatusBadge status={event.status} />
          <span
            style={{
              fontSize: "18px",
              color: "var(--hp-muted)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            🕒 {formatRuDateLabel(event.startTime)}
          </span>
          <span
            style={{
              fontSize: "14px",
              color: "var(--hp-muted)",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 9px",
              borderRadius: "10px",
              backgroundColor: "var(--hp-surface-soft)",
            }}
          >
            ⏱ {formatDuration(event.durationMinutes)}
          </span>

          {event.teamName && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                maxWidth: "100%",
                padding: "4px 10px",
                borderRadius: "999px",
                background: "var(--hp-surface-soft)",
                color: "var(--hp-muted)",
                border: "1px solid var(--hp-border)",
                fontSize: "12px",
                fontWeight: 800,
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
            </span>
          )}

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
            color: "var(--hp-heading)",
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
            backgroundColor: "var(--hp-surface-soft)",
            borderRadius: "12px",
            border: "1px solid var(--hp-border)",
          }}
        >
          <span style={{ fontSize: "18px", fontWeight: "700", color: "var(--hp-heading)", flex: 1, textAlign: "center" }}>
            {event.homeTeamName}
          </span>
          <span
            style={{
              fontSize: "14px",
              color: "var(--hp-muted)",
              backgroundColor: "var(--hp-surface)",
              padding: "4px 12px",
              borderRadius: "16px",
              border: "1px solid var(--hp-border)",
              fontWeight: "600",
            }}
          >
            {hasScore ? `${event.homeScore} : ${event.awayScore}` : "VS"}
          </span>
          <span style={{ fontSize: "18px", fontWeight: "700", color: "var(--hp-heading)", flex: 1, textAlign: "center" }}>
            {event.awayTeamName}
          </span>
        </div>
      )}

      {event.externalLeagueProvider != null && (event.externalTournamentName || event.spbhlMatchUrl) && (
        <div data-testid="external-match-details" style={{ display: "grid", gap: 8, marginBottom: 12, padding: 12, borderRadius: 10, border: "1px solid var(--hp-border)", background: "var(--hp-surface-soft)" }}>
          {event.externalTournamentName && <div><strong>Турнир:</strong> {event.externalTournamentName}</div>}
          {event.spbhlMatchUrl && (
            <a href={event.spbhlMatchUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--hp-primary)", fontWeight: 800 }}>
              Официальный матч СПбХЛ ↗
            </a>
          )}
        </div>
      )}

      <div style={{ position: "relative" }}>
        <button
          onClick={copyEventLink}
          style={{
            width: "100%",
            padding: "8px 12px",
            backgroundColor: copySuccess ? "#4caf50" : "var(--hp-surface-soft)",
            color: copySuccess ? "white" : "var(--hp-muted)",
            border: "1px solid",
            borderColor: copySuccess ? "#4caf50" : "var(--hp-border)",
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
              e.currentTarget.style.backgroundColor = "var(--hp-primary-soft)";
              e.currentTarget.style.borderColor = "var(--hp-primary)";
              e.currentTarget.style.color = "var(--hp-primary-text)";
            }
          }}
          onMouseLeave={(e) => {
            if (!copySuccess) {
              e.currentTarget.style.backgroundColor = "var(--hp-surface-soft)";
              e.currentTarget.style.borderColor = "var(--hp-border)";
              e.currentTarget.style.color = "var(--hp-muted)";
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
