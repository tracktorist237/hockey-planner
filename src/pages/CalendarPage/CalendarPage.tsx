import { useNavigate } from "react-router-dom";
import { BottomNav } from "src/components/BottomNav";
import { useAuth } from "src/hooks/useAuth";
import { useCurrentTeam } from "src/hooks/useCurrentTeam";
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
  const { currentUser } = useAuth();
  const { teamId: currentTeamId } = useCurrentTeam(currentUser?.id ?? null);
  const { viewMode, setViewMode, currentDate, selectedDate, setSelectedDate, isMobile, goPrev, goNext, goToday, selectDate } = useCalendarNavigation();
  const { loading, error, daysInMonth, firstDayOfMonth, weekDays, selectedDateEvents, getEventsForDate } = useCalendarData({
    currentDate,
    selectedDate,
    currentUserId: currentUser?.id,
    teamId: currentTeamId,
    onInitialDateSelect: setSelectedDate,
  });

  if (loading) {
    return <LoadingState text="Загрузка календаря..." />;
  }

  if (error) {
    return <ErrorState error={error} onBack={() => navigate("/events")} />;
  }

  return (
    <div style={{ padding: 0, minHeight: "100vh", background: "var(--hp-bg-gradient)", color: "var(--hp-text)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", boxSizing: "border-box" }}>
      <CalendarHeader onBack={() => navigate("/events")} viewMode={viewMode} isMobile={isMobile} currentDate={currentDate} onViewModeChange={setViewMode} onPrev={goPrev} onNext={goNext} onToday={goToday} />
      <div style={{ padding: "16px", paddingBottom: "120px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px",
            padding: "4px",
            marginBottom: "16px",
            borderRadius: "14px",
            backgroundColor: "var(--hp-surface-soft)",
            border: "1px solid var(--hp-border)",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/events")}
            style={{
              border: "1px solid transparent",
              borderRadius: "11px",
              padding: "10px",
              backgroundColor: "transparent",
              color: "var(--hp-muted)",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Списком
          </button>
          <button
            type="button"
            style={{
              border: "1px solid var(--hp-primary)",
              borderRadius: "11px",
              padding: "10px",
              backgroundColor: "var(--hp-surface)",
              color: "var(--hp-heading)",
              boxShadow: "var(--hp-shadow-sm)",
              fontWeight: 900,
              cursor: "default",
            }}
          >
            Календарём
          </button>
        </div>
        <Legend />
        <div style={{ backgroundColor: "var(--hp-surface)", borderRadius: "16px", padding: isMobile ? "12px" : "20px", marginBottom: "20px", boxShadow: "var(--hp-shadow-sm)" }}>
          {viewMode === "month" ? (
            <MonthView currentDate={currentDate} selectedDate={selectedDate} isMobile={isMobile} daysInMonth={daysInMonth} firstDayOfMonth={firstDayOfMonth} getEventsForDate={getEventsForDate} onDayClick={selectDate} />
          ) : (
            <WeekView weekDays={weekDays} selectedDate={selectedDate} isMobile={isMobile} onDayClick={selectDate} />
          )}
        </div>
        <EventsList selectedDate={selectedDate} events={selectedDateEvents} onEventClick={(eventId) => navigate(`/events/${eventId}`)} />
      </div>
      <BottomNav activeTab="events" />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } @media (min-width: 768px) { div[style*="minHeight: 100vh"] { max-width: 800px; margin: 0 auto; border-left: 1px solid var(--hp-border); border-right: 1px solid var(--hp-border); } } @supports (padding: max(0px)) { div[style*="position: sticky"] { padding-top: max(16px, env(safe-area-inset-top, 16px)); } }`}</style>
    </div>
  );
}

export default CalendarPage;
