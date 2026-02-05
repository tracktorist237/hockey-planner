import { useEffect, useState } from "react";
import {
  EventDto,
  AttendanceLookUpDto,
  LineDto,
  PlayerLookUpDto,
} from "./types/events";
import { getEvent, updateAttendance } from "./api/events";
import { getUsers } from "./api/users";

interface EventPageProps {
  eventId: string;
  onBack: () => void;
}

interface User {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  jerseyNumber?: number | null;
  fullName?: string | null;
}

export function EventPage({ eventId, onBack }: EventPageProps) {
  const [event, setEvent] = useState<EventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Загружаем событие
  useEffect(() => {
    getEvent(eventId)
      .then(setEvent)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  // Загружаем пользователей
  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch((err) =>
        console.error("Ошибка загрузки пользователей:", err)
      );
  }, []);

  const filteredUsers = users.filter((u) => {
    const search = userSearch.toLowerCase();

    const matchesName =
      (u.firstName?.toLowerCase().includes(search) ?? false) ||
      (u.lastName?.toLowerCase().includes(search) ?? false);

    const matchesNumber =
      u.jerseyNumber?.toString().includes(search) ?? false;

    return matchesName || matchesNumber;
  });

  const myAttendance = event?.attendances?.find(
    (a) => a.userId === selectedUserId
  );

  const handleVote = async (status: number) => {
    if (!event) return;

    if (!selectedUserId) {
      setError("Сначала выбери пользователя");
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

  const renderAttendance = (event: EventDto) => (
    <div>
      <h3>Явка</h3>
      <ul>
        {event.attendances?.map((a: AttendanceLookUpDto) => (
          <li key={a.userId}>
            {a.firstName} {a.lastName} — Статус: {a.status}
          </li>
        )) || <li>Нет данных</li>}
      </ul>
    </div>
  );

  const renderRoster = (event: EventDto) => (
    <div>
      <h3>Состав</h3>
      {event.roster?.map((line: LineDto) => (
        <div key={line.id} style={{ marginBottom: 10 }}>
          <strong>{line.name ?? `Линия ${line.order}`}</strong>
          <ul>
            {line.members?.map((p: PlayerLookUpDto) => (
              <li key={p.userId}>
                {p.firstName} {p.lastName} — {p.role}
              </li>
            )) || <li>Нет игроков</li>}
          </ul>
        </div>
      )) || <p>Состав не назначен</p>}
    </div>
  );

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;
  if (!event) return <div>Событие не найдено</div>;

  return (
    <div style={{ padding: 16 }}>
      <button onClick={onBack}>⬅ Назад</button>

      <h2>{event.title}</h2>
      <p>{event.description}</p>
      <p>
        {new Date(event.startTime).toLocaleString()} —{" "}
        {event.endTime
          ? new Date(event.endTime).toLocaleString()
          : "без времени окончания"}
      </p>

      <h3>Выбор пользователя</h3>

      <input
        placeholder="Поиск по фамилии или номеру..."
        value={userSearch}
        onChange={(e) => setUserSearch(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />

      <div
        style={{
          border: "1px solid #ccc",
          maxHeight: 150,
          overflowY: "auto",
          marginBottom: 16,
        }}
      >
        {filteredUsers.map((u) => (
          <div
            key={u.id}
            onClick={() => setSelectedUserId(u.id)}
            style={{
              padding: 8,
              cursor: "pointer",
              background:
                selectedUserId === u.id ? "#e6f0ff" : "transparent",
            }}
          >
            #{u.jerseyNumber ?? "-"} — {u.firstName} {u.lastName}
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div style={{ padding: 8 }}>Не найдено</div>
        )}
      </div>

      {selectedUserId && (
        <p>
          Выбран:{" "}
          <strong>
            {
              users.find((u) => u.id === selectedUserId)
                ?.firstName
            }{" "}
            {
              users.find((u) => u.id === selectedUserId)
                ?.lastName
            }
          </strong>
        </p>
      )}

      <h3>Твой ответ</h3>

      {!myAttendance && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            disabled={submitting}
            onClick={() => handleVote(2)}
          >
            ✅ Смогу
          </button>
          <button
            disabled={submitting}
            onClick={() => handleVote(3)}
          >
            ❌ Не смогу
          </button>
        </div>
      )}

      {myAttendance && (
        <div>
          <p>
            Ты ответил:{" "}
            <strong>{myAttendance.status}</strong>
          </p>
          <button
            disabled={submitting}
            onClick={() => handleVote(1)}
          >
            ↩ Отменить голос
          </button>
        </div>
      )}

      {renderAttendance(event)}
      {renderRoster(event)}
    </div>
  );
}
