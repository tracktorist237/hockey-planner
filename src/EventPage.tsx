import { useEffect, useState } from "react";
import {
  EventDto,
  AttendanceLookUpDto,
  LineDto,
  PlayerLookUpDto,
} from "./types/events";
import { getEvent, updateAttendance } from "./api/events";
import {
  CreateUpdateRosterRequest,
  PlayerRole,
} from "./types/lines";
import { updateLineRoster } from "./api/lines";
import { CurrentPlayerHeader } from "./CurrentPlayerHeader";

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

export function EventPage({ eventId, onBack }: EventPageProps) {
  const [event, setEvent] = useState<EventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Выбираем игрока ОДИН РАЗ из пропсов
  const storedUser = localStorage.getItem("currentUser");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const [selectedUserId] = useState<string | null>(
    currentUser?.id ?? null
  );

  // ==== СОСТАВ ====
  const [creatingLine, setCreatingLine] = useState(false);
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);

  // 👉 НОВОЕ: индекс редактируемого звена
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(
    null
  );

  // 👉 НОВОЕ: состояние для переименования
  const [renamingLineId, setRenamingLineId] = useState<string | null>(null);
  const [newLineName, setNewLineName] = useState("");

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

  const handleVote = async (status: number) => {
    if (!event) return;

    if (!selectedUserId) {
      setError("Нет текущего пользователя");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await updateAttendance(event.id, selectedUserId, status);
      const updated = await getEvent(eventId);
      setEvent(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
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
  // 👉 СОЗДАНИЕ НОВОГО ЗВЕНА (ИСПРАВЛЕНО)
  // ===============================
  const saveLine = async () => {
    if (!event) return;

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
      await fetch("/api/lines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

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
      await fetch("/api/lines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

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
  // 👉 СОХРАНИТЬ РЕДАКТИРОВАННОЕ ЗВЕНО (PUT)
  // ===============================
  const saveEditedLine = async () => {
    if (!event || editingLineIndex === null) return;

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
      await updateLineRoster(body);

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
  // 👉 ПЕРЕИМЕНОВАТЬ ЗВЕНО (ИСПРАВЛЕНО - добавлена проверка на event)
  // ===============================
  const startRenameLine = (lineId: string, currentName: string) => {
    setRenamingLineId(lineId);
    setNewLineName(currentName);
  };

  const saveRenamedLine = async () => {
    if (!event || !renamingLineId) return; // ✅ Добавлена проверка на event

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
      eventId: event.id, // ✅ Теперь event гарантированно не null
      lines: linesForPut,
    };

    try {
      await fetch("/api/lines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const updated = await getEvent(eventId);
      setEvent(updated);
      setRenamingLineId(null);
      setNewLineName("");
    } catch (e: any) {
      setError(e.message);
    }
  };

  // ===============================
  // 👉 ИЗМЕНИТЬ ПОРЯДОК ЗВЕНА (ИСПРАВЛЕНО - добавлена проверка на event)
  // ===============================
  const moveLineUp = async (index: number) => {
    if (!event || !sortedRoster || index <= 0) return; // ✅ Добавлена проверка на event

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
      eventId: event.id, // ✅ Теперь event гарантированно не null
      lines: linesForPut,
    };

    try {
      await fetch("/api/lines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const updated = await getEvent(eventId);
      setEvent(updated);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const moveLineDown = async (index: number) => {
    if (!event || !sortedRoster || index >= sortedRoster.length - 1) return; // ✅ Добавлена проверка на event

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
      eventId: event.id, // ✅ Теперь event гарантированно не null
      lines: linesForPut,
    };

    try {
      await fetch("/api/lines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

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
      <div key={slot} style={{ textAlign: "center" }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: "2px solid #666",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {slots[slot] ? (
            <span style={{ fontSize: 24 }}>
              {slots[slot]!.jerseyNumber ?? "?"}
            </span>
          ) : (
            <span>—</span>
          )}
        </div>

        {slots[slot] && (
          <div>
            {slots[slot]!.lastName} {slots[slot]!.firstName}
          </div>
        )}
      </div>
    );

    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          {(["LW", "C", "RW"] as Slot[]).map(renderCircle)}
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            marginTop: 12,
          }}
        >
          {(["LD", "RD"] as Slot[]).map(renderCircle)}
        </div>
      </div>
    );
  };

  const statusIcon = (status: number) => {
    switch (status) {
      case 2:
        return "✅ Сможет";
      case 3:
        return "❌ Не сможет";
      default:
        return "⏳ Не ответил";
    }
  };

  const renderAttendance = (event: EventDto) => (
    <div>
      <h3>Явка</h3>
      <ul>
        {event.attendances?.map((a: AttendanceLookUpDto) => (
          <li key={a.userId}>
            {a.firstName} {a.lastName} — {statusIcon(a.status)}
          </li>
        )) || <li>Нет данных</li>}
      </ul>
    </div>
  );

  const renderRoster = (event: EventDto) => (
    <div>
      <h3>Состав</h3>

      <button onClick={() => setCreatingLine(true)}>
        ➕ Добавить звено
      </button>

      {creatingLine && (
        <div style={{ marginTop: 16, border: "1px solid #ccc", padding: 16 }}>
          <h4>
            {editingLineIndex === null
              ? "Новое звено"
              : `Редактирование звена ${editingLineIndex + 1}`}
          </h4>
          <button
            onClick={() => {
              setCreatingLine(false);
              setEditingLineIndex(null);
              setLineSlots(emptySlots);
              setActiveSlot(null);
            }}
            style={{ marginBottom: 8, marginRight: 8 }}
          >
            ❌ Отменить редактирование
          </button>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            {(["LW", "C", "RW"] as Slot[]).map((slot) => (
              <div key={slot} style={{ textAlign: "center" }}>
                <div
                  onClick={() => setActiveSlot(slot)}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    border: "2px dashed #666",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  {lineSlots[slot] ? (
                    <span style={{ fontSize: 24 }}>
                      {lineSlots[slot]!.jerseyNumber ?? "?"}
                    </span>
                  ) : (
                    <span>＋</span>
                  )}
                </div>

                {lineSlots[slot] && (
                  <button onClick={() => clearSlot(slot)}>Отменить</button>
                )}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              marginTop: 12,
            }}
          >
            {(["LD", "RD"] as Slot[]).map((slot) => (
              <div key={slot} style={{ textAlign: "center" }}>
                <div
                  onClick={() => setActiveSlot(slot)}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    border: "2px dashed #666",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  {lineSlots[slot] ? (
                    <span style={{ fontSize: 24 }}>
                      {lineSlots[slot]!.jerseyNumber ?? "?"}
                    </span>
                  ) : (
                    <span>＋</span>
                  )}
                </div>

                {lineSlots[slot] && (
                  <button onClick={() => clearSlot(slot)}>Отменить</button>
                )}
              </div>
            ))}
          </div>

          {activeSlot && (
            <div style={{ marginTop: 16 }}>
              <h4>Выбери игрока</h4>
              <ul>
                {availablePlayers.map((p) => (
                  <li
                    key={p.userId}
                    style={{ cursor: "pointer", padding: 4 }}
                    onClick={() => selectForSlot(p)}
                  >
                    #{p.jerseyNumber ?? "-"} — {p.lastName} {p.firstName}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={
              editingLineIndex === null ? saveLine : saveEditedLine
            }
            style={{ marginTop: 12 }}
          >
            💾 {editingLineIndex === null ? "Добавить" : "Сохранить изменения"}
          </button>
        </div>
      )}

      {/* 👉 ИСПОЛЬЗУЕМ sortedRoster вместо event.roster */}
      {sortedRoster.map((line: LineDto, idx) => (
        <div
          key={line.id}
          style={{
            marginTop: 20,
            padding: 12,
            border: "1px solid #ddd",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {renamingLineId === line.id ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="text"
                  value={newLineName}
                  onChange={(e) => setNewLineName(e.target.value)}
                  style={{ padding: 4 }}
                  placeholder="Название звена"
                />
                <button onClick={saveRenamedLine} style={{ padding: "4px 8px" }}>
                  💾
                </button>
                <button onClick={() => setRenamingLineId(null)} style={{ padding: "4px 8px" }}>
                  ❌
                </button>
              </div>
            ) : (
              <>
                <strong>{line.name ?? `Звено ${line.order}`}</strong>
                <button
                  onClick={() => startRenameLine(line.id, line.name || `Звено ${line.order}`)}
                  style={{ padding: "2px 6px", fontSize: "0.8em" }}
                  title="Переименовать"
                >
                  📝
                </button>
              </>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => startEditLine(idx)}
              style={{ padding: "4px 8px", fontSize: "0.9em" }}
            >
              ✏ Состав
            </button>

            <button
              onClick={() => deleteLine(line.id)}
              style={{
                padding: "4px 8px",
                fontSize: "0.9em",
                background: "#ffebee",
              }}
            >
              🗑 Удалить
            </button>

            <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              <button
                onClick={() => moveLineUp(idx)}
                disabled={idx === 0}
                style={{ padding: "4px", fontSize: "0.8em" }}
                title="Поднять выше"
              >
                ⬆
              </button>
              <button
                onClick={() => moveLineDown(idx)}
                disabled={idx === sortedRoster.length - 1}
                style={{ padding: "4px", fontSize: "0.8em" }}
                title="Опустить ниже"
              >
                ⬇
              </button>
            </div>
          </div>

          <LineCircles members={line.members} />
        </div>
      )) || <p>Состав не назначен</p>}
    </div>
  );

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;
  if (!event) return <div>Событие не найдено</div>;

  return (
    <div style={{ padding: 16 }}>
      <CurrentPlayerHeader
        onBack={onBack}
        attendance={myAttendance ?? null}
      />

      <button
        onClick={() => {
          window.location.href = `/events/${event.id}/delete`;
        }}
        style={{
          background: "#ffebee",
          marginBottom: 12,
        }}
      >
        🗑 Удалить мероприятие
      </button>

      <h2>{event.title}</h2>
      <p>{event.description}</p>

      <h3>Твой ответ</h3>

      {(!myAttendance || myAttendance.status === 1) && (
        <div style={{ display: "flex", gap: 8 }}>
          <button disabled={submitting} onClick={() => handleVote(2)}>
            ✅ Смогу
          </button>
          <button disabled={submitting} onClick={() => handleVote(3)}>
            ❌ Не смогу
          </button>
        </div>
      )}

      {myAttendance && myAttendance.status !== 1 && (
        <div>
          <p>
            Ты ответил: <strong>{statusIcon(myAttendance.status)}</strong>
          </p>
          <button disabled={submitting} onClick={() => handleVote(1)}>
            ↩ Отменить голос
          </button>
        </div>
      )}

      {renderAttendance(event)}
      {renderRoster(event)}
    </div>
  );
}