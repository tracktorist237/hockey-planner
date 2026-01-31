import { useEffect, useState } from "react";
import { EventDto, AttendanceLookUpDto, LineDto, PlayerLookUpDto } from "./types/events";
import { getEvent } from "./api/events";

interface EventPageProps {
  eventId: string;
  onBack: () => void;
}

export function EventPage({ eventId, onBack }: EventPageProps) {
  const [event, setEvent] = useState<EventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEvent(eventId)
      .then(setEvent)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;
  if (!event) return <div>Событие не найдено</div>;

  const renderAttendance = () => (
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

  const renderRoster = () => (
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

  return (
    <div style={{ padding: 16 }}>
      <button onClick={onBack}>⬅ Назад</button>
      <h2>{event.title}</h2>
      <p>{event.description}</p>
      <p>
        {new Date(event.startTime).toLocaleString()} —{" "}
        {new Date(event.endTime).toLocaleString()}
      </p>
      {renderAttendance()}
      {renderRoster()}
    </div>
  );
}
