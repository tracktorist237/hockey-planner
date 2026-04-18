import { useCallback, useEffect, useMemo, useState } from "react";
import { updateAttendance } from "src/api/events";
import { AttendanceLookUpDto, EventDto } from "src/types/events";

interface UseAttendanceOptions {
  event: EventDto | null;
  selectedUserId: string | null;
  reloadEvent: () => Promise<EventDto | null>;
  onError?: (message: string) => void;
}

interface UseAttendanceResult {
  myAttendance: AttendanceLookUpDto | undefined;
  attendanceNote: string;
  setAttendanceNote: (value: string) => void;
  showNoteInput: boolean;
  setShowNoteInput: (value: boolean) => void;
  isEditingNote: boolean;
  setIsEditingNote: (value: boolean) => void;
  submitting: boolean;
  handleVote: (status: number, notes?: string | null) => Promise<void>;
  handleAddNote: () => Promise<void>;
  availablePlayers: AttendanceLookUpDto[];
}

export const useAttendance = ({
  event,
  selectedUserId,
  reloadEvent,
  onError,
}: UseAttendanceOptions): UseAttendanceResult => {
  const [attendanceNote, setAttendanceNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const myAttendance = useMemo(() => {
    return event?.attendances?.find((attendance) => attendance.userId === selectedUserId);
  }, [event?.attendances, selectedUserId]);

  useEffect(() => {
    if (myAttendance?.notes) {
      setAttendanceNote(myAttendance.notes);
    }
  }, [myAttendance]);

  const availablePlayers = useMemo(() => {
    return event?.attendances?.filter((attendance) => attendance.status === 2) ?? [];
  }, [event?.attendances]);

  const handleVote = useCallback(
    async (status: number, notes?: string | null) => {
      if (!event) {
        return;
      }

      if (!selectedUserId) {
        onError?.("Нет текущего пользователя");
        return;
      }

      setSubmitting(true);
      onError?.("");

      try {
        await updateAttendance(event.id, selectedUserId, status, notes);
        await reloadEvent();
        setShowNoteInput(false);
        setIsEditingNote(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Ошибка обновления явки";
        onError?.(message);
      } finally {
        setSubmitting(false);
      }
    },
    [event, onError, reloadEvent, selectedUserId],
  );

  const handleAddNote = useCallback(async () => {
    if (!event || !myAttendance) {
      return;
    }

    await handleVote(myAttendance.status, attendanceNote);
  }, [attendanceNote, event, handleVote, myAttendance]);

  return {
    myAttendance,
    attendanceNote,
    setAttendanceNote,
    showNoteInput,
    setShowNoteInput,
    isEditingNote,
    setIsEditingNote,
    submitting,
    handleVote,
    handleAddNote,
    availablePlayers,
  };
};
