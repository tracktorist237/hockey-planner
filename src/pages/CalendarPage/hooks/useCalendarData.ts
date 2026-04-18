import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getEvents } from "src/api/events";
import { WeekDayData } from "src/pages/CalendarPage/types";
import { EventListDto, EventLookUpDto } from "src/types/events";

interface UseCalendarDataOptions {
  currentDate: Date;
  selectedDate: Date | null;
  onInitialDateSelect?: (date: Date) => void;
}

export const useCalendarData = ({ currentDate, selectedDate, onInitialDateSelect }: UseCalendarDataOptions) => {
  const [events, setEvents] = useState<EventListDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialDateSelected = useRef(false);

  useEffect(() => {
    setLoading(true);
    getEvents()
      .then((response) => {
        setEvents(response);
        setError(null);
      })
      .catch((requestError) => {
        console.error(requestError);
        setError("Не удалось загрузить мероприятия");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && events && !initialDateSelected.current) {
      initialDateSelected.current = true;
      onInitialDateSelect?.(new Date());
    }
  }, [events, loading, onInitialDateSelect]);

  const safeEvents = useMemo<EventLookUpDto[]>(() => events?.events ?? [], [events]);

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
      safeEvents.filter((event) => {
        const eventDate = new Date(event.startTime);
        return (
          eventDate.getDate() === date.getDate() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear()
        );
      }),
    [safeEvents],
  );

  const weekDays = useMemo<WeekDayData[]>(() => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);

    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + index);
      return {
        date: day,
        events: getEventsForDate(day),
      };
    });
  }, [currentDate, getEventsForDate]);

  const selectedDateEvents = useMemo(
    () => (selectedDate ? getEventsForDate(selectedDate) : []),
    [getEventsForDate, selectedDate],
  );

  return {
    loading,
    error,
    daysInMonth,
    firstDayOfMonth,
    weekDays,
    selectedDateEvents,
    getEventsForDate,
  };
};
