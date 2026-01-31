import { useEffect, useState } from "react";
import { getEvents } from "./api/events";
import { EventListDto } from "./types/events";
import { EventPage } from "./EventPage";

export default function App() {
  const [events, setEvents] = useState<EventListDto | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    getEvents().then(setEvents).catch(console.error);
  }, []);

  if (selectedEventId) {
    return <EventPage eventId={selectedEventId} onBack={() => setSelectedEventId(null)} />;
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
