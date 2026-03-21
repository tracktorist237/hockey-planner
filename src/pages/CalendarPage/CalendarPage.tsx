import { useNavigate } from "react-router-dom";
import { CalendarHeader } from "src/pages/CalendarPage/components/CalendarHeader";
import { ErrorState } from "src/pages/CalendarPage/components/ErrorState";
import { EventsList } from "src/pages/CalendarPage/components/EventsList";
import { Legend } from "src/pages/CalendarPage/components/Legend";
import { LoadingState } from "src/pages/CalendarPage/components/LoadingState";
import { MonthView } from "src/pages/CalendarPage/components/MonthView";
import { WeekView } from "src/pages/CalendarPage/components/WeekView";
import { useCalendarData } from "src/pages/CalendarPage/hooks/useCalendarData";
import { useCalendarNavigation } from "src/pages/CalendarPage/hooks/useCalendarNavigation";

export function CalendarPage() {
  const navigate = useNavigate();
  const { viewMode, setViewMode, currentDate, selectedDate, setSelectedDate, isMobile, goPrev, goNext, goToday, selectDate } = useCalendarNavigation();
  const { loading, error, daysInMonth, firstDayOfMonth, weekDays, selectedDateEvents, getEventsForDate } = useCalendarData({ currentDate, selectedDate, onInitialDateSelect: setSelectedDate });

  if (loading) return <LoadingState text="Загрузка календаря..." />;
  if (error) return <ErrorState error={error} onBack={() => navigate("/events")} />;

  return (
    <div style={{ padding: 0, minHeight: "100vh", backgroundColor: "#f5f5f5", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", boxSizing: "border-box" }}>
      <CalendarHeader onBack={() => navigate("/events")} viewMode={viewMode} isMobile={isMobile} currentDate={currentDate} onViewModeChange={setViewMode} onPrev={goPrev} onNext={goNext} onToday={goToday} />
      <div style={{ padding: "16px", paddingBottom: "100px" }}>
        <Legend />
        <div style={{ backgroundColor: "white", borderRadius: "16px", padding: isMobile ? "12px" : "20px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          {viewMode === "month" ? (
            <MonthView currentDate={currentDate} selectedDate={selectedDate} isMobile={isMobile} daysInMonth={daysInMonth} firstDayOfMonth={firstDayOfMonth} getEventsForDate={getEventsForDate} onDayClick={selectDate} />
          ) : (
            <WeekView weekDays={weekDays} selectedDate={selectedDate} isMobile={isMobile} onDayClick={selectDate} />
          )}
        </div>
        <EventsList selectedDate={selectedDate} events={selectedDateEvents} onEventClick={(eventId) => navigate(`/events/${eventId}`)} />
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } @media (min-width: 768px) { div[style*="minHeight: 100vh"] { max-width: 800px; margin: 0 auto; border-left: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0; } } @supports (padding: max(0px)) { div[style*="position: sticky"] { padding-top: max(16px, env(safe-area-inset-top, 16px)); } }`}</style>
    </div>
  );
}

export default CalendarPage;
