import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyTeams } from "src/api/teams";
import { BottomNav } from "src/components/BottomNav";
import { LoadingIndicator } from "src/components/LoadingIndicator";
import { NotificationBell } from "src/components/NotificationBell";
import { CurrentPlayerHeader } from "src/CurrentPlayerHeader";
import { EventsList as CalendarEventsList } from "src/pages/CalendarPage/components/EventsList";
import { Legend } from "src/pages/CalendarPage/components/Legend";
import { MonthView } from "src/pages/CalendarPage/components/MonthView";
import { WeekView } from "src/pages/CalendarPage/components/WeekView";
import { useCalendarNavigation } from "src/pages/CalendarPage/hooks/useCalendarNavigation";
import { ViewMode } from "src/pages/CalendarPage/types";
import { getPeriodLabel } from "src/pages/CalendarPage/utils";
import { EventLookUpDto, EventType } from "src/types/events";
import { TeamDto } from "src/types/teams";
import { User } from "src/types/user";
import { EventCard } from "./components/EventCard";
import { useEventsData } from "./hooks/useEventsData";

interface EventsListPageProps {
  currentUser: User | null;
  currentTeamId: string | null;
  currentTeamName: string | null;
  onTeamChange: (teamId: string | null, teamName?: string | null) => void;
}

type EventsView = "list" | "calendar";
type QuickFilter = "unanswered" | "games" | "practices" | "today";

interface AdvancedFilters {
  dateFrom: string;
  dateTo: string;
}

const emptyAdvancedFilters: AdvancedFilters = {
  dateFrom: "",
  dateTo: "",
};

const quickFilterItems: Array<{ key: QuickFilter; label: string }> = [
  { key: "unanswered", label: "Без ответа" },
  { key: "games", label: "Матчи" },
  { key: "practices", label: "Тренировки" },
  { key: "today", label: "Сегодня" },
];

const isSameLocalDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const isUnanswered = (event: EventLookUpDto) =>
  event.attendanceStatus === 1 ||
  event.attendanceStatus === null ||
  event.attendanceStatus === undefined;

const getActiveFiltersCount = (filters: AdvancedFilters) =>
  [filters.dateFrom, filters.dateTo].filter(Boolean).length;

interface EventsViewSwitcherProps {
  activeView: EventsView;
  onViewChange: (view: EventsView) => void;
}

function EventsViewSwitcher({ activeView, onViewChange }: EventsViewSwitcherProps) {
  const renderButton = (view: EventsView, label: string) => {
    const isActive = activeView === view;

    return (
      <button
        type="button"
        onClick={() => onViewChange(view)}
        style={{
          border: isActive ? "1px solid var(--hp-primary)" : "1px solid transparent",
          borderRadius: "11px",
          padding: "10px",
          backgroundColor: isActive ? "var(--hp-surface)" : "transparent",
          color: isActive ? "var(--hp-heading)" : "var(--hp-muted)",
          boxShadow: isActive ? "var(--hp-shadow-sm)" : "none",
          fontWeight: isActive ? 900 : 800,
          cursor: isActive ? "default" : "pointer",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "4px",
        padding: "4px",
        marginTop: "12px",
        borderRadius: "14px",
        backgroundColor: "var(--hp-surface-soft)",
        border: "1px solid var(--hp-border)",
      }}
    >
      {renderButton("list", "Списком")}
      {renderButton("calendar", "Календарём")}
    </div>
  );
}

interface EventsCalendarViewProps {
  events: EventLookUpDto[];
  onOpenEvent: (eventId: string) => void;
}

function EventsCalendarView({ events, onOpenEvent }: EventsCalendarViewProps) {
  const { viewMode, setViewMode, currentDate, selectedDate, setSelectedDate, isMobile, goPrev, goNext, goToday, selectDate } = useCalendarNavigation();

  useEffect(() => {
    setSelectedDate((date) => date ?? new Date());
  }, [setSelectedDate]);

  const daysInMonth = useMemo(
    () => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(),
    [currentDate],
  );

  const firstDayOfMonth = useMemo(
    () => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(),
    [currentDate],
  );

  const getEventsForDate = useCallback(
    (date: Date): EventLookUpDto[] =>
      events.filter((event) => {
        const eventDate = new Date(event.startTime);
        return (
          eventDate.getDate() === date.getDate() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear()
        );
      }),
    [events],
  );

  const weekDays = useMemo(() => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return {
        date,
        events: getEventsForDate(date),
      };
    });
  }, [currentDate, getEventsForDate]);

  const selectedDateEvents = useMemo(
    () => (selectedDate ? getEventsForDate(selectedDate) : []),
    [getEventsForDate, selectedDate],
  );

  const renderModeButton = (mode: ViewMode, label: string) => {
    const isActive = viewMode === mode;

    return (
      <button
        type="button"
        onClick={() => setViewMode(mode)}
        style={{
          padding: "10px 20px",
          backgroundColor: isActive ? "var(--hp-primary)" : "var(--hp-surface-soft)",
          color: isActive ? "white" : "var(--hp-text)",
          border: "1px solid var(--hp-border)",
          borderRadius: "10px",
          fontSize: "15px",
          fontWeight: isActive ? "600" : "500",
          cursor: "pointer",
          flex: isMobile ? 1 : "auto",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      <div style={{ backgroundColor: "var(--hp-surface)", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "var(--hp-shadow-sm)" }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", justifyContent: "space-between", gap: isMobile ? "16px" : "12px" }}>
          <div style={{ display: "flex", gap: "8px", width: isMobile ? "100%" : "auto" }}>
            {renderModeButton("month", "Месяц")}
            {renderModeButton("week", "Неделя")}
          </div>

          <div style={{ display: "flex", gap: "8px", width: isMobile ? "100%" : "auto" }}>
            <button type="button" onClick={goPrev} style={{ padding: "10px 16px", backgroundColor: "var(--hp-surface)", border: "1px solid var(--hp-border)", borderRadius: "10px", fontSize: "14px", cursor: "pointer", flex: isMobile ? 1 : "auto" }}>←</button>
            <button type="button" onClick={goToday} style={{ padding: "10px 16px", backgroundColor: "var(--hp-primary)", color: "white", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "500", cursor: "pointer", flex: isMobile ? 2 : "auto" }}>Сегодня</button>
            <button type="button" onClick={goNext} style={{ padding: "10px 16px", backgroundColor: "var(--hp-surface)", border: "1px solid var(--hp-border)", borderRadius: "10px", fontSize: "14px", cursor: "pointer", flex: isMobile ? 1 : "auto" }}>→</button>
          </div>
        </div>

        <div style={{ marginTop: "16px", textAlign: "center", fontSize: isMobile ? "18px" : "22px", fontWeight: "600", color: "var(--hp-heading)" }}>
          {getPeriodLabel(viewMode, currentDate)}
        </div>
      </div>

      <Legend />
      <div style={{ backgroundColor: "var(--hp-surface)", borderRadius: "16px", padding: isMobile ? "12px" : "20px", marginBottom: "20px", boxShadow: "var(--hp-shadow-sm)" }}>
        {viewMode === "month" ? (
          <MonthView currentDate={currentDate} selectedDate={selectedDate} isMobile={isMobile} daysInMonth={daysInMonth} firstDayOfMonth={firstDayOfMonth} getEventsForDate={getEventsForDate} onDayClick={selectDate} />
        ) : (
          <WeekView weekDays={weekDays} selectedDate={selectedDate} isMobile={isMobile} onDayClick={selectDate} />
        )}
      </div>
      <CalendarEventsList selectedDate={selectedDate} events={selectedDateEvents} onEventClick={onOpenEvent} />
    </>
  );
}

interface EventsFiltersProps {
  activeQuickFilters: QuickFilter[];
  onQuickFilterToggle: (filter: QuickFilter) => void;
  onClearFilters: () => void;
  advancedFilters: AdvancedFilters;
  onAdvancedFiltersChange: (filters: AdvancedFilters) => void;
  teams: TeamDto[];
  currentTeamId: string | null;
  onTeamChange: (teamId: string | null, teamName?: string | null) => void;
}

function EventsFilters({
  activeQuickFilters,
  onQuickFilterToggle,
  onClearFilters,
  advancedFilters,
  onAdvancedFiltersChange,
  teams,
  currentTeamId,
  onTeamChange,
}: EventsFiltersProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const advancedCount = getActiveFiltersCount(advancedFilters);
  const hasAdvancedFilters = advancedCount > 0 || Boolean(currentTeamId);
  const orderedQuickFilters = useMemo(
    () => [
      ...quickFilterItems.filter((item) => activeQuickFilters.includes(item.key)),
      ...quickFilterItems.filter((item) => !activeQuickFilters.includes(item.key)),
    ],
    [activeQuickFilters],
  );

  const isQuickActive = (filter: QuickFilter) => activeQuickFilters.includes(filter);
  const chipStyle = (active: boolean) => ({
    border: active ? "1px solid var(--hp-primary)" : "1px solid var(--hp-border)",
    borderRadius: "999px",
    padding: "9px 13px",
    backgroundColor: active ? "var(--hp-primary)" : "var(--hp-surface)",
    color: active ? "white" : "var(--hp-text)",
    fontSize: "13px",
    fontWeight: 800,
    whiteSpace: "nowrap" as const,
    cursor: "pointer",
    boxShadow: active ? "var(--hp-shadow-sm)" : "none",
    flexShrink: 0,
  });

  const updateAdvancedFilter = <K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => {
    onAdvancedFiltersChange({ ...advancedFilters, [key]: value });
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          padding: "2px 0 4px",
          marginTop: "12px",
          scrollbarWidth: "none",
        }}
      >
        <button type="button" onClick={onClearFilters} style={chipStyle(activeQuickFilters.length === 0 && !hasAdvancedFilters)}>
          Все
        </button>
        {hasAdvancedFilters && (
          <button
            type="button"
            onClick={() => setIsSheetOpen(true)}
            style={{
              ...chipStyle(false),
              marginLeft: "2px",
              backgroundColor: "var(--hp-primary-soft)",
              borderColor: "var(--hp-primary)",
              color: "var(--hp-primary-text)",
              boxShadow: "var(--hp-shadow-sm)",
            }}
          >
            Фильтры{advancedCount > 0 ? ` ${advancedCount}` : ""}
          </button>
        )}
        {orderedQuickFilters.map((item) => (
          <button key={item.key} type="button" onClick={() => onQuickFilterToggle(item.key)} style={chipStyle(isQuickActive(item.key))}>
            {item.label}
          </button>
        ))}
        {!hasAdvancedFilters && (
          <button
            type="button"
            onClick={() => setIsSheetOpen(true)}
            style={{
              ...chipStyle(false),
              marginLeft: "2px",
              backgroundColor: "var(--hp-surface)",
              borderColor: "var(--hp-border)",
              color: "var(--hp-heading)",
            }}
          >
            Фильтры
          </button>
        )}
      </div>

      {isSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            backgroundColor: "rgba(15, 23, 42, 0.42)",
            display: "flex",
            alignItems: "flex-end",
          }}
          onClick={() => setIsSheetOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "600px",
              margin: "0 auto",
              backgroundColor: "var(--hp-surface)",
              borderRadius: "22px 22px 0 0",
              padding: "12px 16px 24px",
              boxShadow: "0 -18px 50px rgba(15, 23, 42, 0.25)",
              border: "1px solid var(--hp-border)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ width: "42px", height: "4px", borderRadius: "999px", backgroundColor: "var(--hp-border)", margin: "0 auto 14px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "14px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", color: "var(--hp-heading)" }}>Фильтры</h2>
              <button type="button" onClick={() => setIsSheetOpen(false)} style={{ border: "none", background: "transparent", color: "var(--hp-muted)", fontSize: "24px", cursor: "pointer", lineHeight: 1 }}>
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              <label style={{ display: "grid", gap: "6px", color: "var(--hp-heading)", fontSize: "13px", fontWeight: 800 }}>
                Команда
                <select
                  value={currentTeamId ?? ""}
                  onChange={(event) => {
                    const nextTeamId = event.target.value || null;
                    const selectedTeam = teams.find((team) => team.id === nextTeamId);
                    onTeamChange(nextTeamId, selectedTeam?.name ?? null);
                  }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid var(--hp-border)",
                    backgroundColor: "var(--hp-input-bg)",
                    color: "var(--hp-text)",
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  <option value="">Все мероприятия</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label style={{ display: "grid", gap: "6px", color: "var(--hp-heading)", fontSize: "13px", fontWeight: 800 }}>
                  С даты
                  <input type="date" value={advancedFilters.dateFrom} onChange={(event) => updateAdvancedFilter("dateFrom", event.target.value)} style={{ padding: "12px", borderRadius: "12px", border: "1px solid var(--hp-border)", backgroundColor: "var(--hp-input-bg)", color: "var(--hp-text)" }} />
                </label>
                <label style={{ display: "grid", gap: "6px", color: "var(--hp-heading)", fontSize: "13px", fontWeight: 800 }}>
                  По дату
                  <input type="date" value={advancedFilters.dateTo} onChange={(event) => updateAdvancedFilter("dateTo", event.target.value)} style={{ padding: "12px", borderRadius: "12px", border: "1px solid var(--hp-border)", backgroundColor: "var(--hp-input-bg)", color: "var(--hp-text)" }} />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => {
                    onAdvancedFiltersChange(emptyAdvancedFilters);
                    onTeamChange(null, null);
                  }}
                  style={{ padding: "13px", borderRadius: "12px", border: "1px solid var(--hp-border)", backgroundColor: "var(--hp-surface-soft)", color: "var(--hp-text)", fontWeight: 800, cursor: "pointer" }}
                >
                  Сбросить
                </button>
                <button type="button" onClick={() => setIsSheetOpen(false)} style={{ padding: "13px", borderRadius: "12px", border: "none", backgroundColor: "var(--hp-primary)", color: "white", fontWeight: 900, cursor: "pointer" }}>
                  Готово
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const EventsListPage = ({
  currentUser,
  currentTeamId,
  onTeamChange,
}: EventsListPageProps) => {
  const navigate = useNavigate();
  const { events, loading, error, reloadEvents } = useEventsData(currentUser?.id, currentTeamId);
  const [canManageTeamEvents, setCanManageTeamEvents] = useState(false);
  const [eventsView, setEventsView] = useState<EventsView>("list");
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [activeQuickFilters, setActiveQuickFilters] = useState<QuickFilter[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(emptyAdvancedFilters);
  const [isCreateFabVisible, setIsCreateFabVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const canCreateEvents = canManageTeamEvents;

  const loadTeams = useCallback(async () => {
    if (!currentUser?.id) {
      setCanManageTeamEvents(false);
      setTeams([]);
      return;
    }

    try {
      const loadedTeams = await getMyTeams(currentUser.id);
      setTeams(loadedTeams);
      setCanManageTeamEvents(loadedTeams.some((team) => team.myRole === 1 || team.myRole === 2));
    } catch (error) {
      console.error(error);
      setTeams([]);
      setCanManageTeamEvents(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    if (!canCreateEvents) {
      return;
    }

    lastScrollYRef.current = window.scrollY;

    const handleScroll = () => {
      const nextScrollY = window.scrollY;
      const delta = nextScrollY - lastScrollYRef.current;

      if (nextScrollY < 40) {
        setIsCreateFabVisible(true);
      } else if (delta > 8) {
        setIsCreateFabVisible(false);
      } else if (delta < -8) {
        setIsCreateFabVisible(true);
      }

      lastScrollYRef.current = Math.max(nextScrollY, 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [canCreateEvents]);

  const handleOpenEvent = useCallback(
    (eventId: string) => {
      navigate(`/events/${eventId}`);
    },
    [navigate],
  );

  const handleEventsViewChange = useCallback(
    (view: EventsView) => {
      if (view === eventsView) {
        return;
      }

      setEventsView(view);
    },
    [eventsView],
  );

  const handleQuickFilterToggle = useCallback((filter: QuickFilter) => {
    setActiveQuickFilters((filters) =>
      filters.includes(filter)
        ? filters.filter((item) => item !== filter)
        : [...filters, filter],
    );
  }, []);

  const filteredEvents = useMemo(() => {
    const today = new Date();
    const fromDate = advancedFilters.dateFrom ? new Date(`${advancedFilters.dateFrom}T00:00:00`) : null;
    const toDate = advancedFilters.dateTo ? new Date(`${advancedFilters.dateTo}T23:59:59`) : null;

    return events.filter((event) => {
      const eventDate = new Date(event.startTime);

      if (activeQuickFilters.includes("unanswered") && !isUnanswered(event)) {
        return false;
      }

      if (activeQuickFilters.includes("games") && event.type !== EventType.Game) {
        return false;
      }

      if (activeQuickFilters.includes("practices") && event.type !== EventType.Practice) {
        return false;
      }

      if (activeQuickFilters.includes("today") && !isSameLocalDay(eventDate, today)) {
        return false;
      }

      if (fromDate && eventDate < fromDate) {
        return false;
      }

      if (toDate && eventDate > toDate) {
        return false;
      }

      return true;
    });
  }, [activeQuickFilters, advancedFilters, events]);

  const hasAnyFilter =
    activeQuickFilters.length > 0 ||
    currentTeamId !== null ||
    getActiveFiltersCount(advancedFilters) > 0;

  return (
    <div
      style={{
        padding: "0",
        minHeight: "100vh",
        background: "var(--hp-bg-gradient)",
        color: "var(--hp-text)",
        boxSizing: "border-box",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--hp-surface)",
          padding: "16px",
          borderBottom: "1px solid var(--hp-border)",
          boxShadow: "var(--hp-shadow-sm)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <h1
            style={{
              margin: "0",
              fontSize: "20px",
              fontWeight: "600",
              color: "var(--hp-heading)",
            }}
          >
            Мероприятия
          </h1>
          <NotificationBell currentUserId={currentUser?.id} />
        </div>

        <CurrentPlayerHeader />
        <EventsFilters
          activeQuickFilters={activeQuickFilters}
          onQuickFilterToggle={handleQuickFilterToggle}
          onClearFilters={() => {
            setActiveQuickFilters([]);
            setAdvancedFilters(emptyAdvancedFilters);
            onTeamChange(null, null);
          }}
          advancedFilters={advancedFilters}
          onAdvancedFiltersChange={setAdvancedFilters}
          teams={teams}
          currentTeamId={currentTeamId}
          onTeamChange={onTeamChange}
        />

        <EventsViewSwitcher activeView={eventsView} onViewChange={handleEventsViewChange} />
      </div>

      <div style={{ padding: "16px", overflowAnchor: "none" }}>
        {eventsView === "calendar" ? (
          loading ? (
            <LoadingIndicator text="Загрузка календаря..." block />
          ) : error ? (
            <div
              style={{
                backgroundColor: "var(--hp-danger-soft)",
                color: "var(--hp-danger)",
                padding: "16px",
                borderRadius: "12px",
                fontSize: "15px",
                border: "1px solid var(--hp-danger-border)",
                borderLeft: "4px solid var(--hp-danger)",
              }}
            >
              {error}
            </div>
          ) : (
            <EventsCalendarView events={filteredEvents} onOpenEvent={handleOpenEvent} />
          )
        ) : loading ? (
          <LoadingIndicator text="Загрузка мероприятий..." block />
        ) : error ? (
          <div
            style={{
              backgroundColor: "var(--hp-danger-soft)",
              color: "var(--hp-danger)",
              padding: "16px",
              borderRadius: "12px",
              marginBottom: "20px",
              fontSize: "15px",
              border: "1px solid var(--hp-danger-border)",
              borderLeft: "4px solid var(--hp-danger)",
            }}
          >
            <div style={{ marginBottom: "12px" }}>⚠️ {error}</div>
            <button
              onClick={() => void reloadEvents()}
              disabled={loading}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid var(--hp-danger-border)",
                backgroundColor: loading ? "var(--hp-danger-border)" : "var(--hp-surface)",
                color: "var(--hp-danger)",
                fontWeight: "600",
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "Обновление..." : "Обновить"}
            </button>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2 style={{ margin: "0", fontSize: "18px", fontWeight: "600", color: "var(--hp-text)" }}>
                Предстоящие мероприятия
              </h2>
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--hp-muted)",
                  backgroundColor: "var(--hp-surface-muted)",
                  padding: "4px 10px",
                  borderRadius: "12px",
                }}
              >
                {filteredEvents.length}
              </div>
            </div>

            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} onOpen={handleOpenEvent} />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "48px 16px",
              textAlign: "center",
              backgroundColor: "var(--hp-surface)",
              borderRadius: "16px",
              border: "1px solid var(--hp-border)",
              marginTop: "24px",
            }}
          >
            <div style={{ fontSize: "64px", marginBottom: "16px", opacity: 0.3 }}>🗓️</div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "600", color: "var(--hp-text)" }}>
              {hasAnyFilter ? "Ничего не найдено" : "Нет предстоящих мероприятий"}
            </h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "15px", color: "var(--hp-muted)", lineHeight: "1.5" }}>
              {hasAnyFilter
                ? "Попробуйте убрать часть фильтров или выбрать другую команду."
                : "Здесь будут отображаться предстоящие тренировки, матчи и встречи"}
            </p>
            {hasAnyFilter ? (
              <button
                type="button"
                onClick={() => {
                  setActiveQuickFilters([]);
                  setAdvancedFilters(emptyAdvancedFilters);
                  onTeamChange(null, null);
                }}
                style={{
                  padding: "14px 24px",
                  backgroundColor: "var(--hp-surface-soft)",
                  color: "var(--hp-heading)",
                  border: "1px solid var(--hp-border)",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Сбросить фильтры
              </button>
            ) : canCreateEvents && (
              <button
                onClick={() => navigate("/events/create")}
                style={{
                  padding: "14px 24px",
                  backgroundColor: "var(--hp-primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Создать первое мероприятие
              </button>
            )}
          </div>
        )}
      </div>

      <BottomNav activeTab="events" />
      {canCreateEvents && (
        <button
          type="button"
          aria-label="Добавить мероприятие"
          onClick={() => navigate("/events/create")}
          style={{
            position: "fixed",
            right: "max(20px, calc((100vw - 600px) / 2 + 20px))",
            bottom: "106px",
            zIndex: 130,
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            border: "1px solid rgba(255, 255, 255, 0.32)",
            background: "linear-gradient(180deg, var(--hp-primary), var(--hp-primary-hover))",
            color: "white",
            boxShadow: "0 14px 34px rgba(18, 87, 207, 0.35)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1px",
            transform: isCreateFabVisible ? "translateY(0) scale(1)" : "translateY(62px) scale(0.92)",
            opacity: isCreateFabVisible ? 1 : 0,
            pointerEvents: isCreateFabVisible ? "auto" : "none",
            transition: "transform 0.22s ease, opacity 0.18s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.boxShadow = "0 18px 40px rgba(18, 87, 207, 0.42)";
            event.currentTarget.style.transform = isCreateFabVisible ? "translateY(-2px) scale(1.02)" : "translateY(62px) scale(0.92)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.boxShadow = "0 14px 34px rgba(18, 87, 207, 0.35)";
            event.currentTarget.style.transform = isCreateFabVisible ? "translateY(0) scale(1)" : "translateY(62px) scale(0.92)";
          }}
        >
          <span style={{ fontSize: "32px", lineHeight: 0.78, fontWeight: 500 }}>+</span>
          <span style={{ fontSize: "9px", lineHeight: 1, fontWeight: 900, letterSpacing: 0 }}>Добавить</span>
        </button>
      )}
      <div style={{ height: "110px" }} />
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @media (max-width: 360px) {
            div[style*="padding: 16px"] {
              padding: 12px !important;
            }

            button[style*="padding: 10px 16px"] {
              padding: 8px 12px !important;
              font-size: 13px !important;
            }
          }

          @media (min-width: 768px) {
            div[style*="minHeight: 100vh"] {
              max-width: 600px;
              margin: 0 auto;
              border-left: 1px solid var(--hp-border);
              border-right: 1px solid var(--hp-border);
              min-height: 100vh;
            }

            div[style*="height: 80px"] {
              height: 0 !important;
            }
          }

          @supports (padding: max(0px)) {
            .hp-bottom-nav {
              padding-bottom: max(12px, env(safe-area-inset-bottom, 12px));
            }
          }
        `}
      </style>
    </div>
  );
};
