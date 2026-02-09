import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";
import { getEvents } from "./api/events";
import { getUsers } from "./api/users";
import { EventListDto } from "./types/events";
import { EventPage } from "./EventPage";
import { CreateEventPage } from "./CreateEventPage";
import { DeleteEventPage } from "./DeleteEventPage";
import { CreatePlayerFormPage } from "./CreatePlayerFormPage";

interface User {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  jerseyNumber?: number | null;
}

/* ===================== СТАРТОВАЯ СТРАНИЦА ПОИСКА ===================== */

function StartSearchPage({
  onSelect,
}: {
  onSelect: (u: User) => void;
}) {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getUsers().then(setUsers).catch(console.error);
  }, []);

  const filtered = users.filter((u) => {
    const s = search.toLowerCase();
    return (
      u.firstName?.toLowerCase().includes(s) ||
      u.lastName?.toLowerCase().includes(s) ||
      u.jerseyNumber?.toString().includes(s)
    );
  });

  return (
    <div style={{ padding: 16, maxWidth: 600, margin: "0 auto" }}>
      <h2>Найди себя в списке по номеру, фамилии или имени</h2>

      <input
        placeholder="Поиск..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", marginBottom: 8, padding: 8 }}
      />

      <div
        style={{
          border: "1px solid #ccc",
          maxHeight: 200,
          overflowY: "auto",
        }}
      >
        {filtered.map((u) => (
          <div
            key={u.id}
            style={{ padding: 8, cursor: "pointer" }}
            onClick={() => onSelect(u)}
          >
            #{u.jerseyNumber ?? "-"} — {u.firstName} {u.lastName}
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ padding: 8 }}>Не найдено</div>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <p>Не нашёл? Тогда добавь себя</p>
        <button onClick={() => navigate("/create-player")}>
          ➕ Анкета игрока
        </button>
      </div>
    </div>
  );
}

/* ===================== СПИСОК МЕРОПРИЯТИЙ ===================== */

function EventsListPage({
  currentUser,
}: {
  currentUser: User | null;
}) {
  const [events, setEvents] = useState<EventListDto | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getEvents().then(setEvents).catch(console.error);
  }, []);

  return (
    <div style={{ padding: 16 }}>
      {currentUser && (
        <div style={{ textAlign: "right", fontWeight: "bold" }}>
          {currentUser.lastName} {currentUser.firstName} #
          {currentUser.jerseyNumber}
        </div>
      )}

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

/* ===================== ОБЁРТКИ ДЛЯ СТРАНИЦ ===================== */

function EventPageWrapper({
  currentUser,
}: {
  currentUser: User | null;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return <div>Некорректный ID события</div>;

  return (
    <EventPage
      eventId={id}
      onBack={() => navigate("/events")}
      currentUser={currentUser}
    />
  );
}

function CreateEventWrapper() {
  const navigate = useNavigate();

  return (
    <CreateEventPage
      onBack={() => navigate("/events")}
      onCreated={(id) => navigate(`/events/${id}`)}
    />
  );
}

/* ===================== ГЛАВНЫЙ APP (БЕЗ useNavigate!) ===================== */

function AppRoutes() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  });

  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <StartSearchPage
            onSelect={(u) => {
              setCurrentUser(u);
              localStorage.setItem("currentUser", JSON.stringify(u));
              navigate("/events");
            }}
          />
        }
      />

      <Route
        path="/events"
        element={<EventsListPage currentUser={currentUser} />}
      />

      <Route
        path="/events/create"
        element={<CreateEventWrapper />}
      />

      <Route
        path="/events/:id"
        element={<EventPageWrapper currentUser={currentUser} />}
      />
      <Route
        path="/events/:id/delete"
        element={<DeleteEventPage />}
      />
      <Route
        path="/create-player"
        element={<CreatePlayerFormPage />}
      />
    </Routes>
  );
}


/* ===================== РЕАЛЬНЫЙ App ===================== */

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
