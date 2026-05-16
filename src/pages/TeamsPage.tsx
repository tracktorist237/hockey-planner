import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "src/components/BottomNav";
import { TeamDto } from "src/types/teams";
import { User } from "src/types/user";
import { CreateTeamTab } from "./TeamsPage/components/CreateTeamTab";
import { JoinByCodeTab } from "./TeamsPage/components/JoinByCodeTab";
import { MyTeamsTab } from "./TeamsPage/components/MyTeamsTab";
import { PublicTeamsTab } from "./TeamsPage/components/PublicTeamsTab";
import { cardStyle } from "./TeamsPage/components/styles";
import { TeamsTabs } from "./TeamsPage/components/TeamsTabs";
import { useTeamsPage } from "./TeamsPage/hooks/useTeamsPage";

interface TeamsPageProps {
  currentUser: User | null;
  currentTeamId: string | null;
  currentTeamName: string | null;
  onTeamChange: (teamId: string | null, teamName?: string | null) => void;
}

export function TeamsPage({ currentUser, currentTeamId, onTeamChange }: TeamsPageProps) {
  const navigate = useNavigate();
  const teamsPage = useTeamsPage(currentUser);
  const { reloadTeams } = teamsPage;

  useEffect(() => {
    void reloadTeams();
  }, [reloadTeams]);

  useEffect(() => {
    if (!currentTeamId || !teamsPage.loaded) {
      return;
    }

    const isStillMyTeam = teamsPage.myTeams.some((team: TeamDto) => team.id === currentTeamId);
    if (!isStillMyTeam) {
      onTeamChange(null, null);
    }
  }, [currentTeamId, onTeamChange, teamsPage.loaded, teamsPage.myTeams]);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "16px",
        paddingBottom: "120px",
        background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)",
        boxSizing: "border-box",
      }}
    >
      <main style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <button
            onClick={() => navigate("/events")}
            style={{
              borderRadius: 12,
              border: "1px solid #cbd5e1",
              background: "white",
              width: 42,
              height: 42,
              cursor: "pointer",
              fontSize: 20,
            }}
            aria-label="Назад"
          >
            ←
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, color: "#0f172a" }}>Команды</h1>
            <div style={{ color: "#64748b", fontSize: 14 }}>Список, поиск и создание команд</div>
          </div>
        </div>

        {teamsPage.error && (
          <div style={{ marginBottom: 12, background: "#fee2e2", color: "#991b1b", borderRadius: 14, padding: "12px 14px" }}>
            {teamsPage.error}
          </div>
        )}

        {teamsPage.message && (
          <div style={{ marginBottom: 12, background: "#dcfce7", color: "#166534", borderRadius: 14, padding: "12px 14px", fontWeight: 800 }}>
            {teamsPage.message}
          </div>
        )}

        {teamsPage.apiUnavailable ? null : (
          <section style={cardStyle}>
            <TeamsTabs activeTab={teamsPage.activeTab} onChange={teamsPage.setActiveTab} />

            {teamsPage.activeTab === "my" && (
              <MyTeamsTab
                teams={teamsPage.myTeams}
                loading={teamsPage.loading}
                onGoPublic={() => teamsPage.setActiveTab("public")}
                onGoCode={() => teamsPage.setActiveTab("code")}
                onOpenTeam={(team) => navigate(`/teams/${team.id}`)}
                pinnedTeamIds={teamsPage.pinnedTeamIds}
                onTogglePin={teamsPage.togglePinnedTeam}
              />
            )}

            {teamsPage.activeTab === "public" && (
              <PublicTeamsTab
                teams={teamsPage.availablePublicTeams}
                loading={teamsPage.loading}
                onOpenTeam={(team) => navigate(`/teams/${team.id}`)}
              />
            )}

            {teamsPage.activeTab === "code" && (
              <JoinByCodeTab
                code={teamsPage.joinCode}
                loading={teamsPage.loading}
                onCodeChange={teamsPage.setJoinCode}
                onJoin={() => void teamsPage.joinByCode()}
              />
            )}

            {teamsPage.activeTab === "create" && (
              <CreateTeamTab
                name={teamsPage.createName}
                isPublic={teamsPage.createPublic}
                loading={teamsPage.loading}
                onNameChange={teamsPage.setCreateName}
                onPublicChange={teamsPage.setCreatePublic}
                onCreate={() => void teamsPage.createNewTeam()}
              />
            )}
          </section>
        )}
      </main>

      <BottomNav activeTab="teams" />
    </div>
  );
}

export default TeamsPage;
