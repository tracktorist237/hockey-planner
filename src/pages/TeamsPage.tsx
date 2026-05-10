import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createTeam,
  getPublicTeams,
  getTeam,
  getTeamMembers,
  joinPublicTeam,
  joinTeamByCode,
  TeamsApiError,
} from "src/api/teams";
import { BottomNav } from "src/components/BottomNav";
import { TeamDto, TeamMemberDto, TeamVisibility } from "src/types/teams";
import { User } from "src/types/user";

interface TeamsPageProps {
  currentUser: User | null;
  currentTeamId: string | null;
  currentTeamName: string | null;
  onTeamChange: (teamId: string | null, teamName?: string | null) => void;
}

type Panel = "public" | "code" | "create";

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

const cardStyle: CSSProperties = {
  background: "white",
  borderRadius: 18,
  padding: 16,
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 32px rgba(15, 23, 42, 0.08)",
};

const buttonStyle: CSSProperties = {
  width: "100%",
  border: 0,
  borderRadius: 14,
  padding: "13px 14px",
  fontSize: 16,
  fontWeight: 800,
  cursor: "pointer",
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "13px 12px",
  fontSize: 16,
};

export function TeamsPage({ currentUser, currentTeamId, currentTeamName, onTeamChange }: TeamsPageProps) {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [activeTeam, setActiveTeam] = useState<TeamDto | null>(null);
  const [members, setMembers] = useState<TeamMemberDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [panel, setPanel] = useState<Panel>("public");
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
        setError("Раздел команд недоступен: backend ещё не обновлён.");
      } else {
        console.error(requestError);
        setError("Не удалось загрузить команды. Попробуйте обновить.");
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

  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => a.name.localeCompare(b.name, "ru")),
    [teams],
  );

  const handleCreateTeam = useCallback(async () => {
    if (!currentUser?.id) {
      setError("Сначала войдите в профиль.");
      return;
    }

    if (!createName.trim()) {
      setError("Введите название команды.");
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
      navigate("/events", { replace: true });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Не удалось создать команду.";
      setError(message);
      setLoading(false);
    }
  }, [createName, createPublic, currentUser?.id, navigate, onTeamChange, reloadAll]);

  const handleJoinByCode = useCallback(async () => {
    if (!currentUser?.id) {
      setError("Сначала войдите в профиль.");
      return;
    }

    if (!joinCode.trim()) {
      setError("Введите код приглашения.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const joined = await joinTeamByCode({ code: joinCode.trim() }, currentUser.id);
      onTeamChange(joined.id, joined.name);
      setJoinCode("");
      await reloadAll();
      navigate("/events", { replace: true });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Не удалось вступить в команду.";
      setError(message);
      setLoading(false);
    }
  }, [currentUser?.id, joinCode, navigate, onTeamChange, reloadAll]);

  const handleJoinOrSelectPublic = useCallback(
    async (team: TeamDto) => {
      if (!currentUser?.id) {
        setError("Сначала войдите в профиль.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        await joinPublicTeam(team.id, currentUser.id);
        onTeamChange(team.id, team.name);
        await reloadAll();
        navigate("/events", { replace: true });
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : "Не удалось выбрать команду.";
        setError(message);
        setLoading(false);
      }
    },
    [currentUser?.id, navigate, onTeamChange, reloadAll],
  );

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
            <div style={{ color: "#64748b", fontSize: 14 }}>Выберите, где смотреть мероприятия</div>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: 12, background: "#fee2e2", color: "#991b1b", borderRadius: 14, padding: "12px 14px" }}>
            {error}
          </div>
        )}

        {apiUnavailable ? null : (
          <div style={{ display: "grid", gap: 14 }}>
            <section style={cardStyle}>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Сейчас выбрано
              </div>
              <div style={{ marginTop: 6, fontSize: 22, color: "#0f172a", fontWeight: 900 }}>
                {activeTeam?.name || currentTeamName || "Все мероприятия"}
              </div>
              {activeTeam ? (
                <div style={{ marginTop: 8, color: "#475569", lineHeight: 1.45 }}>
                  Участников: {activeTeam.membersCount}
                  {canManageCurrentTeam && activeTeam.inviteCode ? (
                    <>
                      <br />
                      Код приглашения: <strong>{activeTeam.inviteCode}</strong>
                    </>
                  ) : null}
                </div>
              ) : (
                <div style={{ marginTop: 8, color: "#64748b" }}>
                  Можно выбрать команду ниже или смотреть общий список мероприятий.
                </div>
              )}

              {activeTeam && (
                <button
                  onClick={() => onTeamChange(null, null)}
                  style={{
                    ...buttonStyle,
                    marginTop: 12,
                    background: "#f1f5f9",
                    color: "#334155",
                  }}
                >
                  Сбросить выбор команды
                </button>
              )}
            </section>

            <section style={cardStyle}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, padding: 6, borderRadius: 16, background: "#e2e8f0" }}>
                {[
                  ["public", "Публичные"],
                  ["code", "По коду"],
                  ["create", "Создать"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPanel(value as Panel)}
                    style={{
                      border: 0,
                      borderRadius: 12,
                      padding: "11px 8px",
                      fontWeight: 900,
                      cursor: "pointer",
                      background: panel === value ? "white" : "transparent",
                      color: panel === value ? "#0f172a" : "#475569",
                      boxShadow: panel === value ? "0 6px 18px rgba(15, 23, 42, 0.12)" : "none",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {panel === "public" && (
                <div style={{ marginTop: 14 }}>
                  <h2 style={{ margin: "0 0 6px", fontSize: 20, color: "#0f172a" }}>Публичные команды</h2>
                  <p style={{ margin: "0 0 12px", color: "#64748b", lineHeight: 1.4 }}>
                    В такие команды можно вступить без кода приглашения.
                  </p>
                  <div style={{ display: "grid", gap: 10, maxHeight: 360, overflowY: "auto", paddingRight: 4 }}>
                    {loading && <div style={{ color: "#64748b" }}>Загружаем...</div>}
                    {!loading && sortedTeams.length === 0 && (
                      <div style={{ color: "#64748b" }}>Публичных команд пока нет.</div>
                    )}
                    {sortedTeams.map((team) => (
                      <div key={team.id} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 12 }}>
                        <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 17 }}>{team.name}</div>
                        <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Участников: {team.membersCount}</div>
                        <button
                          onClick={() => void handleJoinOrSelectPublic(team)}
                          disabled={loading}
                          style={{
                            ...buttonStyle,
                            marginTop: 10,
                            background: "#dbeafe",
                            color: "#1d4ed8",
                          }}
                        >
                          Выбрать эту команду
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {panel === "code" && (
                <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                  <h2 style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>Вступить по коду</h2>
                  <p style={{ margin: 0, color: "#64748b", lineHeight: 1.4 }}>
                    Если команда закрытая, попросите код у тренера или администратора.
                  </p>
                  <input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} placeholder="Код приглашения" style={inputStyle} />
                  <button onClick={() => void handleJoinByCode()} disabled={loading} style={{ ...buttonStyle, background: "#1d4ed8" }}>
                    Вступить
                  </button>
                </div>
              )}

              {panel === "create" && (
                <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                  <h2 style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>Создать команду</h2>
                  <p style={{ margin: 0, color: "#64748b", lineHeight: 1.4 }}>
                    Это нужно, если вашей команды ещё нет в списке.
                  </p>
                  <input value={createName} onChange={(event) => setCreateName(event.target.value)} placeholder="Название команды" style={inputStyle} />
                  <label style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontWeight: 700 }}>
                    <input type="checkbox" checked={createPublic} onChange={(event) => setCreatePublic(event.target.checked)} />
                    Публичная команда
                  </label>
                  <button onClick={() => void handleCreateTeam()} disabled={loading} style={{ ...buttonStyle, background: "#0f766e" }}>
                    Создать команду
                  </button>
                </div>
              )}
            </section>

            {activeTeam && (
              <section style={cardStyle}>
                <h2 style={{ margin: "0 0 10px", fontSize: 20, color: "#0f172a" }}>Состав команды</h2>
                <div style={{ display: "grid", gap: 8, maxHeight: 260, overflowY: "auto", paddingRight: 4 }}>
                  {members.length === 0 ? (
                    <div style={{ color: "#64748b" }}>Участников пока нет.</div>
                  ) : (
                    members.map((member) => (
                      <div
                        key={member.userId}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          border: "1px solid #edf2fb",
                          borderRadius: 12,
                          padding: "9px 10px",
                          gap: 10,
                        }}
                      >
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                          #{member.jerseyNumber ?? "?"} {(member.lastName ?? "").trim()} {(member.firstName ?? "").trim()}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>{memberRoleLabel(member.role)}</div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
      <BottomNav activeTab="teams" />
    </div>
  );
}

export default TeamsPage;
