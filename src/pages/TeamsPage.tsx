import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTeam, getPublicTeams, getTeam, getTeamMembers, joinPublicTeam, joinTeamByCode, TeamsApiError } from "src/api/teams";
import { BottomNav } from "src/components/BottomNav";
import { TeamDto, TeamMemberDto, TeamVisibility } from "src/types/teams";
import { User } from "src/types/user";

interface TeamsPageProps {
  currentUser: User | null;
  currentTeamId: string | null;
  currentTeamName: string | null;
  onTeamChange: (teamId: string | null, teamName?: string | null) => void;
}

const memberRoleLabel = (role: number): string => {
  switch (role) {
    case 1:
      return "Владелец";
    case 2:
      return "Администратор";
    default:
      return "Участник";
  }
};

export function TeamsPage({ currentUser, currentTeamId, currentTeamName, onTeamChange }: TeamsPageProps) {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [activeTeam, setActiveTeam] = useState<TeamDto | null>(null);
  const [members, setMembers] = useState<TeamMemberDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPublic, setCreatePublic] = useState(true);
  const [joinCode, setJoinCode] = useState("");

  const loadPublicTeams = useCallback(async () => {
    const list = await getPublicTeams();
    setTeams(list);
  }, []);

  const loadActiveTeam = useCallback(async () => {
    if (!currentTeamId) {
      setActiveTeam(null);
      setMembers([]);
      return;
    }

    const [team, teamMembers] = await Promise.all([
      getTeam(currentTeamId, currentUser?.id),
      getTeamMembers(currentTeamId),
    ]);

    setActiveTeam(team);
    setMembers(teamMembers);
  }, [currentTeamId, currentUser?.id]);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadPublicTeams(), loadActiveTeam()]);
      setApiUnavailable(false);
    } catch (requestError) {
      if (requestError instanceof TeamsApiError && requestError.status === 404) {
        setApiUnavailable(true);
        setError("Команды недоступны: backend еще не обновлен.");
      } else {
        console.error(requestError);
        setError("Не удалось загрузить данные по командам");
      }
    } finally {
      setLoading(false);
    }
  }, [loadActiveTeam, loadPublicTeams]);

  useEffect(() => {
    void reloadAll();
  }, [reloadAll]);

  const canManageCurrentTeam = useMemo(() => {
    if (!activeTeam || !currentUser?.id) {
      return false;
    }
    return activeTeam.createdByUserId === currentUser.id;
  }, [activeTeam, currentUser?.id]);

  const handleCreateTeam = useCallback(async () => {
    if (!currentUser?.id) {
      setError("Сначала выберите пользователя");
      return;
    }
    if (!createName.trim()) {
      setError("Введите название команды");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const created = await createTeam(
        {
          name: createName.trim(),
          visibility: createPublic ? TeamVisibility.Public : TeamVisibility.Private,
        },
        currentUser.id,
      );
      onTeamChange(created.id, created.name);
      setCreateName("");
      await reloadAll();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Не удалось создать команду";
      setError(message);
      setLoading(false);
    }
  }, [createName, createPublic, currentUser?.id, onTeamChange, reloadAll]);

  const handleJoinByCode = useCallback(async () => {
    if (!currentUser?.id) {
      setError("Сначала выберите пользователя");
      return;
    }
    if (!joinCode.trim()) {
      setError("Введите код приглашения");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const joined = await joinTeamByCode({ code: joinCode.trim() }, currentUser.id);
      onTeamChange(joined.id, joined.name);
      setJoinCode("");
      await reloadAll();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Не удалось вступить в команду";
      setError(message);
      setLoading(false);
    }
  }, [currentUser?.id, joinCode, onTeamChange, reloadAll]);

  const handleJoinOrSelectPublic = useCallback(
    async (team: TeamDto) => {
      if (!currentUser?.id) {
        setError("Сначала выберите пользователя");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        await joinPublicTeam(team.id, currentUser.id);
        onTeamChange(team.id, team.name);
        await reloadAll();
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : "Не удалось выбрать команду";
        setError(message);
        setLoading(false);
      }
    },
    [currentUser?.id, onTeamChange, reloadAll],
  );

  return (
    <div style={{ padding: "16px", paddingBottom: "120px", background: "#f5f5f5", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <button
          onClick={() => navigate("/events")}
          style={{ borderRadius: "10px", border: "1px solid #e0e0e0", background: "white", width: 40, height: 40, cursor: "pointer" }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: "22px", color: "#1a237e" }}>Команды</h1>
      </div>

      {error && (
        <div style={{ marginBottom: "12px", background: "#ffebee", color: "#b71c1c", borderRadius: "10px", padding: "10px 12px" }}>
          {error}
        </div>
      )}

      {apiUnavailable ? null : (
        <div style={{ display: "grid", gap: "12px" }}>
          <section style={{ background: "white", borderRadius: "12px", padding: "12px", border: "1px solid #e0e0e0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <strong>Активная команда</strong>
              <button onClick={() => onTeamChange(null, null)} style={{ border: "none", background: "transparent", color: "#1976d2", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
                Сбросить
              </button>
            </div>
            <div style={{ color: activeTeam ? "#263238" : "#78909c" }}>{activeTeam ? activeTeam.name : currentTeamName || "Все мероприятия"}</div>
            {activeTeam && (
              <div style={{ marginTop: "8px", fontSize: "12px", color: "#607d8b" }}>
                Видимость: {activeTeam.visibility === TeamVisibility.Public ? "Публичная" : "Приватная"}
                <br />
                Участников: {activeTeam.membersCount}
                {canManageCurrentTeam && activeTeam.inviteCode ? (
                  <>
                    <br />
                    Код приглашения: <strong>{activeTeam.inviteCode}</strong>
                  </>
                ) : null}
              </div>
            )}
          </section>

          <section style={{ background: "white", borderRadius: "12px", padding: "12px", border: "1px solid #e0e0e0" }}>
            <strong>Создать команду</strong>
            <div style={{ display: "grid", gap: "8px", marginTop: "8px" }}>
              <input value={createName} onChange={(event) => setCreateName(event.target.value)} placeholder="Название команды" style={{ width: "100%", border: "1px solid #d0d7e2", borderRadius: "10px", padding: "10px 12px", boxSizing: "border-box" }} />
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#37474f" }}>
                <input type="checkbox" checked={createPublic} onChange={(event) => setCreatePublic(event.target.checked)} />
                Публичная команда
              </label>
              <button onClick={() => void handleCreateTeam()} disabled={loading} style={{ borderRadius: "10px", border: "1px solid #1976d2", background: "#1976d2", color: "white", padding: "10px 12px", cursor: loading ? "wait" : "pointer", fontWeight: 600 }}>
                Создать
              </button>
            </div>
          </section>

          <section style={{ background: "white", borderRadius: "12px", padding: "12px", border: "1px solid #e0e0e0" }}>
            <strong>Вступить по коду</strong>
            <div style={{ display: "grid", gap: "8px", marginTop: "8px" }}>
              <input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} placeholder="Код приглашения" style={{ width: "100%", border: "1px solid #d0d7e2", borderRadius: "10px", padding: "10px 12px", boxSizing: "border-box" }} />
              <button onClick={() => void handleJoinByCode()} disabled={loading} style={{ borderRadius: "10px", border: "1px solid #3949ab", background: "white", color: "#3949ab", padding: "10px 12px", cursor: loading ? "wait" : "pointer", fontWeight: 600 }}>
                Вступить
              </button>
            </div>
          </section>

          <section style={{ background: "white", borderRadius: "12px", padding: "12px", border: "1px solid #e0e0e0" }}>
            <strong>Публичные команды</strong>
            <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
              {teams.length === 0 ? (
                <div style={{ fontSize: "14px", color: "#78909c" }}>Нет доступных публичных команд</div>
              ) : (
                teams.map((team) => (
                  <div key={team.id} style={{ border: "1px solid #e6eef9", borderRadius: "10px", padding: "10px" }}>
                    <div style={{ fontWeight: 600, color: "#1a237e" }}>{team.name}</div>
                    <div style={{ fontSize: "12px", color: "#607d8b", marginTop: "4px" }}>Участников: {team.membersCount}</div>
                    <button onClick={() => void handleJoinOrSelectPublic(team)} disabled={loading} style={{ marginTop: "8px", borderRadius: "8px", border: "1px solid #1976d2", background: "#e3f2fd", color: "#1565c0", padding: "6px 10px", cursor: loading ? "wait" : "pointer", fontSize: "12px", fontWeight: 600 }}>
                      Выбрать
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {activeTeam && (
            <section style={{ background: "white", borderRadius: "12px", padding: "12px", border: "1px solid #e0e0e0" }}>
              <strong>Состав команды</strong>
              <div style={{ marginTop: "8px", display: "grid", gap: "6px" }}>
                {members.length === 0 ? (
                  <div style={{ fontSize: "14px", color: "#78909c" }}>Нет участников</div>
                ) : (
                  members.map((member) => (
                    <div key={member.userId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #edf2fb", borderRadius: "8px", padding: "8px 10px" }}>
                      <div style={{ fontSize: "14px" }}>
                        #{member.jerseyNumber ?? "?"} {(member.lastName ?? "").trim()} {(member.firstName ?? "").trim()}
                      </div>
                      <div style={{ fontSize: "12px", color: "#607d8b" }}>{memberRoleLabel(member.role)}</div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </div>
      )}
      <BottomNav activeTab="teams" />
    </div>
  );
}

export default TeamsPage;
