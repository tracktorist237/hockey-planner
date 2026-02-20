import { useEffect, useState } from "react";
import {
  EventDto,
  AttendanceLookUpDto,
  LineDto,
  PlayerLookUpDto,
  EventType,
} from "./types/events";
import { getEvent, updateAttendance } from "./api/events";
import {
  CreateUpdateRosterRequest,
  PlayerRole,
} from "./types/lines";
import { createLineRoster, updateLineRoster } from "./api/lines";
import { CurrentPlayerHeader } from "./CurrentPlayerHeader";
import { getUserById } from "./api/users";

interface EventPageProps {
  eventId: string;
  onBack: () => void;
  currentUser?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    jerseyNumber?: number | null;
  } | null;
}

interface PlayerDetails {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: number | null;
  primaryPosition?: number | null;
  secondaryPosition?: number | null;
  handedness?: number | null;
  height?: number | null;
  weight?: number | null;
  birthDate?: string | null;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
}

type Slot = "LW" | "C" | "RW" | "LD" | "RD";

const slotToRole: Record<Slot, PlayerRole> = {
  LW: PlayerRole.LeftWing,
  C: PlayerRole.Center,
  RW: PlayerRole.RightWing,
  LD: PlayerRole.LeftDefender,
  RD: PlayerRole.RightDefender,
};

const roleToSlot: Record<PlayerRole, Slot | undefined> = {
  [PlayerRole.LeftWing]: "LW",
  [PlayerRole.Center]: "C",
  [PlayerRole.RightWing]: "RW",
  [PlayerRole.LeftDefender]: "LD",
  [PlayerRole.RightDefender]: "RD",
};

// Вспомогательные функции
const getEventTypeName = (type: EventType): string => {
  switch (type) {
    case EventType.Practice:
      return 'Тренировка';
    case EventType.Game:
      return 'Матч';
    case EventType.Meeting:
      return 'Встреча';
    default:
      return 'Событие';
  }
};

const getEventTypeColor = (type: EventType): string => {
  switch (type) {
    case EventType.Practice:
      return "#4caf50";
    case EventType.Game:
      return "#2196f3";
    case EventType.Meeting:
      return "#9c27b0";
    default:
      return "#757575";
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return `Сегодня, ${timeStr}`;
  if (diffDays === 1) return `Завтра, ${timeStr}`;
  if (diffDays === -1) return `Вчера, ${timeStr}`;
  if (diffDays > 1 && diffDays < 7) {
    const days = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    return `${days[date.getDay()]}, ${timeStr}`;
  }
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short'
  }).replace('.', '') + `, ${timeStr}`;
};

const getPositionName = (position: number): string => {
  switch (position) {
    case 1:
      return 'Вратарь';
    case 2:
      return 'Защитник';
    case 3:
      return 'Нападающий';
    default:
      return 'Не указано';
  }
};

const getPositionIcon = (position: number): string => {
  switch (position) {
    case 1:
      return '🥅';
    case 2:
      return '🛡️';
    case 3:
      return '⚡';
    default:
      return '🏒';
  }
};

const getHandednessName = (handedness: number): string => {
  switch (handedness) {
    case 1:
      return 'Левый хват';
    case 2:
      return 'Правый хват';
    default:
      return 'Не указано';
  }
};

const calculateAge = (birthDate: string): number | null => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Функция для получения цвета дивизиона
const getLeagueColor = (leagueName: string): string => {
  const colors = [
    "#d32f2f", // Красный
    "#1976d2", // Синий
    "#388e3c", // Зеленый
    "#f57c00", // Оранжевый
    "#7b1fa2", // Фиолетовый
    "#c2185b", // Розовый
    "#00796b", // Бирюзовый
    "#5d4037", // Коричневый
  ];

  let hash = 0;
  for (let i = 0; i < leagueName.length; i++) {
    hash = ((hash << 5) - hash) + leagueName.charCodeAt(i);
    hash |= 0;
  }

  return colors[Math.abs(hash) % colors.length];
};

export function EventPage({ eventId, onBack }: EventPageProps) {
  const [event, setEvent] = useState<EventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Состояние для комментария
  const [attendanceNote, setAttendanceNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);

  // Состояние для модального окна игрока
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDetails | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [loadingPlayer, setLoadingPlayer] = useState(false);

  // Выбираем игрока ОДИН РАЗ из пропсов
  const storedUser = localStorage.getItem("currentUser");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const [selectedUserId] = useState<string | null>(
    currentUser?.id ?? null
  );

  // ==== СОСТАВ ====
  const [creatingLine, setCreatingLine] = useState(false);
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);

  // 👉 индекс редактируемого звена
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(
    null
  );

  // 👉 состояние для переименования
  const [renamingLineId, setRenamingLineId] = useState<string | null>(null);
  const [newLineName, setNewLineName] = useState("");

  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const emptySlots: Record<Slot, AttendanceLookUpDto | null> = {
    LW: null,
    C: null,
    RW: null,
    LD: null,
    RD: null,
  };

  const [lineSlots, setLineSlots] = useState(emptySlots);

  // Загружаем событие
  useEffect(() => {
    getEvent(eventId)
      .then(setEvent)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  // 👉 Сортируем звенья по order
  const sortedRoster = event?.roster?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [];

  const myAttendance = event?.attendances?.find(
    (a) => a.userId === selectedUserId
  );

  // Устанавливаем текущий комментарий при загрузке
  useEffect(() => {
    if (myAttendance?.notes) {
      setAttendanceNote(myAttendance.notes);
    }
  }, [myAttendance]);

  // ===== УБИРАЕМ ИГРОКОВ, КОТОРЫЕ УЖЕ В ЗВЕНАХ =====
  const usedUserIds = new Set<string>();

  event?.roster?.forEach((line, idx) => {
    // Если мы редактируем ЭТО звено — его игроков временно НЕ блокируем
    if (idx === editingLineIndex) return;

    line.members?.forEach((p) => usedUserIds.add(p.userId));
  });

  Object.values(lineSlots).forEach((p) => {
    if (p) usedUserIds.add(p.userId);
  });

  const availablePlayers =
    event?.attendances
      ?.filter((a) => a.status === 2 && !usedUserIds.has(a.userId)) ?? [];

  const handleVote = async (status: number, notes?: string | null) => {
    if (!event) return;

    if (!selectedUserId) {
      setError("Нет текущего пользователя");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await updateAttendance(event.id, selectedUserId, status, notes);
      const updated = await getEvent(eventId);
      setEvent(updated);
      setShowNoteInput(false);
      setIsEditingNote(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!event || !myAttendance) return;

    await handleVote(myAttendance.status, attendanceNote);
  };

  // Функция для открытия информации об игроке
  const handleOpenPlayerInfo = async (userId: string) => {
    setLoadingPlayer(true);
    try {
      const playerData = await getUserById(userId);
      setSelectedPlayer(playerData);
      setIsPlayerModalOpen(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingPlayer(false);
    }
  };

  const selectForSlot = (player: AttendanceLookUpDto) => {
    if (!activeSlot) return;

    setLineSlots((prev) => ({
      ...prev,
      [activeSlot]: player,
    }));

    setActiveSlot(null);
  };

  const clearSlot = (slot: Slot) => {
    setLineSlots((prev) => ({
      ...prev,
      [slot]: null,
    }));
  };

  // ===============================
  // 👉 СОЗДАНИЕ НОВОГО ЗВЕНА
  // ===============================
  const saveLine = async () => {
    if (!event) return;
    if (!currentUser?.id) {
      setError("Необходимо авторизоваться");
      return;
    }

    const players = Object.entries(lineSlots)
      .filter(([_, p]) => p !== null)
      .map(([slot, p]) => ({
        userId: (p as AttendanceLookUpDto).userId,
        role: slotToRole[slot as Slot],
      }));

    // Используем sortedRoster для определения следующего order
    const nextOrder = sortedRoster.length > 0
      ? Math.max(...sortedRoster.map(l => l.order || 0)) + 1
      : 1;

    const body: CreateUpdateRosterRequest = {
      eventId: event.id,
      lines: [
        {
          name: `Звено ${nextOrder}`,
          order: nextOrder,
          players,
        },
      ],
    };

    try {
      await createLineRoster(body, currentUser.id);
      const updated = await getEvent(eventId);
      setEvent(updated);
      setCreatingLine(false);
      setEditingLineIndex(null);
      setLineSlots(emptySlots);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const deleteLine = async (lineId: string) => {
    if (!event?.roster) return;
    if (!currentUser?.id) {
      setError("Необходимо авторизоваться");
      return;
    }

    // Сортируем текущий ростер
    const currentSorted = [...event.roster].sort((a, b) => (a.order || 0) - (b.order || 0));

    const newLines = currentSorted
      .filter((l) => l.id !== lineId)
      .map((line, index) => ({
        name: line.name,
        order: index + 1,
        players:
          line.members?.map((p) => ({
            userId: p.userId,
            role: p.role,
          })) ?? [],
      }));

    const body: CreateUpdateRosterRequest = {
      eventId: event.id,
      lines: newLines,
    };

    try {
      await updateLineRoster(body, currentUser.id);
      const updated = await getEvent(eventId);
      setEvent(updated);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // ===============================
  // 👉 НАЧАТЬ РЕДАКТИРОВАНИЕ ЗВЕНА
  // ===============================
  const startEditLine = (index: number) => {
    if (!sortedRoster || index < 0 || index >= sortedRoster.length) return;

    const line = sortedRoster[index];

    const slots: Record<Slot, AttendanceLookUpDto | null> = {
      LW: null,
      C: null,
      RW: null,
      LD: null,
      RD: null,
    };

    line.members?.forEach((p) => {
      const role = p.role as PlayerRole;
      const slot = roleToSlot[role];

      if (slot) {
        slots[slot] = {
          userId: p.userId,
          jerseyNumber: p.jerseyNumber,
          firstName: p.firstName,
          lastName: p.lastName,
          primaryPosition: 0,
          handedness: 0,
          status: 2,
          respondedAt: new Date().toISOString(),
        } as AttendanceLookUpDto;
      }
    });

    setLineSlots(slots);
    setCreatingLine(true);
    setEditingLineIndex(index);
  };

  // ===============================
  // 👉 СОХРАНИТЬ РЕДАКТИРОВАННОЕ ЗВЕНО
  // ===============================
  const saveEditedLine = async () => {
    if (!event || editingLineIndex === null) return;
    if (!currentUser?.id) {
      setError("Необходимо авторизоваться");
      return;
    }

    const newPlayers = Object.entries(lineSlots)
      .filter(([_, p]) => p !== null)
      .map(([slot, p]) => ({
        userId: (p as AttendanceLookUpDto).userId,
        role: slotToRole[slot as Slot],
      }));

    // Собираем ПОЛНЫЙ сортированный ростер для PUT
    const linesForPut = sortedRoster.map((line, idx) => {
      if (idx === editingLineIndex) {
        return {
          name: line.name,
          order: line.order,
          players: newPlayers,
        };
      }

      return {
        name: line.name,
        order: line.order,
        players:
          line.members?.map((p) => ({
            userId: p.userId,
            role: p.role,
          })) ?? [],
      };
    });

    const body: CreateUpdateRosterRequest = {
      eventId: event.id,
      lines: linesForPut,
    };

    try {
      await updateLineRoster(body, currentUser.id);
      const updated = await getEvent(eventId);
      setEvent(updated);

      setCreatingLine(false);
      setEditingLineIndex(null);
      setLineSlots(emptySlots);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // ===============================
  // 👉 ПЕРЕИМЕНОВАТЬ ЗВЕНО
  // ===============================
  const startRenameLine = (lineId: string, currentName: string) => {
    setRenamingLineId(lineId);
    setNewLineName(currentName);
  };

  const saveRenamedLine = async () => {
    if (!event || !renamingLineId) return;
    if (!currentUser?.id) {
      setError("Необходимо авторизоваться");
      return;
    }

    const linesForPut = sortedRoster.map((line) => {
      if (line.id === renamingLineId) {
        return {
          name: newLineName || line.name,
          order: line.order,
          players:
            line.members?.map((p) => ({
              userId: p.userId,
              role: p.role,
            })) ?? [],
        };
      }

      return {
        name: line.name,
        order: line.order,
        players:
          line.members?.map((p) => ({
            userId: p.userId,
            role: p.role,
          })) ?? [],
      };
    });

    const body: CreateUpdateRosterRequest = {
      eventId: event.id,
      lines: linesForPut,
    };

    try {
      await updateLineRoster(body, currentUser.id);
      const updated = await getEvent(eventId);
      setEvent(updated);
      setRenamingLineId(null);
      setNewLineName("");
    } catch (e: any) {
      setError(e.message);
    }
  };

  // ===============================
  // 👉 ИЗМЕНИТЬ ПОРЯДОК ЗВЕНА
  // ===============================
  const moveLineUp = async (index: number) => {
    if (!event || !sortedRoster || index <= 0) return;
    if (!currentUser?.id) {
      setError("Необходимо авторизоваться");
      return;
    }

    const newRoster = [...sortedRoster];
    const temp = newRoster[index];
    newRoster[index] = newRoster[index - 1];
    newRoster[index - 1] = temp;

    // Обновляем порядок
    const linesForPut = newRoster.map((line, idx) => ({
      name: line.name,
      order: idx + 1,
      players:
        line.members?.map((p) => ({
          userId: p.userId,
          role: p.role,
        })) ?? [],
    }));

    const body: CreateUpdateRosterRequest = {
      eventId: event.id,
      lines: linesForPut,
    };

    try {
      await updateLineRoster(body, currentUser.id);
      const updated = await getEvent(eventId);
      setEvent(updated);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const moveLineDown = async (index: number) => {
    if (!event || !sortedRoster || index >= sortedRoster.length - 1) return;
    if (!currentUser?.id) {
      setError("Необходимо авторизоваться");
      return;
    }

    const newRoster = [...sortedRoster];
    const temp = newRoster[index];
    newRoster[index] = newRoster[index + 1];
    newRoster[index + 1] = temp;

    // Обновляем порядок
    const linesForPut = newRoster.map((line, idx) => ({
      name: line.name,
      order: idx + 1,
      players:
        line.members?.map((p) => ({
          userId: p.userId,
          role: p.role,
        })) ?? [],
    }));

    const body: CreateUpdateRosterRequest = {
      eventId: event.id,
      lines: linesForPut,
    };

    try {
      await updateLineRoster(body, currentUser.id);
      const updated = await getEvent(eventId);
      setEvent(updated);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // ======== КРУЖКИ ДЛЯ ЗВЕНА ========
  const LineCircles = ({
    members,
  }: {
    members?: PlayerLookUpDto[] | null;
  }) => {
    const slots: Record<Slot, PlayerLookUpDto | null> = {
      LW: null,
      C: null,
      RW: null,
      LD: null,
      RD: null,
    };

    members?.forEach((p) => {
      const role = p.role as PlayerRole;
      const slot = roleToSlot[role];
      if (slot) slots[slot] = p;
    });

    const renderCircle = (slot: Slot) => (
      <div key={slot} style={{ textAlign: "center", width: "70px" }}>
        <div
          onClick={() => {
            const player = slots[slot];
            if (player) {
              handleOpenPlayerInfo(player.userId);
            }
          }}
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            border: "2px solid #1976d2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#e3f2fd",
            margin: "0 auto 4px auto",
            fontSize: "20px",
            fontWeight: "600",
            color: "#1a237e",
            cursor: slots[slot] ? "pointer" : "default",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            if (slots[slot]) {
              e.currentTarget.style.backgroundColor = "#bbdefb";
              e.currentTarget.style.transform = "scale(1.05)";
            }
          }}
          onMouseLeave={(e) => {
            if (slots[slot]) {
              e.currentTarget.style.backgroundColor = "#e3f2fd";
              e.currentTarget.style.transform = "scale(1)";
            }
          }}
        >
          {slots[slot] ? (
            slots[slot]!.jerseyNumber ?? "?"
          ) : (
            <span style={{ color: "#666", opacity: 0.5 }}>—</span>
          )}
        </div>
        <div style={{
          fontSize: "10px",
          color: "#666",
          fontWeight: "500",
          marginBottom: "4px"
        }}>
          {slot === "LW" ? "ЛН" :
            slot === "C" ? "ЦН" :
              slot === "RW" ? "ПН" :
                slot === "LD" ? "ЛЗ" : "ПЗ"}
        </div>
        {slots[slot] && (
          <div style={{
            fontSize: "11px",
            color: "#333",
            lineHeight: "1.2",
            height: "26px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            cursor: "pointer",
            transition: "color 0.2s ease"
          }}
            onClick={() => handleOpenPlayerInfo(slots[slot]!.userId)}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#1976d2";
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#333";
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            {slots[slot]!.lastName}
          </div>
        )}
      </div>
    );

    return (
      <div style={{ marginTop: "12px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-around",
          marginBottom: "8px",
          flexWrap: "wrap"
        }}>
          {(["LW", "C", "RW"] as Slot[]).map(renderCircle)}
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-around",
          flexWrap: "wrap"
        }}>
          {(["LD", "RD"] as Slot[]).map(renderCircle)}
        </div>
      </div>
    );
  };

  const renderAttendance = (event: EventDto) => (
    <div style={{
      backgroundColor: "white",
      borderRadius: "16px",
      padding: "20px",
      marginBottom: "20px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
    }}>
      <h3 style={{
        margin: "0 0 16px 0",
        fontSize: "18px",
        fontWeight: "600",
        color: "#1a237e",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        <span>👥</span>
        <span>Явка игроков ({event.attendances?.length || 0})</span>
      </h3>

      <div style={{ marginBottom: "16px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "8px",
          fontSize: "14px",
          color: "#666"
        }}>
          <span>Готовы:</span>
          <span style={{ fontWeight: "600", color: "#4caf50" }}>
            {event.attendances?.filter(a => a.status === 2).length || 0}
          </span>
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "8px",
          fontSize: "14px",
          color: "#666"
        }}>
          <span>Не готовы:</span>
          <span style={{ fontWeight: "600", color: "#f44336" }}>
            {event.attendances?.filter(a => a.status === 3).length || 0}
          </span>
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "14px",
          color: "#666"
        }}>
          <span>Не ответили:</span>
          <span style={{ fontWeight: "600", color: "#ff9800" }}>
            {event.attendances?.filter(a => a.status === 1).length || 0}
          </span>
        </div>
      </div>

      <div style={{
        maxHeight: "400px",
        overflowY: "auto",
        border: "1px solid #e0e0e0",
        borderRadius: "10px",
        padding: "8px"
      }}>
        {event.attendances?.map((a: AttendanceLookUpDto) => (
          <div
            key={a.userId}
            style={{
              padding: "12px",
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              cursor: "pointer",
              transition: "background-color 0.2s ease"
            }}
            onClick={() => handleOpenPlayerInfo(a.userId)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: a.status === 2 ? "#e8f5e9" :
                    a.status === 3 ? "#ffebee" : "#fff3e0",
                  color: a.status === 2 ? "#2e7d32" :
                    a.status === 3 ? "#c62828" : "#ef6c00",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "600",
                  fontSize: "14px",
                  flexShrink: 0
                }}>
                  #{a.jerseyNumber || "?"}
                </div>
                <div>
                  <div style={{
                    fontWeight: "500",
                    fontSize: "15px",
                    color: "#1a237e",
                    transition: "color 0.2s ease"
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#1976d2";
                      e.currentTarget.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#1a237e";
                      e.currentTarget.style.textDecoration = "none";
                    }}
                  >
                    {a.firstName} {a.lastName}
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: "13px",
                color: a.status === 2 ? "#2e7d32" :
                  a.status === 3 ? "#c62828" : "#ff9800",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                {a.status === 2 ? "✅" : a.status === 3 ? "❌" : "⏳"}
              </div>
            </div>

            {/* Отображение комментария */}
            {a.notes && (
              <div style={{
                marginLeft: "44px",
                padding: "8px 12px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                border: "1px solid #e0e0e0",
                fontSize: "13px",
                color: "#555",
                display: "flex",
                alignItems: "flex-start",
                gap: "6px"
              }}>
                <span style={{ fontSize: "14px", color: "#666" }}>💬</span>
                <span style={{ fontStyle: "italic", lineHeight: "1.4" }}>
                  {a.notes}
                </span>
              </div>
            )}
          </div>
        )) || <div style={{ padding: "16px", textAlign: "center", color: "#666" }}>Нет данных о явке</div>}
      </div>
    </div>
  );

  const renderRoster = (event: EventDto) => (
    <div style={{
      backgroundColor: "white",
      borderRadius: "16px",
      padding: "20px",
      marginBottom: "20px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px"
      }}>
        <h3 style={{
          margin: "0",
          fontSize: "18px",
          fontWeight: "600",
          color: "#1a237e",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span>🏒</span>
          <span>Состав ({sortedRoster.length})</span>
        </h3>
        <button
          onClick={() => setCreatingLine(true)}
          style={{
            padding: "10px 16px",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1565c0";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#1976d2";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <span>+</span>
          <span>Добавить звено</span>
        </button>
      </div>

      {creatingLine && (
        <div style={{
          marginTop: "16px",
          border: "1px solid #e0e0e0",
          padding: "20px",
          borderRadius: "12px",
          backgroundColor: "#f8f9fa"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px"
          }}>
            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#1a237e" }}>
              {editingLineIndex === null
                ? "Создание нового звена"
                : `Редактирование звена ${editingLineIndex + 1}`}
            </h4>
            <button
              onClick={() => {
                setCreatingLine(false);
                setEditingLineIndex(null);
                setLineSlots(emptySlots);
                setActiveSlot(null);
              }}
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #e0e0e0",
                background: "white",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
                e.currentTarget.style.borderColor = "#d32f2f";
                e.currentTarget.style.color = "#d32f2f";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.borderColor = "#e0e0e0";
                e.currentTarget.style.color = "inherit";
              }}
            >
              ✕
            </button>
          </div>

          {/* Кружки для нападающих (верхняя строка) */}
          <div style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginBottom: "16px",
            flexWrap: "wrap"
          }}>
            {(["LW", "C", "RW"] as Slot[]).map((slot) => (
              <div key={slot} style={{ textAlign: "center", width: "70px" }}>
                <div
                  onClick={() => setActiveSlot(slot)}
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    border: `2px ${activeSlot === slot ? "solid #1976d2" : "dashed #666"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    backgroundColor: lineSlots[slot] ? "#e3f2fd" : "#fff",
                    margin: "0 auto 4px auto",
                    fontSize: "20px",
                    fontWeight: lineSlots[slot] ? "600" : "400",
                    color: lineSlots[slot] ? "#1a237e" : "#666",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!lineSlots[slot]) {
                      e.currentTarget.style.backgroundColor = "#f5f5f5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!lineSlots[slot]) {
                      e.currentTarget.style.backgroundColor = "#fff";
                    }
                  }}
                >
                  {lineSlots[slot] ? (
                    lineSlots[slot]!.jerseyNumber ?? "?"
                  ) : (
                    <span style={{ opacity: 0.7 }}>＋</span>
                  )}
                </div>

                <div style={{
                  fontSize: "10px",
                  color: "#666",
                  fontWeight: "500",
                  marginBottom: "4px"
                }}>
                  {slot === "LW" ? "ЛН" :
                    slot === "C" ? "ЦН" :
                      slot === "RW" ? "ПН" : ""}
                </div>

                {lineSlots[slot] && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSlot(slot);
                    }}
                    style={{
                      padding: "2px 8px",
                      fontSize: "10px",
                      backgroundColor: "#ffebee",
                      color: "#d32f2f",
                      border: "1px solid #ffcdd2",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Убрать
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Кружки для защитников (нижняя строка) */}
          <div style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginTop: "8px",
            marginBottom: "16px",
            flexWrap: "wrap"
          }}>
            {(["LD", "RD"] as Slot[]).map((slot) => (
              <div key={slot} style={{ textAlign: "center", width: "70px" }}>
                <div
                  onClick={() => setActiveSlot(slot)}
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    border: `2px ${activeSlot === slot ? "solid #1976d2" : "dashed #666"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    backgroundColor: lineSlots[slot] ? "#e3f2fd" : "#fff",
                    margin: "0 auto 4px auto",
                    fontSize: "20px",
                    fontWeight: lineSlots[slot] ? "600" : "400",
                    color: lineSlots[slot] ? "#1a237e" : "#666",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!lineSlots[slot]) {
                      e.currentTarget.style.backgroundColor = "#f5f5f5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!lineSlots[slot]) {
                      e.currentTarget.style.backgroundColor = "#fff";
                    }
                  }}
                >
                  {lineSlots[slot] ? (
                    lineSlots[slot]!.jerseyNumber ?? "?"
                  ) : (
                    <span style={{ opacity: 0.7 }}>＋</span>
                  )}
                </div>

                <div style={{
                  fontSize: "10px",
                  color: "#666",
                  fontWeight: "500",
                  marginBottom: "4px"
                }}>
                  {slot === "LD" ? "ЛЗ" : "ПЗ"}
                </div>

                {lineSlots[slot] && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSlot(slot);
                    }}
                    style={{
                      padding: "2px 8px",
                      fontSize: "10px",
                      backgroundColor: "#ffebee",
                      color: "#d32f2f",
                      border: "1px solid #ffcdd2",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Убрать
                  </button>
                )}
              </div>
            ))}
          </div>

          {activeSlot && (
            <div style={{
              marginTop: "16px",
              borderTop: "1px solid #e0e0e0",
              paddingTop: "16px"
            }}>
              <h4 style={{
                margin: "0 0 12px 0",
                fontSize: "16px",
                fontWeight: "500",
                color: "#333"
              }}>
                Выберите игрока для позиции {
                  activeSlot === "LW" ? "Левый нападающий" :
                    activeSlot === "C" ? "Центральный нападающий" :
                      activeSlot === "RW" ? "Правый нападающий" :
                        activeSlot === "LD" ? "Левый защитник" : "Правый защитник"
                }
              </h4>
              <div style={{
                maxHeight: "200px",
                overflowY: "auto",
                border: "1px solid #e0e0e0",
                borderRadius: "8px"
              }}>
                {availablePlayers.length > 0 ? (
                  availablePlayers.map((p) => (
                    <div
                      key={p.userId}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f0f0f0",
                        cursor: "pointer",
                        transition: "background-color 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                      }}
                      onClick={() => selectForSlot(p)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f5f5f5";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#fff";
                      }}
                    >
                      <div style={{
                        width: "36px",
                        height: "36px",
                        backgroundColor: "#1976d2",
                        color: "white",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "600",
                        fontSize: "14px",
                        flexShrink: 0
                      }}>
                        #{p.jerseyNumber || "?"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "500", fontSize: "15px" }}>
                          {p.firstName} {p.lastName}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "24px", textAlign: "center", color: "#666" }}>
                    Нет доступных игроков
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={editingLineIndex === null ? saveLine : saveEditedLine}
            style={{
              width: "100%",
              padding: "14px",
              marginTop: "16px",
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#388e3c";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#4caf50";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span>💾</span>
            <span>{editingLineIndex === null ? "Добавить звено" : "Сохранить изменения"}</span>
          </button>
        </div>
      )}

      {/* 👉 ИСПОЛЬЗУЕМ sortedRoster вместо event.roster */}
      {sortedRoster.length > 0 ? (
        sortedRoster.map((line: LineDto, idx) => (
          <div
            key={line.id}
            style={{
              marginTop: "20px",
              padding: "16px",
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              backgroundColor: "#fff"
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
              flexWrap: "wrap",
              gap: "8px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {renamingLineId === line.id ? (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flex: 1 }}>
                    <input
                      type="text"
                      value={newLineName}
                      onChange={(e) => setNewLineName(e.target.value)}
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #1976d2",
                        borderRadius: "8px",
                        fontSize: "15px",
                        flex: 1,
                        minWidth: "120px"
                      }}
                      placeholder="Название звена"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRenamedLine();
                        if (e.key === 'Escape') setRenamingLineId(null);
                      }}
                    />
                    <button
                      onClick={saveRenamedLine}
                      style={{
                        padding: "8px",
                        backgroundColor: "#4caf50",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer"
                      }}
                    >
                      💾
                    </button>
                    <button
                      onClick={() => setRenamingLineId(null)}
                      style={{
                        padding: "8px",
                        backgroundColor: "#f5f5f5",
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        cursor: "pointer"
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <strong style={{ fontSize: "16px", color: "#1a237e" }}>
                      {line.name ?? `Звено ${line.order}`}
                    </strong>
                    <button
                      onClick={() => startRenameLine(line.id, line.name || `Звено ${line.order}`)}
                      style={{
                        padding: "6px 8px",
                        backgroundColor: "#f5f5f5",
                        border: "1px solid #e0e0e0",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                      title="Переименовать"
                    >
                      📝
                    </button>
                  </>
                )}
              </div>

              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={() => moveLineUp(idx)}
                  disabled={idx === 0}
                  style={{
                    padding: "6px 8px",
                    backgroundColor: idx === 0 ? "#f5f5f5" : "#e3f2fd",
                    color: idx === 0 ? "#999" : "#1976d2",
                    border: "none",
                    borderRadius: "6px",
                    cursor: idx === 0 ? "not-allowed" : "pointer",
                    fontSize: "12px"
                  }}
                  title="Поднять выше"
                >
                  ⬆
                </button>
                <button
                  onClick={() => moveLineDown(idx)}
                  disabled={idx === sortedRoster.length - 1}
                  style={{
                    padding: "6px 8px",
                    backgroundColor: idx === sortedRoster.length - 1 ? "#f5f5f5" : "#e3f2fd",
                    color: idx === sortedRoster.length - 1 ? "#999" : "#1976d2",
                    border: "none",
                    borderRadius: "6px",
                    cursor: idx === sortedRoster.length - 1 ? "not-allowed" : "pointer",
                    fontSize: "12px"
                  }}
                  title="Опустить ниже"
                >
                  ⬇
                </button>
              </div>
            </div>

            <div style={{
              display: "flex",
              gap: "8px",
              marginBottom: "12px",
              flexWrap: "wrap"
            }}>
              <button
                onClick={() => startEditLine(idx)}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#1976d2",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                ✏ Редактировать
              </button>

              <button
                onClick={() => deleteLine(line.id)}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#ffebee",
                  color: "#d32f2f",
                  border: "1px solid #ffcdd2",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                🗑 Удалить
              </button>
            </div>

            <LineCircles members={line.members} />
          </div>
        ))
      ) : (
        <div style={{
          padding: "32px 16px",
          textAlign: "center",
          color: "#666",
          border: "1px dashed #e0e0e0",
          borderRadius: "12px",
          backgroundColor: "#fafafa"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>
            🏒
          </div>
          <p style={{ margin: "0 0 16px 0", fontSize: "16px" }}>
            Состав ещё не назначен
          </p>
          <button
            onClick={() => setCreatingLine(true)}
            style={{
              padding: "12px 24px",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: "500",
              cursor: "pointer"
            }}
          >
            Создать первое звено
          </button>
        </div>
      )}
    </div>
  );

  // Модальное окно с информацией об игроке
  const PlayerInfoModal = () => {
    if (!isPlayerModalOpen || !selectedPlayer) return null;

    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px"
      }}
        onClick={() => setIsPlayerModalOpen(false)}
      >
        <div style={{
          backgroundColor: "white",
          borderRadius: "20px",
          maxWidth: "500px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
        }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Заголовок модального окна */}
          <div style={{
            padding: "20px",
            borderBottom: "1px solid #e0e0e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #1a237e 0%, #283593 100%)",
            borderRadius: "20px 20px 0 0",
            color: "white"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                backgroundColor: "white",
                color: "#1a237e",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "22px"
              }}>
                #{selectedPlayer.jerseyNumber || "?"}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>
                  {selectedPlayer.lastName} {selectedPlayer.firstName}
                </h2>
              </div>
            </div>
            <button
              onClick={() => setIsPlayerModalOpen(false)}
              style={{
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "10px",
                color: "white",
                fontSize: "20px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
              }}
            >
              ✕
            </button>
          </div>

          {/* Информация об игроке */}
          <div style={{ padding: "20px" }}>
            {/* Основная информация */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "24px"
            }}>
              <div style={{
                padding: "16px",
                backgroundColor: "#f8f9fa",
                borderRadius: "12px",
                border: "1px solid #e0e0e0"
              }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                  Основная позиция
                </div>
                <div style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#1a237e",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <span>{getPositionIcon(selectedPlayer.primaryPosition || 0)}</span>
                  <span>{getPositionName(selectedPlayer.primaryPosition || 0)}</span>
                </div>
              </div>

              <div style={{
                padding: "16px",
                backgroundColor: "#f8f9fa",
                borderRadius: "12px",
                border: "1px solid #e0e0e0"
              }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                  Хват клюшки
                </div>
                <div style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#1a237e"
                }}>
                  {getHandednessName(selectedPlayer.handedness || 0)}
                </div>
              </div>
            </div>

            {/* Физические параметры */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "12px",
              marginBottom: "24px"
            }}>
              <div style={{
                padding: "12px",
                backgroundColor: "#e3f2fd",
                borderRadius: "10px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "20px", marginBottom: "4px" }}>📏</div>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "2px" }}>
                  Рост
                </div>
                <div style={{ fontSize: "16px", fontWeight: "600", color: "#1976d2" }}>
                  {selectedPlayer.height ? `${selectedPlayer.height} см` : '—'}
                </div>
              </div>

              <div style={{
                padding: "12px",
                backgroundColor: "#e8f5e9",
                borderRadius: "10px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "20px", marginBottom: "4px" }}>⚖️</div>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "2px" }}>
                  Вес
                </div>
                <div style={{ fontSize: "16px", fontWeight: "600", color: "#2e7d32" }}>
                  {selectedPlayer.weight ? `${selectedPlayer.weight} кг` : '—'}
                </div>
              </div>

              <div style={{
                padding: "12px",
                backgroundColor: "#fff3e0",
                borderRadius: "10px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "20px", marginBottom: "4px" }}>🎂</div>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "2px" }}>
                  Возраст
                </div>
                <div style={{ fontSize: "16px", fontWeight: "600", color: "#ef6c00" }}>
                  {selectedPlayer.birthDate ? `${calculateAge(selectedPlayer.birthDate)} лет` : '—'}
                </div>
              </div>
            </div>

            {/* Детальная информация */}
            <div style={{
              backgroundColor: "#f8f9fa",
              borderRadius: "12px",
              padding: "16px"
            }}>
              <h4 style={{
                margin: "0 0 16px 0",
                fontSize: "16px",
                fontWeight: "600",
                color: "#333",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <span>📋</span>
                <span>Детальная информация</span>
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#666" }}>ID игрока:</span>
                  <span style={{ fontWeight: "500", color: "#333" }}>{selectedPlayer.id.slice(0, 8)}...</span>
                </div>

                {selectedPlayer.email && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#666" }}>Email:</span>
                    <span style={{ fontWeight: "500", color: "#1976d2" }}>{selectedPlayer.email}</span>
                  </div>
                )}

                {selectedPlayer.phone && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#666" }}>Телефон:</span>
                    <span style={{ fontWeight: "500", color: "#333" }}>{selectedPlayer.phone}</span>
                  </div>
                )}

                {selectedPlayer.birthDate && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#666" }}>Дата рождения:</span>
                    <span style={{ fontWeight: "500", color: "#333" }}>
                      {new Date(selectedPlayer.birthDate).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                )}

                {selectedPlayer.secondaryPosition && selectedPlayer.secondaryPosition !== 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#666" }}>Вторая позиция:</span>
                    <span style={{ fontWeight: "500", color: "#333" }}>
                      {getPositionName(selectedPlayer.secondaryPosition)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Кнопка закрытия */}
          <div style={{
            padding: "20px",
            borderTop: "1px solid #e0e0e0",
            display: "flex",
            justifyContent: "flex-end"
          }}>
            <button
              onClick={() => setIsPlayerModalOpen(false)}
              style={{
                padding: "12px 24px",
                backgroundColor: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1565c0";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#1976d2";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div style={{
      padding: "16px",
      minHeight: "100vh",
      backgroundColor: "#f5f5f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "3px solid #e0e0e0",
          borderTopColor: "#1976d2",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 16px auto"
        }} />
        <div style={{ fontSize: "16px", fontWeight: "500", color: "#666" }}>
          Загрузка мероприятия...
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{
      padding: "16px",
      minHeight: "100vh",
      backgroundColor: "#f5f5f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{ textAlign: "center", maxWidth: "400px" }}>
        <div style={{
          fontSize: "48px",
          marginBottom: "16px",
          opacity: 0.3
        }}>
          ⚠️
        </div>
        <h3 style={{ margin: "0 0 8px 0", color: "#c62828" }}>
          Ошибка
        </h3>
        <p style={{ margin: "0 0 24px 0", color: "#666" }}>
          {error}
        </p>
        <button
          onClick={onBack}
          style={{
            padding: "12px 24px",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          Назад к списку
        </button>
      </div>
    </div>
  );

  if (!event) return (
    <div style={{
      padding: "16px",
      minHeight: "100vh",
      backgroundColor: "#f5f5f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: "48px",
          marginBottom: "16px",
          opacity: 0.3
        }}>
          🗓️
        </div>
        <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>
          Событие не найдено
        </h3>
        <button
          onClick={onBack}
          style={{
            padding: "12px 24px",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          Назад к списку
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      padding: "0",
      minHeight: "100vh",
      backgroundColor: "#f5f5f5",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxSizing: "border-box"
    }}>
      {/* Хедер */}
      <div style={{
        backgroundColor: "white",
        padding: "16px",
        borderBottom: "1px solid #e0e0e0",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "12px"
        }}>
          <button
            onClick={onBack}
            style={{
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #e0e0e0",
              background: "white",
              fontSize: "20px",
              cursor: "pointer",
              borderRadius: "10px",
              marginRight: "12px",
              flexShrink: 0,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
              e.currentTarget.style.borderColor = "#1976d2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
              e.currentTarget.style.borderColor = "#e0e0e0";
            }}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <CurrentPlayerHeader />
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div style={{ padding: "16px", paddingBottom: "100px" }}>
        {/* Карточка с информацией о событии */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "8px"
          }}>
            <span style={{
              fontSize: "14px",
              color: "#fff",
              backgroundColor: getEventTypeColor(event.type as EventType),
              padding: "4px 12px",
              borderRadius: "20px",
              fontWeight: "600"
            }}>
              {getEventTypeName(event.type as EventType)}
            </span>
            <span style={{
              fontSize: "18px",
              color: "#666",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              🕒 {formatDate(event.startTime)}
            </span>

            {/* Плашка дивизиона только для матчей */}
            {event.type === EventType.Game && event.leagueName && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: getLeagueColor(event.leagueName),
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "500",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)"
              }}>
                <span style={{ fontSize: "14px" }}>🏆</span>
                <span>{event.leagueName}</span>
              </div>
            )}
          </div>

          {/* Для матчей показываем команды */}
          {event.type === EventType.Game && event.homeTeamName && event.awayTeamName && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "16px",
              padding: "12px 16px",
              backgroundColor: "#f8f9fa",
              borderRadius: "12px",
              border: "1px solid #e0e0e0"
            }}>
              <span style={{ fontSize: "16px", fontWeight: "700", color: "#1a237e", textAlign: "center" }}>
                {event.homeTeamName}
              </span>
              <span style={{
                fontSize: "14px",
                color: "#666",
                backgroundColor: "white",
                padding: "4px 12px",
                borderRadius: "16px",
                border: "1px solid #e0e0e0",
                fontWeight: "600"
              }}>
                VS
              </span>
              <span style={{ fontSize: "16px", fontWeight: "700", color: "#1a237e", textAlign: "center" }}>
                {event.awayTeamName}
              </span>
            </div>
          )}
        </div>
        <div style={{
          marginBottom: "20px",
        }}>
          <button
            onClick={() => setIsActionsOpen(!isActionsOpen)}
            style={{
              width: "100%",
              padding: "14px 16px",
              backgroundColor: "#f8f9fa",
              color: "#1a237e",
              border: "1px solid #e0e0e0",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e3f2fd";
              e.currentTarget.style.borderColor = "#1976d2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f8f9fa";
              e.currentTarget.style.borderColor = "#e0e0e0";
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>⚙️</span>
              <span>Действия с мероприятием</span>
            </span>
            <span style={{
              fontSize: "20px",
              transform: isActionsOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease"
            }}>
              ▼
            </span>
          </button>

          {isActionsOpen && (
            <div style={{
              marginTop: "12px",
              padding: "16px",
              backgroundColor: "#f8f9fa",
              borderRadius: "12px",
              border: "1px solid #e0e0e0",
              animation: "slideDown 0.3s ease"
            }}>
              <div style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap"
              }}>
                <button
                  onClick={() => {
                    window.location.href = `/events/${event.id}/edit`;
                  }}
                  style={{
                    flex: 1,
                    minWidth: "140px",
                    padding: "14px 20px",
                    backgroundColor: "#1976d2",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#1565c0";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#1976d2";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <span>✏️</span>
                  <span>Редактировать</span>
                </button>

                <button
                  onClick={() => {
                    window.location.href = `/events/${event.id}/delete`;
                  }}
                  style={{
                    flex: 1,
                    minWidth: "140px",
                    padding: "14px 20px",
                    backgroundColor: "#ffebee",
                    color: "#d32f2f",
                    border: "1px solid #ffcdd2",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffcdd2";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffebee";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <span>🗑️</span>
                  <span>Удалить</span>
                </button>
              </div>

              <p style={{
                margin: "16px 0 0 0",
                fontSize: "13px",
                color: "#666",
                textAlign: "center",
                borderTop: "1px solid #e0e0e0",
                paddingTop: "16px"
              }}>
                Редактирование доступно для организаторов мероприятия
              </p>
            </div>
          )}
        </div>

        {/* Описание */}
        {event.description && (
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <h3 style={{
              margin: "0 0 12px 0",
              fontSize: "16px",
              fontWeight: "600",
              color: "#333",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span>📝</span>
              <span>Описание</span>
            </h3>
            <p style={{
              margin: 0,
              fontSize: "15px",
              color: "#555",
              lineHeight: "1.6"
            }}>
              {event.description}
            </p>
          </div>
        )}

        {/* Место проведения */}
        {(event.locationName || event.locationAddress || event.iceRinkNumber) && (
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <h3 style={{
              margin: "0 0 16px 0",
              fontSize: "16px",
              fontWeight: "600",
              color: "#333",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span>📍</span>
              <span>Место проведения</span>
            </h3>
            {event.locationName && (
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                marginBottom: "12px"
              }}>
                <span style={{ fontSize: "14px", color: "#666", flexShrink: 0 }}>🏢</span>
                <span style={{ fontSize: "15px", color: "#333", lineHeight: "1.4" }}>
                  {event.locationName}
                </span>
              </div>
            )}
            {event.locationAddress && (
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                marginBottom: "12px"
              }}>
                <span style={{ fontSize: "14px", color: "#666", flexShrink: 0 }}>🗺️</span>
                <span style={{ fontSize: "15px", color: "#333", lineHeight: "1.4" }}>
                  {event.locationAddress}
                </span>
              </div>
            )}
            {event.iceRinkNumber && (
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px"
              }}>
                <span style={{ fontSize: "14px", color: "#666", flexShrink: 0 }}>🏒</span>
                <span style={{ fontSize: "15px", color: "#333", lineHeight: "1.4" }}>
                  {event.iceRinkNumber}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Твой ответ */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <h3 style={{
            margin: "0 0 16px 0",
            fontSize: "16px",
            fontWeight: "600",
            color: "#333",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span>🎯</span>
            <span>Твой ответ</span>
          </h3>

          {(!myAttendance || myAttendance.status === 1) ? (
            <>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
                <button
                  disabled={submitting}
                  onClick={() => handleVote(2, attendanceNote || null)}
                  style={{
                    flex: 1,
                    minWidth: "140px",
                    padding: "14px 16px",
                    backgroundColor: "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.backgroundColor = "#388e3c";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.backgroundColor = "#4caf50";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  <span>✅</span>
                  <span>Смогу</span>
                </button>
                <button
                  disabled={submitting}
                  onClick={() => handleVote(3, attendanceNote || null)}
                  style={{
                    flex: 1,
                    minWidth: "140px",
                    padding: "14px 16px",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.backgroundColor = "#d32f2f";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.backgroundColor = "#f44336";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  <span>❌</span>
                  <span>Не смогу</span>
                </button>
              </div>

              {/* Кнопка добавить комментарий */}
              {!showNoteInput ? (
                <button
                  onClick={() => setShowNoteInput(true)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    backgroundColor: "#f5f5f5",
                    color: "#666",
                    border: "1px solid #e0e0e0",
                    borderRadius: "10px",
                    fontSize: "15px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e0e0e0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                  }}
                >
                  <span>💬</span>
                  <span>Добавить комментарий</span>
                </button>
              ) : (
                <div style={{
                  marginTop: "12px",
                  padding: "16px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "12px",
                  border: "1px solid #e0e0e0"
                }}>
                  <div style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "12px"
                  }}>
                    <button
                      onClick={() => setAttendanceNote("Принесу пиво")}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#fff3e0",
                        color: "#ef6c00",
                        border: "1px solid #ffe0b2",
                        borderRadius: "8px",
                        fontSize: "14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        flex: 1
                      }}
                    >
                      <span>🍺</span>
                      <span>Принесу пиво</span>
                    </button>
                    <button
                      onClick={() => setAttendanceNote("После травмы")}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#e8eaf6",
                        color: "#3949ab",
                        border: "1px solid #c5cae9",
                        borderRadius: "8px",
                        fontSize: "14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        flex: 1
                      }}
                    >
                      <span>🩹</span>
                      <span>После травмы</span>
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      value={attendanceNote}
                      onChange={(e) => setAttendanceNote(e.target.value)}
                      placeholder="Введите комментарий..."
                      style={{
                        flex: 1,
                        padding: "12px",
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        fontSize: "15px",
                        backgroundColor: "white"
                      }}
                    />
                    <button
                      onClick={() => setShowNoteInput(false)}
                      style={{
                        padding: "12px 16px",
                        backgroundColor: "#f5f5f5",
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        fontSize: "14px",
                        cursor: "pointer"
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <div style={{
                padding: "16px",
                backgroundColor: myAttendance.status === 2 ? "#e8f5e9" : "#ffebee",
                color: myAttendance.status === 2 ? "#2e7d32" : "#c62828",
                borderRadius: "10px",
                marginBottom: "16px",
                border: `1px solid ${myAttendance.status === 2 ? "#c8e6c9" : "#ffcdd2"}`
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: myAttendance.notes ? "12px" : "0"
                }}>
                  <div>
                    <div style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      marginBottom: "4px"
                    }}>
                      {myAttendance.status === 2 ? "✅ Сможет" : "❌ Не сможет"}
                    </div>
                    <div style={{ fontSize: "14px", opacity: 0.8 }}>
                      Ваш ответ записан
                    </div>
                  </div>

                  {/* Кнопка редактирования комментария */}
                  {!isEditingNote ? (
                    <button
                      onClick={() => {
                        setAttendanceNote(myAttendance.notes || "");
                        setIsEditingNote(true);
                      }}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "rgba(255,255,255,0.5)",
                        border: "1px solid rgba(0,0,0,0.1)",
                        borderRadius: "8px",
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.8)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.5)";
                      }}
                    >
                      <span>💬</span>
                      <span>{myAttendance.notes ? "Изменить" : "Добавить"}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleAddNote}
                      disabled={submitting}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#4caf50",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "13px",
                        cursor: submitting ? "not-allowed" : "pointer",
                        opacity: submitting ? 0.7 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <span>💾</span>
                      <span>Сохранить</span>
                    </button>
                  )}
                </div>

                {/* Отображение текущего комментария */}
                {myAttendance.notes && !isEditingNote && (
                  <div style={{
                    padding: "8px 12px",
                    backgroundColor: "rgba(255,255,255,0.5)",
                    borderRadius: "8px",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    textAlign: "left"
                  }}>
                    <span>💬</span>
                    <span style={{ fontStyle: "italic" }}>{myAttendance.notes}</span>
                  </div>
                )}

                {/* Редактирование комментария */}
                {isEditingNote && (
                  <div style={{
                    marginTop: "12px",
                    padding: "12px",
                    backgroundColor: "rgba(255,255,255,0.5)",
                    borderRadius: "8px",
                  }}>
                    <div style={{
                      display: "flex",
                      gap: "8px",
                      marginBottom: "8px"
                    }}>
                      <button
                        onClick={() => setAttendanceNote("Принесу пиво")}
                        style={{
                          padding: "6px 10px",
                          backgroundColor: "#fff3e0",
                          color: "#ef6c00",
                          border: "1px solid #ffe0b2",
                          borderRadius: "6px",
                          fontSize: "13px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          flex: 1
                        }}
                      >
                        <span>🍺</span>
                        <span>Принесу пиво</span>
                      </button>
                      <button
                        onClick={() => setAttendanceNote("После травмы")}
                        style={{
                          padding: "6px 10px",
                          backgroundColor: "#e8eaf6",
                          color: "#3949ab",
                          border: "1px solid #c5cae9",
                          borderRadius: "6px",
                          fontSize: "13px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          flex: 1
                        }}
                      >
                        <span>🩹</span>
                        <span>После травмы</span>
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        value={attendanceNote}
                        onChange={(e) => setAttendanceNote(e.target.value)}
                        placeholder="Введите комментарий..."
                        style={{
                          flex: 1,
                          padding: "10px",
                          border: "1px solid #e0e0e0",
                          borderRadius: "6px",
                          fontSize: "14px",
                          backgroundColor: "white"
                        }}
                      />
                      <button
                        onClick={() => {
                          setIsEditingNote(false);
                          setAttendanceNote(myAttendance.notes || "");
                        }}
                        style={{
                          padding: "10px 14px",
                          backgroundColor: "#f5f5f5",
                          border: "1px solid #e0e0e0",
                          borderRadius: "6px",
                          fontSize: "13px",
                          cursor: "pointer"
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                disabled={submitting}
                onClick={() => handleVote(1)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  backgroundColor: "#f5f5f5",
                  color: "#666",
                  border: "1px solid #e0e0e0",
                  borderRadius: "10px",
                  fontSize: "15px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = "#e0e0e0";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                ↩ Отменить ответ
              </button>
            </div>
          )}

          {submitting && (
            <div style={{
              textAlign: "center",
              marginTop: "12px",
              color: "#666",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}>
              <div style={{
                width: "16px",
                height: "16px",
                border: "2px solid #e0e0e0",
                borderTopColor: "#1976d2",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }} />
              Отправка ответа...
            </div>
          )}
        </div>

        {renderAttendance(event)}
        {renderRoster(event)}
      </div>

      {/* Модальное окно с информацией об игроке */}
      <PlayerInfoModal />

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          button:focus, input:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
          }
          
          /* Стили для скроллбара в модальном окне */
          div[style*="overflowY: auto"]::-webkit-scrollbar {
            width: 8px;
          }
          
          div[style*="overflowY: auto"]::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          
          div[style*="overflowY: auto"]::-webkit-scrollbar-thumb {
            background: #1976d2;
            border-radius: 4px;
          }
          
          div[style*="overflowY: auto"]::-webkit-scrollbar-thumb:hover {
            background: #1565c0;
          }
          
          /* Для очень маленьких экранов */
          @media (max-width: 360px) {
            div[style*="padding: 16px"] {
              padding: 12px !important;
            }
            
            div[style*="padding: 20px"] {
              padding: 16px !important;
            }
            
            button[style*="padding: 14px 16px"] {
              padding: 12px !important;
              font-size: 15px !important;
            }
          }
          
          /* Для ПК */
          @media (min-width: 768px) {
            div[style*="minHeight: 100vh"] {
              max-width: 600px;
              margin: 0 auto;
              border-left: 1px solid #e0e0e0;
              border-right: 1px solid #e0e0e0;
              min-height: 100vh;
            }
          }
          
          /* Безопасные зоны для iPhone */
          @supports (padding: max(0px)) {
            div[style*="position: sticky"] {
              padding-top: max(16px, env(safe-area-inset-top, 16px));
            }
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}