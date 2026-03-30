import { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { CalendarPage } from "./CalendarPage";
import { CreateEventPage } from "./CreateEventPage";
import { CreatePlayerFormPage } from "./CreatePlayerFormPage";
import { DeleteEventPage } from "./DeleteEventPage";
import { EventPage } from "src/pages/EventPage/EventPage";
import { SettingsPage } from "./SettingsPage";
import { UpdateEventPage } from "./UpdateEventPage";
import { normalizeRole } from "./constants/roles";
import { EventsListPage } from "./pages/EventsListPage/EventsListPage";
import StartSearchPage from "./pages/StartSearchPage/StartSearchPage";
import { User } from "./types/user";

const getStoredCurrentUser = (): User | null => {
  const saved = localStorage.getItem("currentUser");
  if (!saved) {
    return null;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<User> & {
      role?: number | string | null;
    };

    if (!parsed?.id) {
      return null;
    }

    return {
      id: parsed.id,
      firstName: parsed.firstName ?? null,
      lastName: parsed.lastName ?? null,
      jerseyNumber: parsed.jerseyNumber ?? null,
      fullName: parsed.fullName,
      role: normalizeRole(parsed.role),
    };
  } catch (error) {
    console.error("Ошибка при парсинге currentUser:", error);
    localStorage.removeItem("currentUser");
    return null;
  }
};

function EventPageWrapper({
  currentUser,
}: {
  currentUser: User | null;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return <div>Некорректный ID события</div>;
  }

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

function AppRoutes() {
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    getStoredCurrentUser(),
  );
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/events" replace />} />
      <Route
        path="/start-search"
        element={
          <StartSearchPage
            onSelect={(user) => {
              setCurrentUser(user);
              localStorage.setItem("currentUser", JSON.stringify(user));
              navigate("/events");
            }}
          />
        }
      />
      <Route path="/events" element={<EventsListPage currentUser={currentUser} />} />
      <Route path="/events/create" element={<CreateEventWrapper />} />
      <Route path="/events/:id" element={<EventPageWrapper currentUser={currentUser} />} />
      <Route path="/events/:id/delete" element={<DeleteEventPage />} />
      <Route path="/create-player" element={<CreatePlayerFormPage />} />
      <Route path="/events/:id/edit" element={<UpdateEventPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
