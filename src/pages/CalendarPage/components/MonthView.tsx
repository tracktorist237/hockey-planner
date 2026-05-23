import { EventLookUpDto, EventType } from "src/types/events";
import { getEventTypeColor } from "src/utils/colors";
import { DAY_NAMES, formatTime, getUniqueEventColors, isSameDay } from "src/pages/CalendarPage/utils";

interface MonthViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  isMobile: boolean;
  daysInMonth: number;
  firstDayOfMonth: number;
  getEventsForDate: (date: Date) => EventLookUpDto[];
  onDayClick: (date: Date) => void;
}

export function MonthView({ currentDate, selectedDate, isMobile, daysInMonth, firstDayOfMonth, getEventsForDate, onDayClick }: MonthViewProps) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: isMobile ? "2px" : "4px", marginBottom: "8px" }}>
        {DAY_NAMES.map((day) => (
          <div key={day} style={{ textAlign: "center", fontSize: isMobile ? "12px" : "14px", fontWeight: "600", color: "var(--hp-muted)", padding: isMobile ? "4px" : "8px" }}>
            {isMobile ? day.slice(0, 2) : day}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: isMobile ? "2px" : "4px" }}>
        {Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }).map((_, index) => (
          <div key={`empty-${index}`} style={{ aspectRatio: "1", backgroundColor: "#fafafa", borderRadius: "8px", opacity: 0.5 }} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const dayEvents = getEventsForDate(date);
          const isToday = isSameDay(date, new Date());
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const eventColors = getUniqueEventColors(dayEvents);
          const dayBackground = isSelected ? "var(--hp-primary)" : isToday ? "var(--hp-primary-soft)" : "var(--hp-surface)";
          const dayBorder = isSelected ? "var(--hp-primary)" : isToday ? "var(--hp-primary)" : "var(--hp-border)";
          const dayTextColor = isSelected ? "white" : isToday ? "var(--hp-primary)" : "var(--hp-text)";

          return (
            <div key={day} onClick={() => onDayClick(date)} style={{ aspectRatio: "1", padding: isMobile ? "4px" : "8px", backgroundColor: dayBackground, border: `2px solid ${dayBorder}`, borderRadius: "8px", display: "flex", flexDirection: "column", cursor: "pointer", transition: "all 0.2s ease", position: "relative", boxShadow: isSelected ? "var(--hp-shadow-sm)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? "2px" : "4px" }}>
                <span style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: isToday || isSelected ? "700" : "500", color: dayTextColor }}>{day}</span>
              </div>

              {isMobile ? (
                <div style={{ display: "flex", gap: "2px", flexWrap: "wrap", marginTop: "2px" }}>
                  {eventColors.slice(0, 3).map((color, colorIndex) => (
                    <div key={colorIndex} style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color, display: "inline-block" }} />
                  ))}
                  {eventColors.length > 3 && <span style={{ fontSize: "8px", color: isSelected ? "white" : "var(--hp-muted)" }}>+{eventColors.length - 3}</span>}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {dayEvents.slice(0, 3).map((event) => (
                    <div key={event.id} style={{ fontSize: "11px", padding: "2px 4px", backgroundColor: `${getEventTypeColor(event.type as EventType)}20`, borderLeft: `3px solid ${getEventTypeColor(event.type as EventType)}`, borderRadius: "4px", whiteSpace: "nowrap", overflow: "hidden", color: "var(--hp-text)", fontWeight: "500" }}>
                      {formatTime(event.startTime)} {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div style={{ fontSize: "10px", color: isSelected ? "white" : "var(--hp-muted)", paddingLeft: "4px" }}>+{dayEvents.length - 3} событий</div>}
                </div>
              )}

              {!isMobile && dayEvents.length > 0 && (
                <span style={{ position: "absolute", top: "4px", right: "4px", fontSize: "10px", backgroundColor: "var(--hp-primary)", color: "white", padding: "2px 6px", borderRadius: "10px", minWidth: "20px", textAlign: "center" }}>{dayEvents.length}</span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
