import { useCallback, useEffect, useMemo, useState } from "react";
import { getEvents } from "../../../api/events";
import { EventLookUpDto } from "../../../types/events";

const isUpcomingEvent = (startTime: string): boolean => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const date = new Date(startTime);
  const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return eventDay.getTime() >= today.getTime();
};

export const useEventsData = (currentUserId?: string) => {
  const [events, setEvents] = useState<EventLookUpDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const data = await getEvents(currentUserId);
        setEvents(data.events ?? []);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Не удалось загрузить мероприятия");
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [currentUserId],
  );

  useEffect(() => {
    void loadEvents();

    const interval = window.setInterval(() => {
      void loadEvents(true);
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadEvents]);

  const upcomingEvents = useMemo(() => {
    return events
      .filter((event) => isUpcomingEvent(event.startTime))
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
  }, [events]);

  return {
    events: upcomingEvents,
    loading,
    error,
    reloadEvents: loadEvents,
  };
};
