import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AttendanceConflictError, updateAttendance } from "src/api/events";
import { AttendanceLookUpDto, EventConflictDto, EventDto } from "src/types/events";

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
  attendanceConflicts: EventConflictDto[];
  confirmAttendanceDespiteConflicts: () => Promise<void>;
  cancelAttendanceConflict: () => void;
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
  const [attendanceConflicts, setAttendanceConflicts] = useState<EventConflictDto[]>([]);
  const [pendingVote, setPendingVote] = useState<{ eventId: string; userId: string; status: number; notes?: string | null } | null>(null);
  const generation = useRef(0);
  const inFlight = useRef(false);

  useEffect(() => {
    const invalidate = () => { generation.current++; inFlight.current = false; };
    invalidate();
    setSubmitting(false);
    setPendingVote(null);
    setAttendanceConflicts([]);
    setAttendanceNote("");
    setShowNoteInput(false);
    setIsEditingNote(false);
    return invalidate;
  }, [event?.id, selectedUserId]);

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
      if (!event || inFlight.current) {
        return;
      }

      if (!selectedUserId) {
        onError?.("Нет текущего пользователя");
        return;
      }

      const operation = generation.current;
      inFlight.current = true;
      setSubmitting(true);
      onError?.("");

      try {
        await updateAttendance(event.id, selectedUserId, status, notes, selectedUserId);
        if (operation !== generation.current) return;
        await reloadEvent();
        if (operation !== generation.current) return;
        setShowNoteInput(false);
        setIsEditingNote(false);
      } catch (err) {
        if (operation !== generation.current) return;
        if (err instanceof AttendanceConflictError) {
          setAttendanceConflicts(err.conflicts);
          setPendingVote({ eventId: event.id, userId: selectedUserId, status, notes });
          return;
        }
        const message = err instanceof Error ? err.message : "Ошибка обновления явки";
        onError?.(message);
      } finally {
        if (operation === generation.current) {
          inFlight.current = false;
          setSubmitting(false);
        }
      }
    },
    [event, onError, reloadEvent, selectedUserId],
  );

  const confirmAttendanceDespiteConflicts = useCallback(async () => {
    if (!event || !selectedUserId || !pendingVote || inFlight.current
      || pendingVote.eventId !== event.id || pendingVote.userId !== selectedUserId) return;
    const operation = generation.current;
    inFlight.current = true;
    setSubmitting(true);
    onError?.("");
    try {
      await updateAttendance(event.id, selectedUserId, pendingVote.status, pendingVote.notes, selectedUserId, true);
      if (operation !== generation.current) return;
      setAttendanceConflicts([]);
      setPendingVote(null);
      await reloadEvent();
    } catch (err) {
      if (operation !== generation.current) return;
      onError?.(err instanceof Error ? err.message : "Ошибка обновления явки");
    } finally {
      if (operation === generation.current) {
        inFlight.current = false;
        setSubmitting(false);
      }
    }
  }, [event, onError, pendingVote, reloadEvent, selectedUserId]);

  const cancelAttendanceConflict = useCallback(() => {
    if (submitting) return;
    setAttendanceConflicts([]);
    setPendingVote(null);
  }, [submitting]);

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
    attendanceConflicts,
    confirmAttendanceDespiteConflicts,
    cancelAttendanceConflict,
  };
};
