import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getEvents } from "../../../api/events";
import { EventLookUpDto } from "../../../types/events";

const EVENTS_REFRESH_INTERVAL_MS = 60000;

const isUpcomingEvent = (startTime: string): boolean => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const date = new Date(startTime);
  const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return eventDay.getTime() >= today.getTime();
};

export const useEventsData = (currentUserId?: string, teamId?: string | null) => {
  const [events, setEvents] = useState<EventLookUpDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const loadEvents = useCallback(
    async (silent = false) => {
      if (isLoadingRef.current) {
        return;
      }

      isLoadingRef.current = true;
      if (!silent) {
        setLoading(true);
      }

      try {
        const data = await getEvents(currentUserId, teamId);
        setEvents(data.events ?? []);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Не удалось загрузить мероприятия");
      } finally {
        if (!silent) {
          setLoading(false);
        }
        isLoadingRef.current = false;
      }
    },
    [currentUserId, teamId],
  );

  useEffect(() => {
    void loadEvents();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadEvents(true);
      }
    }, EVENTS_REFRESH_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadEvents(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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

  const allEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [events],
  );

  return {
    events: upcomingEvents,
    allEvents,
    loading,
    error,
    reloadEvents: loadEvents,
  };
};
