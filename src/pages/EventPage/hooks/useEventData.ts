import { useCallback, useEffect, useRef, useState } from "react";
import { getEvent } from "src/api/events";
import { EventDto } from "src/types/events";
import { updateMetaTags } from "src/utils/share";

interface UseEventDataResult {
  event: EventDto | null;
  loading: boolean;
  error: string | null;
  copySuccess: boolean;
  copyEventLink: () => void;
  reloadEvent: () => Promise<EventDto | null>;
  setError: (value: string | null) => void;
}

export const useEventData = (eventId: string): UseEventDataResult => {
  const [event, setEvent] = useState<EventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const requestGeneration = useRef(0);
  const activeEventId = useRef<string | null>(eventId);

  const reloadEvent = useCallback(async (): Promise<EventDto | null> => {
    if (activeEventId.current !== eventId) return null;
    const request = ++requestGeneration.current;
    try {
      const data = await getEvent(eventId);
      if (request !== requestGeneration.current) return null;
      setEvent(data);
      setError(null);
      return data;
    } catch (err) {
      if (request !== requestGeneration.current) return null;
      const message = err instanceof Error ? err.message : "Ошибка загрузки события";
      setError(message);
      return null;
    }
  }, [eventId]);

  useEffect(() => {
    let mounted = true;
    const invalidate = () => { requestGeneration.current++; };

    activeEventId.current = eventId;
    setLoading(true);
    setError(null);
    void reloadEvent().finally(() => {
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      activeEventId.current = null;
      invalidate();
    };
  }, [eventId, reloadEvent]);

  useEffect(() => {
    if (!event) {
      return;
    }

    updateMetaTags(event);

    return () => {
      document.title = "Хоккейный планировщик";
    };
  }, [event]);

  const copyEventLink = useCallback(() => {
    const url = `${window.location.origin}/events/${eventId}`;

    void navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      window.setTimeout(() => setCopySuccess(false), 2000);
    });
  }, [eventId]);

  return {
    event: event?.id === eventId ? event : null,
    loading,
    error,
    copySuccess,
    copyEventLink,
    reloadEvent,
    setError,
  };
};
