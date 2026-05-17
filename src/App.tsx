import { ReactElement } from "react";
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
import { SettingsPage } from "./SettingsPage";
import { UpdateEventPage } from "./UpdateEventPage";
import { UpdateUserPage } from "./UpdateUserPage";
import { AdminPushPage } from "src/pages/AdminPushPage";
import { AuthPage } from "src/pages/AuthPage";
import { ConfirmEmailPage } from "src/pages/ConfirmEmailPage";
import { EventPage } from "src/pages/EventPage/EventPage";
import { EventsListPage } from "src/pages/EventsListPage/EventsListPage";
import { LinkPlayerPage } from "src/pages/LinkPlayerPage";
import { TeamDetailsPage } from "src/pages/TeamDetailsPage/TeamDetailsPage";
import { TeamManagePage } from "src/pages/TeamDetailsPage/TeamManagePage";
import { TeamsPage } from "src/pages/TeamsPage";
import { ProfilePage } from "src/pages/ProfilePage";
import StartSearchPage from "src/pages/StartSearchPage/StartSearchPage";
import { DebugOverlay } from "src/components/DebugOverlay";
import { PermissionDenied } from "src/components/PermissionDenied";
import { useCurrentTeam } from "src/hooks/useCurrentTeam";
import { useAuth } from "src/hooks/useAuth";
import { AuthProvider } from "src/context/AuthContext";
import { ThemeProvider } from "src/context/ThemeContext";
import { shouldRunOnboarding } from "src/utils/onboarding";
import { useEffect, useState } from "react";
import { getMyTeams } from "src/api/teams";

function EventPageWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  if (!id) {
    return <div>Некорректный ID события</div>;
  }

  return <EventPage eventId={id} onBack={() => navigate("/events")} currentUser={currentUser} />;
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

function RequireAuth({ children }: { children: ReactElement }) {
  const { authLoading, isAuthenticated } = useAuth();

  if (authLoading) {
    return <div style={{ padding: 24 }}>Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RequireOnboardingComplete({ children }: { children: ReactElement }) {
  const { currentUser } = useAuth();

  if (shouldRunOnboarding(currentUser)) {
    return <Navigate to="/onboarding/link-player" replace />;
  }

  return children;
}

function RequireEventManager({ children }: { children: ReactElement }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [canManageTeamEvents, setCanManageTeamEvents] = useState(false);

  useEffect(() => {
    if (!currentUser?.id) {
      setCanManageTeamEvents(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    void getMyTeams(currentUser.id)
      .then((teams) => {
        setCanManageTeamEvents(teams.some((team) => team.myRole === 1 || team.myRole === 2));
      })
      .catch(() => setCanManageTeamEvents(false))
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  if (loading) {
    return <div style={{ padding: 24 }}>Проверяем права...</div>;
  }

  if (!canManageTeamEvents) {
    return (
      <PermissionDenied
        title="Недостаточно прав"
        message="Эта страница доступна владельцу или администратору команды."
      />
    );
  }

  return children;
}

function RequireOwnProfile({ children }: { children: ReactElement }) {
  const { currentUser } = useAuth();
  const { id } = useParams<{ id: string }>();

  if (!currentUser?.id) {
    return <Navigate to="/login" replace />;
  }

  if (!id || id !== currentUser.id) {
    return (
      <PermissionDenied
        title="Недостаточно прав"
        message="Редактирование доступно только для вашего профиля."
      />
    );
  }

  return children;
}

function AppRoutes() {
  const { currentUser, isAuthenticated, login } = useAuth();
  const { teamId: currentTeamId, teamName: currentTeamName, setCurrentTeam } = useCurrentTeam(currentUser?.id ?? null);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const navigate = useNavigate();
  const homePath = isAuthenticated
    ? shouldRunOnboarding(currentUser)
      ? "/onboarding/link-player"
      : "/events"
    : "/login";

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={homePath} replace />}
        />

        <Route
          path="/login"
          element={<AuthPage />}
        />

        <Route
          path="/confirm-email"
          element={<ConfirmEmailPage />}
        />

        <Route
          path="/onboarding/link-player"
          element={
            <RequireAuth>
              <LinkPlayerPage />
            </RequireAuth>
          }
        />

        <Route
          path="/start-search"
          element={
            isAuthenticated ? (
              <Navigate to="/events" replace />
            ) : (
              <StartSearchPage
                onSelect={async (user) => {
                  await login(user);
                  navigate("/events", { replace: true });
                }}
              />
            )
          }
        />

        <Route
          path="/events"
          element={
            <RequireAuth>
              <RequireOnboardingComplete>
                <EventsListPage
                  currentUser={currentUser}
                  currentTeamId={currentTeamId}
                  currentTeamName={currentTeamName}
                  onTeamChange={setCurrentTeam}
                />
              </RequireOnboardingComplete>
            </RequireAuth>
          }
        />

        <Route
          path="/events/create"
          element={
            <RequireAuth>
              <RequireOnboardingComplete>
                <RequireEventManager>
                  <CreateEventWrapper currentTeamId={currentTeamId} />
                </RequireEventManager>
              </RequireOnboardingComplete>
            </RequireAuth>
          }
        />

        <Route
          path="/events/:id"
          element={
            <RequireAuth>
              <RequireOnboardingComplete>
                <EventPageWrapper />
              </RequireOnboardingComplete>
            </RequireAuth>
          }
        />

        <Route
          path="/events/:id/delete"
          element={
            <RequireAuth>
              <RequireOnboardingComplete>
                <RequireEventManager>
                  <DeleteEventPage />
                </RequireEventManager>
              </RequireOnboardingComplete>
            </RequireAuth>
          }
        />

        <Route
          path="/events/:id/edit"
          element={
            <RequireAuth>
              <RequireOnboardingComplete>
                <RequireEventManager>
                  <UpdateEventPage />
                </RequireEventManager>
              </RequireOnboardingComplete>
            </RequireAuth>
          }
        />

        <Route path="/create-player" element={<CreatePlayerFormPage />} />

        <Route
          path="/users/:id/edit"
          element={
            <RequireOwnProfile>
              <UpdateUserPage />
            </RequireOwnProfile>
          }
        />

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />

        <Route
          path="/calendar"
          element={
            <RequireAuth>
              <RequireOnboardingComplete>
                <CalendarPage />
              </RequireOnboardingComplete>
            </RequireAuth>
          }
        />

        <Route
          path="/settings"
          element={
            <RequireAuth>
              <RequireOnboardingComplete>
                <SettingsPage onOpenDebug={() => setIsDebugOpen(true)} />
              </RequireOnboardingComplete>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/push"
          element={
            <RequireAuth>
              <RequireOnboardingComplete>
                <AdminPushPage />
              </RequireOnboardingComplete>
            </RequireAuth>
          }
        />

        <Route
          path="/teams"
          element={
            <RequireAuth>
              <RequireOnboardingComplete>
                <TeamsPage
                  currentUser={currentUser}
                  currentTeamId={currentTeamId}
                  currentTeamName={currentTeamName}
                  onTeamChange={setCurrentTeam}
                />
              </RequireOnboardingComplete>
            </RequireAuth>
          }
        />

        <Route
          path="/teams/:id"
          element={
            <RequireAuth>
              <RequireOnboardingComplete>
                <TeamDetailsPage
                  currentUser={currentUser}
                  currentTeamId={currentTeamId}
                  onTeamChange={setCurrentTeam}
                />
              </RequireOnboardingComplete>
            </RequireAuth>
          }
        />

        <Route
          path="/teams/:id/manage"
          element={
            <RequireAuth>
              <RequireOnboardingComplete>
                <TeamManagePage currentUser={currentUser} />
              </RequireOnboardingComplete>
            </RequireAuth>
          }
        />
      </Routes>

      <DebugOverlay isOpen={isDebugOpen} onClose={() => setIsDebugOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
