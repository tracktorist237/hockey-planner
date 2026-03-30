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

export const useEventsData = () => {
  const [events, setEvents] = useState<EventLookUpDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const data = await getEvents();
      setEvents(data.events ?? []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить мероприятия");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void loadEvents();

    const interval = window.setInterval(() => {
      void loadEvents();
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
  };
};
