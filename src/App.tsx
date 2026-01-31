import { useEffect, useState } from "react";
import { getEvents, EventListDto } from "./api/events";

export default function App() {
  const [events, setEvents] = useState<EventListDto | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    getEvents().then(setEvents).catch(console.error);
  }, []);

  if (selectedEventId) {
    return (
      <div>
        <button onClick={() => setSelectedEventId(null)}>⬅ Назад</button>
        <h2>Экран мероприятия</h2>
        <p>Здесь скоро будет явка и состав</p>
        <p>ID события: {selectedEventId}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Список мероприятий</h1>
      {events?.events?.map((e) => (
        <div
          key={e.id}
          style={{
            padding: "10px",
            margin: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={() => setSelectedEventId(e.id)}
        >
          <h3>{e.title ?? "Без названия"}</h3>
          <p>
            {new Date(e.startTime).toLocaleString()} —{" "}
            {new Date(e.endTime).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}