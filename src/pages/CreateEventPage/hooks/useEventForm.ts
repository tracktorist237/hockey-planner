import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { createEvent } from "src/api/events";
import { CreateEventDto, EventType } from "src/types/events";
import { EventFormData } from "src/pages/CreateEventPage/types";

interface UseEventFormOptions {
  onCreated?: (id: string) => void;
  submitEvent?: (dto: CreateEventDto) => Promise<void | string>;
  initialData?: EventFormData;
}

interface UseEventFormResult {
  formData: EventFormData;
  updateField: <K extends keyof EventFormData>(field: K, value: EventFormData[K]) => void;
  handleTypeChange: (newType: EventType) => void;
  handleSubmit: () => Promise<boolean>;
  loading: boolean;
  error: string | null;
  isGame: boolean;
  isMeeting: boolean;
  isPractice: boolean;
  setFormData: Dispatch<SetStateAction<EventFormData>>;
  setError: Dispatch<SetStateAction<string | null>>;
}

const initialFormData: EventFormData = {
  title: "",
  description: "",
  startTime: "",
  locationName: "",
  locationAddress: "",
  iceRinkNumber: "",
  leagueName: "",
  homeTeamName: "",
  awayTeamName: "",
  selectedExerciseIds: [],
  useAddressSearch: true,
  type: EventType.Practice,
};

const getFinalTitle = (formData: EventFormData): string => {
  if (formData.type === EventType.Practice) {
    return "Тренировка";
  }

  if (formData.type === EventType.Game) {
    return `${formData.homeTeamName} - ${formData.awayTeamName}`;
  }

  return formData.title;
};

const normalizeTeamName = (name: string): string =>
  name.trim().replace(/\s+/g, " ").toLocaleLowerCase("ru-RU");

const validateForm = (formData: EventFormData): string | null => {
  if (formData.type === EventType.Game && (!formData.homeTeamName || !formData.awayTeamName)) {
    return "Для матча необходимо указать названия команд";
  }

  if (formData.type === EventType.Game) {
    const normalizedHome = normalizeTeamName(formData.homeTeamName);
    const normalizedAway = normalizeTeamName(formData.awayTeamName);
    if (normalizedHome && normalizedAway && normalizedHome === normalizedAway) {
      return "Домашняя и гостевая команда должны отличаться";
    }
  }

  if (formData.type === EventType.Meeting && !formData.title.trim()) {
    return "Для встречи необходимо указать название";
  }

  if (!formData.startTime) {
    return "Необходимо указать дату и время начала";
  }

  return null;
};

export const useEventForm = ({
  onCreated,
  submitEvent,
  initialData,
}: UseEventFormOptions): UseEventFormResult => {
  const [formData, setFormData] = useState<EventFormData>(initialData ?? initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = <K extends keyof EventFormData>(field: K, value: EventFormData[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTypeChange = (newType: EventType) => {
    setFormData((prev) => ({
      ...prev,
      type: newType,
      title: newType === EventType.Meeting ? prev.title : "",
      homeTeamName: newType === EventType.Game ? prev.homeTeamName : "",
      awayTeamName: newType === EventType.Game ? prev.awayTeamName : "",
      leagueName: newType === EventType.Game ? prev.leagueName : "",
      selectedExerciseIds: newType === EventType.Practice ? prev.selectedExerciseIds : [],
    }));
  };

  const handleSubmit = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const validationError = validateForm(formData);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return false;
    }

    const dto: CreateEventDto = {
      title: getFinalTitle(formData),
      description: formData.description || null,
      type: formData.type,
      startTime: new Date(formData.startTime).toISOString(),
      locationName: formData.locationName || null,
      locationAddress: formData.locationAddress || null,
      iceRinkNumber: formData.iceRinkNumber || null,
      leagueName: formData.leagueName || null,
      ...(formData.type === EventType.Game
        ? {
            homeTeamName: formData.homeTeamName || null,
            awayTeamName: formData.awayTeamName || null,
          }
        : {}),
      ...(formData.type === EventType.Practice
        ? {
            exerciseIds: formData.selectedExerciseIds,
          }
        : {}),
    };

    try {
      if (submitEvent) {
        const submitResult = await submitEvent(dto);
        if (typeof submitResult === "string") {
          onCreated?.(submitResult);
        }
      } else {
        const id = await createEvent(dto);
        onCreated?.(id);
      }
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка создания события";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const { isGame, isMeeting, isPractice } = useMemo(() => {
    return {
      isGame: formData.type === EventType.Game,
      isMeeting: formData.type === EventType.Meeting,
      isPractice: formData.type === EventType.Practice,
    };
  }, [formData.type]);

  return {
    formData,
    updateField,
    handleTypeChange,
    handleSubmit,
    loading,
    error,
    isGame,
    isMeeting,
    isPractice,
    setFormData,
    setError,
  };
};
