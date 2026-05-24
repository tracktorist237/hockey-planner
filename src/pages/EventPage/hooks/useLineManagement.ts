import { useCallback, useEffect, useMemo, useState } from "react";
import { updateLineRoster } from "src/api/lines";
import { AttendanceLookUpDto, EventDto, LineDto } from "src/types/events";
import { CreateUpdateLineData, CreateUpdateRosterRequest, PlayerRole } from "src/types/lines";
import { Slot, cloneEmptySlots, roleToSlot, slotToRole } from "src/pages/EventPage/types";

interface UseLineManagementOptions {
  event: EventDto | null;
  currentUserId: string | null;
  reloadEvent: () => Promise<EventDto | null>;
  onError?: (message: string) => void;
}

interface UseLineManagementResult {
  sortedRoster: LineDto[];
  creatingLine: boolean;
  setCreatingLine: (value: boolean) => void;
  editingLineIndex: number | null;
  lineSlots: Record<Slot, AttendanceLookUpDto | null>;
  activeSlot: Slot | null;
  setActiveSlot: (slot: Slot | null) => void;
  renamingLineId: string | null;
  setRenamingLineId: (value: string | null) => void;
  newLineName: string;
  setNewLineName: (value: string) => void;
  availablePlayers: AttendanceLookUpDto[];
  hasUnsavedRosterChanges: boolean;
  savingRoster: boolean;
  rosterSaveError: string | null;
  saveRosterChanges: () => Promise<void>;
  saveLine: () => Promise<void>;
  saveEditedLine: () => Promise<void>;
  deleteLine: (lineId: string) => Promise<void>;
  moveLineUp: (index: number) => Promise<void>;
  moveLineDown: (index: number) => Promise<void>;
  assignLineUniformColor: (lineId: string, uniformColorId: string | null) => Promise<void>;
  startRenameLine: (lineId: string, currentName: string) => void;
  saveRenamedLine: () => Promise<void>;
  startEditLine: (index: number) => void;
  clearSlot: (slot: Slot) => void;
  selectForSlot: (player: AttendanceLookUpDto) => void;
  cancelLineEditor: () => void;
}

const GOALIE_POSITION = 1;

const buildPlayersPayload = (line: LineDto): NonNullable<CreateUpdateLineData["players"]> => (
  line.members?.map((player) => ({
    userId: player.userId,
    role: player.role,
  })) ?? []
);

const buildLinePayload = (line: LineDto, order = line.order): CreateUpdateLineData => ({
  name: line.name,
  order,
  uniformColorId: line.uniformColorId ?? null,
  players: buildPlayersPayload(line),
});

const cloneRoster = (roster?: LineDto[]): LineDto[] => (
  [...(roster ?? [])]
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((line) => ({
      ...line,
      members: [...(line.members ?? [])],
    }))
);

const buildMemberFromAttendance = (slot: Slot, player: AttendanceLookUpDto) => ({
  userId: player.userId,
  playerId: player.userId,
  jerseyNumber: player.jerseyNumber,
  firstName: player.firstName,
  lastName: player.lastName,
  photoUrl: player.photoUrl ?? null,
  role: slotToRole[slot],
});

export const useLineManagement = ({
  event,
  currentUserId,
  reloadEvent,
  onError,
}: UseLineManagementOptions): UseLineManagementResult => {
  const [draftRoster, setDraftRoster] = useState<LineDto[]>([]);
  const [hasUnsavedRosterChanges, setHasUnsavedRosterChanges] = useState(false);
  const [savingRoster, setSavingRoster] = useState(false);
  const [rosterSaveError, setRosterSaveError] = useState<string | null>(null);
  const [creatingLine, setCreatingLineState] = useState(false);
  const [activeSlot, setActiveSlotState] = useState<Slot | null>(null);
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  const [renamingLineId, setRenamingLineId] = useState<string | null>(null);
  const [newLineName, setNewLineNameState] = useState("");
  const [lineSlots, setLineSlots] = useState<Record<Slot, AttendanceLookUpDto | null>>(cloneEmptySlots());

  useEffect(() => {
    if (!hasUnsavedRosterChanges) {
      setDraftRoster(cloneRoster(event?.roster));
    }
  }, [event?.roster, hasUnsavedRosterChanges]);

  const sortedRoster = useMemo(() => {
    return [...draftRoster].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [draftRoster]);

  const setError = useCallback(
    (message: string) => {
      onError?.(message);
    },
    [onError],
  );

  const ensureAuthorized = useCallback((): boolean => {
    if (!currentUserId) {
      setError("Необходимо авторизоваться");
      return false;
    }

    return true;
  }, [currentUserId, setError]);

  const markRosterChanged = useCallback((updater: (current: LineDto[]) => LineDto[]) => {
    setDraftRoster((current) => updater(current).map((line, index) => ({ ...line, order: index + 1 })));
    setHasUnsavedRosterChanges(true);
    setRosterSaveError(null);
  }, []);

  const getDefaultLineName = useCallback(() => {
    const nextOrder = sortedRoster.length > 0 ? Math.max(...sortedRoster.map((line) => line.order || 0)) + 1 : 1;
    return `Звено ${nextOrder}`;
  }, [sortedRoster]);

  const editingLineId = useMemo(() => {
    if (editingLineIndex === null) {
      return null;
    }

    return sortedRoster[editingLineIndex]?.id ?? null;
  }, [editingLineIndex, sortedRoster]);

  const usedUserIds = useMemo(() => {
    const ids = new Set<string>();

    sortedRoster.forEach((line) => {
      if (editingLineId && line.id === editingLineId) {
        return;
      }

      line.members?.forEach((member) => ids.add(member.userId));
    });

    Object.values(lineSlots).forEach((player) => {
      if (player) {
        ids.add(player.userId);
      }
    });

    return ids;
  }, [editingLineId, lineSlots, sortedRoster]);

  const availablePlayers = useMemo(() => {
    return (
      event?.attendances?.filter(
        (attendance) =>
          attendance.status === 2 &&
          attendance.primaryPosition !== GOALIE_POSITION &&
          !usedUserIds.has(attendance.userId),
      ) ?? []
    );
  }, [event?.attendances, usedUserIds]);

  const resetLineEditor = useCallback(() => {
    setCreatingLineState(false);
    setEditingLineIndex(null);
    setLineSlots(cloneEmptySlots());
    setActiveSlotState(null);
    setNewLineNameState("");
  }, []);

  const setCreatingLine = useCallback(
    (value: boolean) => {
      setCreatingLineState(value);
      if (value) {
        setEditingLineIndex(null);
        setLineSlots(cloneEmptySlots());
        setActiveSlotState(null);
        setNewLineNameState(getDefaultLineName());
      } else {
        resetLineEditor();
      }
    },
    [getDefaultLineName, resetLineEditor],
  );

  const selectForSlot = useCallback((player: AttendanceLookUpDto) => {
    setLineSlots((prev) => {
      const slot = activeSlot;
      if (!slot) {
        return prev;
      }

      return {
        ...prev,
        [slot]: player,
      };
    });

    setActiveSlotState(null);
  }, [activeSlot]);

  const clearSlot = useCallback((slot: Slot) => {
    setLineSlots((prev) => ({
      ...prev,
      [slot]: null,
    }));
  }, []);

  const saveLine = useCallback(async () => {
    if (!event || !ensureAuthorized()) {
      return;
    }

    const nextOrder = sortedRoster.length > 0 ? Math.max(...sortedRoster.map((line) => line.order || 0)) + 1 : 1;
    const lineName = newLineName.trim() || `Звено ${nextOrder}`;
    const members = Object.entries(lineSlots)
      .filter((entry): entry is [Slot, AttendanceLookUpDto] => entry[1] !== null)
      .map(([slot, player]) => buildMemberFromAttendance(slot, player));

    markRosterChanged((current) => [
      ...current,
      {
        id: `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: lineName,
        order: nextOrder,
        members,
      },
    ]);
    resetLineEditor();
  }, [ensureAuthorized, event, lineSlots, markRosterChanged, newLineName, resetLineEditor, sortedRoster]);

  const deleteLine = useCallback(async (lineId: string) => {
    if (!ensureAuthorized()) {
      return;
    }

    markRosterChanged((current) => current.filter((line) => line.id !== lineId));
  }, [ensureAuthorized, markRosterChanged]);

  const startEditLine = useCallback((index: number) => {
    if (index < 0 || index >= sortedRoster.length) {
      return;
    }

    const line = sortedRoster[index];
    const slots = cloneEmptySlots();

    line.members?.forEach((member) => {
      const role = member.role as PlayerRole;
      const slot = roleToSlot[role];

      if (!slot) {
        return;
      }

      slots[slot] = {
        userId: member.userId,
        jerseyNumber: member.jerseyNumber,
        firstName: member.firstName,
        lastName: member.lastName,
        photoUrl: member.photoUrl ?? null,
        primaryPosition: 0,
        handedness: 0,
        status: 2,
        respondedAt: new Date().toISOString(),
      } as AttendanceLookUpDto;
    });

    setLineSlots(slots);
    setCreatingLineState(true);
    setEditingLineIndex(index);
    setNewLineNameState("");
  }, [sortedRoster]);

  const saveEditedLine = useCallback(async () => {
    if (editingLineIndex === null || !ensureAuthorized()) {
      return;
    }

    const newMembers = Object.entries(lineSlots)
      .filter((entry): entry is [Slot, AttendanceLookUpDto] => entry[1] !== null)
      .map(([slot, player]) => buildMemberFromAttendance(slot, player));

    markRosterChanged((current) =>
      current.map((line, index) =>
        index === editingLineIndex
          ? {
              ...line,
              members: newMembers,
            }
          : line,
      ),
    );
    resetLineEditor();
  }, [editingLineIndex, ensureAuthorized, lineSlots, markRosterChanged, resetLineEditor]);

  const startRenameLine = useCallback((lineId: string, currentName: string) => {
    setRenamingLineId(lineId);
    setNewLineNameState(currentName);
  }, []);

  const saveRenamedLine = useCallback(async () => {
    if (!renamingLineId || !ensureAuthorized()) {
      return;
    }

    markRosterChanged((current) =>
      current.map((line) =>
        line.id === renamingLineId
          ? {
              ...line,
              name: newLineName.trim() || line.name,
            }
          : line,
      ),
    );
    setRenamingLineId(null);
    setNewLineNameState("");
  }, [ensureAuthorized, markRosterChanged, newLineName, renamingLineId]);

  const moveLineUp = useCallback(async (index: number) => {
    if (index <= 0 || index >= sortedRoster.length || !ensureAuthorized()) {
      return;
    }

    markRosterChanged((current) => {
      const next = [...current].sort((a, b) => (a.order || 0) - (b.order || 0));
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  }, [ensureAuthorized, markRosterChanged, sortedRoster.length]);

  const moveLineDown = useCallback(async (index: number) => {
    if (index < 0 || index >= sortedRoster.length - 1 || !ensureAuthorized()) {
      return;
    }

    markRosterChanged((current) => {
      const next = [...current].sort((a, b) => (a.order || 0) - (b.order || 0));
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  }, [ensureAuthorized, markRosterChanged, sortedRoster.length]);

  const assignLineUniformColor = useCallback(async (lineId: string, uniformColorId: string | null) => {
    if (!ensureAuthorized()) {
      return;
    }

    markRosterChanged((current) =>
      current.map((line) =>
        line.id === lineId
          ? {
              ...line,
              uniformColorId,
              uniformColor: uniformColorId === line.uniformColor?.id ? line.uniformColor : null,
            }
          : line,
      ),
    );
  }, [ensureAuthorized, markRosterChanged]);

  const saveRosterChanges = useCallback(async () => {
    if (!event || !ensureAuthorized() || !currentUserId || savingRoster) {
      return;
    }

    const body: CreateUpdateRosterRequest = {
      eventId: event.id,
      lines: sortedRoster.map((line, index) => buildLinePayload(line, index + 1)),
    };

    setSavingRoster(true);
    setRosterSaveError(null);
    try {
      await updateLineRoster(body, currentUserId);
      const refreshedEvent = await reloadEvent();
      if (refreshedEvent) {
        setDraftRoster(cloneRoster(refreshedEvent.roster));
        setHasUnsavedRosterChanges(false);
        setRosterSaveError(null);
        resetLineEditor();
      } else {
        setRosterSaveError("Код 0: состав отправлен, но не удалось обновить данные. Проверьте интернет и попробуйте сохранить ещё раз.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось сохранить состав. Проверьте интернет и попробуйте ещё раз.";
      setRosterSaveError(message);
    } finally {
      setSavingRoster(false);
    }
  }, [currentUserId, ensureAuthorized, event, reloadEvent, resetLineEditor, savingRoster, sortedRoster]);

  return {
    sortedRoster,
    creatingLine,
    setCreatingLine,
    editingLineIndex,
    lineSlots,
    activeSlot,
    setActiveSlot: setActiveSlotState,
    renamingLineId,
    setRenamingLineId,
    newLineName,
    setNewLineName: setNewLineNameState,
    availablePlayers,
    hasUnsavedRosterChanges,
    savingRoster,
    rosterSaveError,
    saveRosterChanges,
    saveLine,
    saveEditedLine,
    deleteLine,
    moveLineUp,
    moveLineDown,
    assignLineUniformColor,
    startRenameLine,
    saveRenamedLine,
    startEditLine,
    clearSlot,
    selectForSlot,
    cancelLineEditor: resetLineEditor,
  };
};
