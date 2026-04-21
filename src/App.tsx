import { ReactElement, useState } from "react";
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
import { UpdateUserPage } from "./UpdateUserPage";
import { DebugOverlay } from "src/components/DebugOverlay";
import { PermissionDenied } from "src/components/PermissionDenied";
import { normalizeRole } from "./constants/roles";
import { EventsListPage } from "./pages/EventsListPage/EventsListPage";
import StartSearchPage from "./pages/StartSearchPage/StartSearchPage";
import { User } from "./types/user";
import { AdminPushPage } from "./pages/AdminPushPage";
import { useCurrentTeam } from "./hooks/useCurrentTeam";
import { TeamsPage } from "./pages/TeamsPage";
import { canManageEvents } from "src/constants/permissions";

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
      photoUrl: parsed.photoUrl ?? null,
      spbhlPlayerId: parsed.spbhlPlayerId ?? null,
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

function CreateEventWrapper({ currentTeamId }: { currentTeamId: string | null }) {
  const navigate = useNavigate();

  return (
    <CreateEventPage
      onBack={() => navigate("/events")}
      onCreated={(id) => navigate(`/events/${id}`)}
      currentTeamId={currentTeamId}
    />
  );
}

function RequireEventManager({
  currentUser,
  children,
}: {
  currentUser: User | null;
  children: ReactElement;
}) {
  if (!canManageEvents(currentUser?.role)) {
    return (
      <PermissionDenied
        title="Недостаточно прав"
        message="Эта страница доступна только тренеру, капитану или менеджеру."
      />
    );
  }

  return children;
}

function RequireCurrentUser({
  currentUser,
  children,
}: {
  currentUser: User | null;
  children: ReactElement;
}) {
  if (!currentUser?.id) {
    return <Navigate to="/start-search" replace />;
  }

  return children;
}

function AppRoutes() {
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    getStoredCurrentUser(),
  );
  const { teamId: currentTeamId, teamName: currentTeamName, setCurrentTeam } = useCurrentTeam(currentUser?.id ?? null);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
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
        <Route
          path="/events"
          element={
            <EventsListPage
              currentUser={currentUser}
              currentTeamId={currentTeamId}
              currentTeamName={currentTeamName}
              onTeamChange={setCurrentTeam}
            />
          }
        />
        <Route
          path="/events/create"
          element={
            <RequireEventManager currentUser={currentUser}>
              <CreateEventWrapper currentTeamId={currentTeamId} />
            </RequireEventManager>
          }
        />
        <Route path="/events/:id" element={<EventPageWrapper currentUser={currentUser} />} />
        <Route
          path="/events/:id/delete"
          element={
            <RequireEventManager currentUser={currentUser}>
              <DeleteEventPage />
            </RequireEventManager>
          }
        />
        <Route path="/create-player" element={<CreatePlayerFormPage />} />
        <Route
          path="/events/:id/edit"
          element={
            <RequireEventManager currentUser={currentUser}>
              <UpdateEventPage />
            </RequireEventManager>
          }
        />
        <Route
          path="/users/:id/edit"
          element={
            <RequireCurrentUser currentUser={currentUser}>
              <UpdateUserPage />
            </RequireCurrentUser>
          }
        />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/settings" element={<SettingsPage onOpenDebug={() => setIsDebugOpen(true)} />} />
        <Route path="/admin/push" element={<AdminPushPage />} />
        <Route
          path="/teams"
          element={
            <RequireCurrentUser currentUser={currentUser}>
              <TeamsPage
                currentUser={currentUser}
                currentTeamId={currentTeamId}
                currentTeamName={currentTeamName}
                onTeamChange={setCurrentTeam}
              />
            </RequireCurrentUser>
          }
        />
      </Routes>
      <DebugOverlay isOpen={isDebugOpen} onClose={() => setIsDebugOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
