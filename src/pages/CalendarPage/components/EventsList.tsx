import { EventLookUpDto, EventType } from "src/types/events";
import { getEventTypeColor, getLeagueColor } from "src/utils/colors";
import { formatRuDateWithoutTimeLabel } from "src/utils/date";
import { formatTime, getEventTypeName } from "src/pages/CalendarPage/utils";

interface EventsListProps {
  selectedDate: Date | null;
  events: EventLookUpDto[];
  onEventClick: (eventId: string) => void;
}

export function EventsList({ selectedDate, events, onEventClick }: EventsListProps) {
  if (!selectedDate) {
    return null;
  }

  return (
    <div style={{ backgroundColor: "var(--hp-surface)", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "var(--hp-shadow-sm)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "var(--hp-heading)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📅</span>
          <span>События {formatRuDateWithoutTimeLabel(selectedDate.toISOString())}</span>
        </h3>
        {events.length === 0 && <span style={{ fontSize: "14px", color: "var(--hp-muted)", backgroundColor: "var(--hp-surface-soft)", padding: "4px 12px", borderRadius: "20px" }}>Нет событий</span>}
      </div>

      {events.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => onEventClick(event.id)}
              onMouseEnter={(mouseEvent) => {
                mouseEvent.currentTarget.style.backgroundColor = "var(--hp-surface-hover)";
                mouseEvent.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(mouseEvent) => {
                mouseEvent.currentTarget.style.backgroundColor = "var(--hp-surface-soft)";
                mouseEvent.currentTarget.style.transform = "translateY(0)";
              }}
              style={{ padding: "16px", backgroundColor: "var(--hp-surface-soft)", border: "1px solid var(--hp-border)", borderRadius: "12px", cursor: "pointer", transition: "all 0.2s ease" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", color: "var(--hp-muted)", display: "flex", alignItems: "center", gap: "4px" }}>🕒 {formatTime(event.startTime)}</span>
                <span style={{ fontSize: "13px", color: "#fff", backgroundColor: getEventTypeColor(event.type as EventType), padding: "4px 12px", borderRadius: "20px", fontWeight: "500" }}>{getEventTypeName(event.type as EventType)}</span>
                {event.type === EventType.Game && event.leagueName && (
                  <span style={{ fontSize: "12px", color: "#fff", backgroundColor: getLeagueColor(event.leagueName), padding: "2px 8px", borderRadius: "10px", fontWeight: "500", opacity: 0.8 }}>🏆 {event.leagueName}</span>
                )}
              </div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "var(--hp-heading)", marginBottom: "8px" }}>{event.title}</div>
              {event.locationName && <div style={{ fontSize: "14px", color: "var(--hp-muted)", display: "flex", alignItems: "center", gap: "4px" }}>📍 {event.locationName}</div>}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "32px", textAlign: "center", color: "var(--hp-muted)", backgroundColor: "var(--hp-surface-soft)", border: "1px solid var(--hp-border)", borderRadius: "12px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>📅</div>
          <p style={{ margin: 0, fontSize: "16px" }}>В этот день нет запланированных мероприятий</p>
        </div>
      )}
    </div>
  );
}
