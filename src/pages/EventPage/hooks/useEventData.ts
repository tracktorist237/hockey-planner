import { useCallback, useEffect, useState } from "react";
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

  const reloadEvent = useCallback(async (): Promise<EventDto | null> => {
    try {
      const data = await getEvent(eventId);
      setEvent(data);
      setError(null);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка загрузки события";
      setError(message);
      return null;
    }
  }, [eventId]);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    void reloadEvent().finally(() => {
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [reloadEvent]);

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
    event,
    loading,
    error,
    copySuccess,
    copyEventLink,
    reloadEvent,
    setError,
  };
};
