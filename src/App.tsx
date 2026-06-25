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
import { UpdatesPage } from "src/pages/UpdatesPage";
import { AdminPage } from "src/pages/AdminPage";
import { AuthPage } from "src/pages/AuthPage";
import { ConfirmEmailPage } from "src/pages/ConfirmEmailPage";
import { EventPage } from "src/pages/EventPage/EventPage";
import { EventsListPage } from "src/pages/EventsListPage/EventsListPage";
import { InstructionArticlePage, InstructionsListPage } from "src/pages/InstructionsPage";
import { NewsPage } from "src/pages/NewsPage";
import { MigrateLoginPage } from "src/pages/MigrateLoginPage";
import { NotificationSettingsPage } from "src/pages/NotificationSettingsPage";
import { TeamPwaSettingsPage } from "src/pages/TeamPwaSettingsPage";
import { PrivacyPolicyPage, TermsOfServicePage } from "src/pages/LegalPages";
import { RenderMigrationPage } from "src/pages/RenderMigrationPage";
import { TeamDetailsPage } from "src/pages/TeamDetailsPage/TeamDetailsPage";
import { TeamManagePage } from "src/pages/TeamDetailsPage/TeamManagePage";
import { TeamsPage } from "src/pages/TeamsPage";
import { ProfilePage } from "src/pages/ProfilePage";
import { DebugOverlay } from "src/components/DebugOverlay";
import { AppUpdatePrompt } from "src/components/AppUpdatePrompt";
import { LoadingIndicator } from "src/components/LoadingIndicator";
import { PermissionDenied } from "src/components/PermissionDenied";
import { PwaInstallPrompt } from "src/components/PwaInstallPrompt";
import { useCurrentTeam } from "src/hooks/useCurrentTeam";
import { usePushSubscriptionSync } from "src/hooks/usePushSubscriptionSync";
import { useAuth } from "src/hooks/useAuth";
import { AuthProvider } from "src/context/AuthContext";
import { ThemeProvider } from "src/context/ThemeContext";
import { useEffect, useState } from "react";
import { getMyTeams } from "src/api/teams";
import { AppRole } from "src/constants/roles";
import { getTeamPwaDestination, getTeamPwaPreferences, isStandalonePwa, isTeamPwaReinstallRequired, setActiveTeamPwa } from "src/utils/teamPwa";

const isRenderMigrationMode = process.env.REACT_APP_RENDER_MIGRATION_MODE === "true";

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
    return <LoadingIndicator text="Загрузка..." block />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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

function RequireSuperAdmin({ children }: { children: ReactElement }) {
  const { currentUser } = useAuth();

  if (!currentUser?.id) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.appRole !== AppRole.SuperAdmin) {
    return (
      <PermissionDenied
        title="Недостаточно прав"
        message="Эта страница доступна только глобальному администратору приложения."
      />
    );
  }

  return children;
}

function TeamPwaLaunchPage({ onTeamChange }: { onTeamChange: (teamId: string | null, teamName?: string | null) => void }) {
  const { teamId } = useParams<{ teamId: string }>();
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      setDestination("/events");
      return;
    }

    const preferences = getTeamPwaPreferences(teamId);
    setActiveTeamPwa(teamId, false);
    onTeamChange(teamId, preferences.teamName);
    setDestination(getTeamPwaDestination(teamId));
  }, [onTeamChange, teamId]);

  return destination
    ? <Navigate to={destination} replace />
    : <LoadingIndicator text="Открываем приложение команды..." block />;
}

function AppRoutes() {
  const { currentUser, isAuthenticated } = useAuth();
  const { teamId: currentTeamId, teamName: currentTeamName, setCurrentTeam } = useCurrentTeam(currentUser?.id ?? null);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [showTeamPwaReinstallNotice, setShowTeamPwaReinstallNotice] = useState(() => isTeamPwaReinstallRequired());

  useEffect(() => {
    if (!currentUser?.id || !isStandalonePwa()) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const legacyTeamId = params.get("standaloneTeam")?.trim();
    if (!legacyTeamId) {
      return;
    }

    const legacyTeamName = params.get("standaloneTeamName")?.trim() || null;
    setActiveTeamPwa(legacyTeamId, true);
    setCurrentTeam(legacyTeamId, legacyTeamName);
    setShowTeamPwaReinstallNotice(true);

    params.delete("standaloneTeam");
    params.delete("standaloneTeamName");
    const remainingQuery = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${remainingQuery ? `?${remainingQuery}` : ""}${window.location.hash}`,
    );
  }, [currentUser?.id, setCurrentTeam]);

  usePushSubscriptionSync(currentUser?.id);
  const homePath = isAuthenticated ? "/events" : "/login";

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
          path="/migrate-login"
          element={<MigrateLoginPage />}
        />

        <Route
          path="/privacy"
          element={<PrivacyPolicyPage />}
        />

        <Route
          path="/terms"
          element={<TermsOfServicePage />}
        />

        <Route
          path="/instructions"
          element={<InstructionsListPage />}
        />

        <Route
          path="/instructions/:slug"
          element={<InstructionArticlePage />}
        />

        <Route
          path="/confirm-email"
          element={<ConfirmEmailPage />}
        />

        <Route
          path="/events"
          element={
            <RequireAuth>
              <EventsListPage
                currentUser={currentUser}
                currentTeamId={currentTeamId}
                currentTeamName={currentTeamName}
                onTeamChange={setCurrentTeam}
              />
            </RequireAuth>
          }
        />

        <Route
          path="/events/create"
          element={
            <RequireAuth>
              <RequireEventManager>
                <CreateEventWrapper currentTeamId={currentTeamId} />
              </RequireEventManager>
            </RequireAuth>
          }
        />

        <Route
          path="/events/:id"
          element={
            <RequireAuth>
              <EventPageWrapper />
            </RequireAuth>
          }
        />

        <Route
          path="/events/:id/delete"
          element={
            <RequireAuth>
              <RequireEventManager>
                <DeleteEventPage />
              </RequireEventManager>
            </RequireAuth>
          }
        />

        <Route
          path="/events/:id/edit"
          element={
            <RequireAuth>
              <RequireEventManager>
                <UpdateEventPage />
              </RequireEventManager>
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
              <CalendarPage />
            </RequireAuth>
          }
        />


        <Route
          path="/news"
          element={
            <RequireAuth>
              <NewsPage />
            </RequireAuth>
          }
        />

        <Route
          path="/settings"
          element={
            <RequireAuth>
              <SettingsPage onOpenDebug={() => setIsDebugOpen(true)} />
            </RequireAuth>
          }
        />

        <Route
          path="/settings/notifications"
          element={
            <RequireAuth>
              <NotificationSettingsPage />
            </RequireAuth>
          }
        />

        <Route
          path="/settings/team-apps"
          element={
            <RequireAuth>
              <TeamPwaSettingsPage />
            </RequireAuth>
          }
        />

        <Route
          path="/pwa/teams/:teamId"
          element={
            <RequireAuth>
              <TeamPwaLaunchPage onTeamChange={setCurrentTeam} />
            </RequireAuth>
          }
        />

        <Route
          path="/updates"
          element={
            <RequireAuth>
              <UpdatesPage />
            </RequireAuth>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireSuperAdmin>
                <AdminPage />
              </RequireSuperAdmin>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <RequireAuth>
              <RequireSuperAdmin>
                <AdminPage />
              </RequireSuperAdmin>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/users"
          element={
            <RequireAuth>
              <RequireSuperAdmin>
                <AdminPage />
              </RequireSuperAdmin>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/notifications"
          element={
            <RequireAuth>
              <RequireSuperAdmin>
                <AdminPage />
              </RequireSuperAdmin>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/releases"
          element={
            <RequireAuth>
              <RequireSuperAdmin>
                <AdminPage />
              </RequireSuperAdmin>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/push"
          element={
            <RequireAuth>
              <RequireSuperAdmin>
                <AdminPage />
              </RequireSuperAdmin>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/instructions"
          element={
            <RequireAuth>
              <RequireSuperAdmin>
                <AdminPage />
              </RequireSuperAdmin>
            </RequireAuth>
          }
        />

        <Route
          path="/teams"
          element={
            <RequireAuth>
              <TeamsPage
                currentUser={currentUser}
                currentTeamId={currentTeamId}
                currentTeamName={currentTeamName}
                onTeamChange={setCurrentTeam}
              />
            </RequireAuth>
          }
        />

        <Route
          path="/teams/:id"
          element={
            <RequireAuth>
              <TeamDetailsPage
                currentUser={currentUser}
                currentTeamId={currentTeamId}
                onTeamChange={setCurrentTeam}
              />
            </RequireAuth>
          }
        />

        <Route
          path="/teams/:id/manage"
          element={
            <RequireAuth>
              <TeamManagePage currentUser={currentUser} />
            </RequireAuth>
          }
        />

        <Route
          path="*"
          element={<Navigate to={homePath} replace />}
        />
      </Routes>

      <DebugOverlay isOpen={isDebugOpen} onClose={() => setIsDebugOpen(false)} />
      <AppUpdatePrompt />
      <PwaInstallPrompt isAuthenticated={isAuthenticated} />
      {showTeamPwaReinstallNotice && (
        <div style={{ position: "fixed", left: 12, right: 12, bottom: 86, zIndex: 700, maxWidth: 560, margin: "0 auto", border: "1px solid var(--hp-warning-border)", borderRadius: 16, padding: 14, background: "var(--hp-warning-soft)", color: "var(--hp-warning)", boxShadow: "var(--hp-shadow-md)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontSize: 14, lineHeight: 1.4, fontWeight: 800 }}>
              Приложение команды нужно переустановить, чтобы заработали выбор стартовой страницы и новые настройки ярлыка.
            </div>
            <button type="button" aria-label="Закрыть" onClick={() => setShowTeamPwaReinstallNotice(false)} style={{ border: 0, background: "transparent", color: "inherit", fontSize: 22, lineHeight: 1, cursor: "pointer", padding: 0 }}>×</button>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  if (isRenderMigrationMode) {
    return (
      <ThemeProvider>
        <BrowserRouter>
          <RenderMigrationPage />
        </BrowserRouter>
      </ThemeProvider>
    );
  }

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
