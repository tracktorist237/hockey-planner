import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import { getEvents } from "./api/events";
import { EventListDto } from "./types/events";
import { EventPage } from "./EventPage";
import { CreateEventPage } from "./CreateEventPage";

function EventsListPage() {
  const [events, setEvents] = useState<EventListDto | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getEvents().then(setEvents).catch(console.error);
  }, []);

  return (
    <div>
      <h1>Список мероприятий</h1>

      <button onClick={() => navigate("/events/create")}>
        ➕ Добавить событие
      </button>

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
          onClick={() => navigate(`/events/${e.id}`)}
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

function EventPageWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return <div>Некорректный ID события</div>;

  return <EventPage eventId={id} onBack={() => navigate("/")} />;
}

function CreateEventWrapper() {
  const navigate = useNavigate();

  return (
    <CreateEventPage
      onBack={() => navigate("/")}
      onCreated={(id) => navigate(`/events/${id}`)}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EventsListPage />} />
        <Route path="/events/create" element={<CreateEventWrapper />} />
        <Route path="/events/:id" element={<EventPageWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}
