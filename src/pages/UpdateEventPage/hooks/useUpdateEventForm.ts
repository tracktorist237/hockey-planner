import { useCallback, useEffect, useState } from "react";
import { getEvent, updateEvent } from "src/api/events";
import { useEventForm } from "src/pages/CreateEventPage/hooks/useEventForm";
import { EventFormData } from "src/pages/CreateEventPage/types";
import { EventType } from "src/types/events";

interface UseUpdateEventFormOptions {
  eventId?: string;
  onUpdated: () => void;
}

const toDateTimeLocal = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
};

const normalizeType = (type: number): EventType => {
  if (type === EventType.Game || type === EventType.Meeting) {
    return type;
  }
  return EventType.Practice;
};

const mapEventToFormData = (
  event: Awaited<ReturnType<typeof getEvent>>,
): EventFormData => ({
  title: event.title ?? "",
  description: event.description ?? "",
  startTime: toDateTimeLocal(event.startTime),
  locationName: event.locationName ?? "",
  locationAddress: event.locationAddress ?? "",
  iceRinkNumber: event.iceRinkNumber ?? "",
  leagueName: event.leagueName ?? "",
  homeTeamName: event.homeTeamName ?? "",
  awayTeamName: event.awayTeamName ?? "",
  selectedExerciseIds: event.exercises?.map((exercise) => exercise.id) ?? [],
  useAddressSearch: true,
  type: normalizeType(event.type),
});

export const useUpdateEventForm = ({
  eventId,
  onUpdated,
}: UseUpdateEventFormOptions) => {
  const [loadingInitial, setLoadingInitial] = useState(true);

  const {
    formData,
    updateField,
    handleTypeChange,
    handleSubmit: submitForm,
    loading,
    error,
    isGame,
    isMeeting,
    isPractice,
    setFormData,
    setError,
  } = useEventForm({
    submitEvent: async (dto) => {
      if (!eventId) {
        throw new Error("ID события не указан");
      }
      await updateEvent(eventId, dto);
    },
  });

  useEffect(() => {
    if (!eventId) {
      setError("ID события не указан");
      setLoadingInitial(false);
      return;
    }

    let active = true;
    setLoadingInitial(true);
    setError(null);

    void getEvent(eventId)
      .then((event) => {
        if (!active) {
          return;
        }
        setFormData(mapEventToFormData(event));
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        const message =
          err instanceof Error ? err.message : "Не удалось загрузить событие";
        setError(message);
      })
      .finally(() => {
        if (active) {
          setLoadingInitial(false);
        }
      });

    return () => {
      active = false;
    };
  }, [eventId, setError, setFormData]);

  const handleSubmit = useCallback(async () => {
    const success = await submitForm();
    if (success) {
      onUpdated();
    }
  }, [onUpdated, submitForm]);

  return {
    formData,
    updateField,
    handleTypeChange,
    loadingInitial,
    loading: loadingInitial || loading,
    error,
    isGame,
    isMeeting,
    isPractice,
    handleSubmit,
  };
};
