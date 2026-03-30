import { WeekDayData } from "src/pages/CalendarPage/types";
import { DAY_NAMES, getUniqueEventColors, isSameDay } from "src/pages/CalendarPage/utils";

interface WeekViewProps {
  weekDays: WeekDayData[];
  selectedDate: Date | null;
  isMobile: boolean;
  onDayClick: (date: Date) => void;
}

export function WeekView({ weekDays, selectedDate, isMobile, onDayClick }: WeekViewProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: isMobile ? "2px" : "4px", marginBottom: "8px" }}>
        {weekDays.map((day, index) => {
          const eventColors = getUniqueEventColors(day.events);
          const isToday = isSameDay(day.date, new Date());
          const isSelected = selectedDate ? isSameDay(day.date, selectedDate) : false;

          return (
            <div key={index} onClick={() => onDayClick(day.date)} style={{ textAlign: "center", padding: isMobile ? "8px 4px" : "16px 8px", backgroundColor: isSelected ? "#bbdefb" : isToday ? "#e3f2fd" : "white", border: `2px solid ${isSelected || isToday ? "#1976d2" : "#e0e0e0"}`, borderRadius: "12px", cursor: "pointer", transition: "all 0.2s ease" }}>
              <div style={{ fontSize: isMobile ? "12px" : "14px", fontWeight: isToday || isSelected ? "700" : "500", color: isToday || isSelected ? "#1976d2" : "#333", marginBottom: "4px" }}>{isMobile ? DAY_NAMES[index].slice(0, 2) : DAY_NAMES[index]}</div>
              <div style={{ fontSize: isMobile ? "16px" : "20px", fontWeight: "600", marginBottom: "4px" }}>{day.date.getDate()}</div>

              {isMobile ? (
                <div style={{ display: "flex", gap: "2px", justifyContent: "center" }}>
                  {eventColors.slice(0, 3).map((color, colorIndex) => (
                    <div key={colorIndex} style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color, display: "inline-block" }} />
                  ))}
                  {eventColors.length > 3 && <span style={{ fontSize: "10px", color: "#666" }}>+{eventColors.length - 3}</span>}
                </div>
              ) : (
                day.events.length > 0 && <div style={{ fontSize: "12px", backgroundColor: "#1976d2", color: "white", padding: "2px 8px", borderRadius: "12px", display: "inline-block" }}>{day.events.length}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
