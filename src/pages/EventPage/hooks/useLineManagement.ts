import { useCallback, useMemo, useState } from "react";
import { createLineRoster, updateLineRoster } from "src/api/lines";
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

const buildPlayersPayload = (line: LineDto): NonNullable<CreateUpdateLineData["players"]> => {
  return (
    line.members?.map((player) => ({
      userId: player.userId,
      role: player.role,
    })) ?? []
  );
};

const buildLinePayload = (line: LineDto, order = line.order): CreateUpdateLineData => ({
  name: line.name,
  order,
  uniformColorId: line.uniformColorId ?? null,
  players: buildPlayersPayload(line),
});

const GOALIE_POSITION = 1;

export const useLineManagement = ({
  event,
  currentUserId,
  reloadEvent,
  onError,
}: UseLineManagementOptions): UseLineManagementResult => {
  const [creatingLine, setCreatingLineState] = useState(false);
  const [activeSlot, setActiveSlotState] = useState<Slot | null>(null);
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  const [renamingLineId, setRenamingLineId] = useState<string | null>(null);
  const [newLineName, setNewLineNameState] = useState("");
  const [lineSlots, setLineSlots] = useState<Record<Slot, AttendanceLookUpDto | null>>(cloneEmptySlots());

  const sortedRoster = useMemo(() => {
    return [...(event?.roster ?? [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [event?.roster]);

  const getDefaultLineName = useCallback(() => {
    const nextOrder =
      sortedRoster.length > 0 ? Math.max(...sortedRoster.map((line) => line.order || 0)) + 1 : 1;
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

    event?.roster?.forEach((line) => {
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
  }, [editingLineId, event?.roster, lineSlots]);

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
    if (!event || !ensureAuthorized() || !currentUserId) {
      return;
    }

    const players = Object.entries(lineSlots)
      .filter((entry): entry is [Slot, AttendanceLookUpDto] => entry[1] !== null)
      .map(([slot, player]) => ({
        userId: player.userId,
        role: slotToRole[slot],
      }));

    const nextOrder =
      sortedRoster.length > 0 ? Math.max(...sortedRoster.map((line) => line.order || 0)) + 1 : 1;
    const lineName = newLineName.trim() || `Звено ${nextOrder}`;

    const body: CreateUpdateRosterRequest = {
      eventId: event.id,
      lines: [
        {
          name: lineName,
          order: nextOrder,
          players,
        },
      ],
    };

    try {
      await createLineRoster(body, currentUserId);
      await reloadEvent();
      resetLineEditor();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка при создании звена";
      setError(message);
    }
  }, [currentUserId, ensureAuthorized, event, lineSlots, newLineName, reloadEvent, resetLineEditor, setError, sortedRoster]);

  const deleteLine = useCallback(async (lineId: string) => {
    if (!event?.roster || !ensureAuthorized() || !currentUserId) {
      return;
    }

    const currentSorted = [...event.roster].sort((a, b) => (a.order || 0) - (b.order || 0));

    const newLines = currentSorted
      .filter((line) => line.id !== lineId)
      .map((line, index) => ({
        name: line.name,
        order: index + 1,
        uniformColorId: line.uniformColorId ?? null,
        players: buildPlayersPayload(line),
      }));

    const body: CreateUpdateRosterRequest = {
      eventId: event.id,
      lines: newLines,
    };

    try {
      await updateLineRoster(body, currentUserId);
      await reloadEvent();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка при удалении звена";
      setError(message);
    }
  }, [currentUserId, ensureAuthorized, event, reloadEvent, setError]);

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
    if (!event || editingLineIndex === null || !ensureAuthorized() || !currentUserId) {
      return;
    }

    const newPlayers = Object.entries(lineSlots)
      .filter((entry): entry is [Slot, AttendanceLookUpDto] => entry[1] !== null)
      .map(([slot, player]) => ({
        userId: player.userId,
        role: slotToRole[slot],
      }));

    const linesForPut = sortedRoster.map((line, index) => {
      if (index === editingLineIndex) {
        return {
          name: line.name,
          order: line.order,
          uniformColorId: line.uniformColorId ?? null,
          players: newPlayers,
        };
      }

      return buildLinePayload(line);
    });

    const body: CreateUpdateRosterRequest = {
      eventId: event.id,
      lines: linesForPut,
    };

    try {
      await updateLineRoster(body, currentUserId);
      await reloadEvent();
      resetLineEditor();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка обновления звена";
      setError(message);
    }
  }, [currentUserId, editingLineIndex, ensureAuthorized, event, lineSlots, reloadEvent, resetLineEditor, setError, sortedRoster]);

  const startRenameLine = useCallback((lineId: string, currentName: string) => {
    setRenamingLineId(lineId);
    setNewLineNameState(currentName);
  }, []);

  const saveRenamedLine = useCallback(async () => {
    if (!event || !renamingLineId || !ensureAuthorized() || !currentUserId) {
      return;
    }

    const linesForPut = sortedRoster.map((line) => {
      if (line.id === renamingLineId) {
        return {
          name: newLineName || line.name,
          order: line.order,
          uniformColorId: line.uniformColorId ?? null,
          players: buildPlayersPayload(line),
        };
      }

      return buildLinePayload(line);
    });

    const body: CreateUpdateRosterRequest = {
      eventId: event.id,
      lines: linesForPut,
    };

    try {
      await updateLineRoster(body, currentUserId);
      await reloadEvent();
      setRenamingLineId(null);
      setNewLineNameState("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка переименования звена";
      setError(message);
    }
  }, [currentUserId, ensureAuthorized, event, newLineName, reloadEvent, renamingLineId, setError, sortedRoster]);

  const moveLineUp = useCallback(async (index: number) => {
    if (!event || index <= 0 || index >= sortedRoster.length || !ensureAuthorized() || !currentUserId) {
      return;
    }

    const newRoster = [...sortedRoster];
    const temp = newRoster[index];
    newRoster[index] = newRoster[index - 1];
    newRoster[index - 1] = temp;

    const linesForPut = newRoster.map((line, idx) => ({
      name: line.name,
      order: idx + 1,
      uniformColorId: line.uniformColorId ?? null,
      players: buildPlayersPayload(line),
    }));

    const body: CreateUpdateRosterRequest = {
      eventId: event.id,
      lines: linesForPut,
    };

    try {
      await updateLineRoster(body, currentUserId);
      await reloadEvent();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка изменения порядка звеньев";
      setError(message);
    }
  }, [currentUserId, ensureAuthorized, event, reloadEvent, setError, sortedRoster]);

  const moveLineDown = useCallback(async (index: number) => {
    if (
      !event ||
      index < 0 ||
      index >= sortedRoster.length - 1 ||
      !ensureAuthorized() ||
      !currentUserId
    ) {
      return;
    }

    const newRoster = [...sortedRoster];
    const temp = newRoster[index];
    newRoster[index] = newRoster[index + 1];
    newRoster[index + 1] = temp;

    const linesForPut = newRoster.map((line, idx) => ({
      name: line.name,
      order: idx + 1,
      uniformColorId: line.uniformColorId ?? null,
      players: buildPlayersPayload(line),
    }));

    const body: CreateUpdateRosterRequest = {
      eventId: event.id,
      lines: linesForPut,
    };

    try {
      await updateLineRoster(body, currentUserId);
      await reloadEvent();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка изменения порядка звеньев";
      setError(message);
    }
  }, [currentUserId, ensureAuthorized, event, reloadEvent, setError, sortedRoster]);

  const assignLineUniformColor = useCallback(async (lineId: string, uniformColorId: string | null) => {
    if (!event || !ensureAuthorized() || !currentUserId) {
      return;
    }

    const linesForPut = sortedRoster.map((line) => ({
      ...buildLinePayload(line),
      uniformColorId: line.id === lineId ? uniformColorId : line.uniformColorId ?? null,
    }));

    const body: CreateUpdateRosterRequest = {
      eventId: event.id,
      lines: linesForPut,
    };

    try {
      await updateLineRoster(body, currentUserId);
      await reloadEvent();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка назначения цвета формы звену";
      setError(message);
    }
  }, [currentUserId, ensureAuthorized, event, reloadEvent, setError, sortedRoster]);

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
