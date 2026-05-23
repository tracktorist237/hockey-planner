import { useCallback, useEffect, useMemo, useState } from "react";
import { createTeam, getMyTeams, getPublicTeams, joinTeamByCode, joinPublicTeam, TeamsApiError } from "src/api/teams";
import { TeamDto, TeamVisibility } from "src/types/teams";

interface TeamSwitcherProps {
  currentUserId?: string;
  currentTeamId: string | null;
  currentTeamName: string | null;
  onTeamChange: (teamId: string | null, teamName?: string | null) => void;
  onOpenTeamsPage?: () => void;
  filterOnly?: boolean;
}

export function TeamSwitcher({
  currentUserId,
  currentTeamId,
  currentTeamName,
  onTeamChange,
  onOpenTeamsPage,
  filterOnly = false,
}: TeamSwitcherProps) {
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [apiUnavailable, setApiUnavailable] = useState(false);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setLoaded(false);
    try {
      const loadedTeams = filterOnly
        ? (currentUserId ? await getMyTeams(currentUserId) : [])
        : await getPublicTeams();
      setTeams(loadedTeams);
      setApiUnavailable(false);
      setMessage(null);
    } catch (error) {
      if (error instanceof TeamsApiError && (error.status === 404 || error.status === 405)) {
        setApiUnavailable(true);
        setTeams([]);
        setMessage(filterOnly ? "Фильтр команд станет доступен после обновления backend." : "Команды станут доступны после обновления backend.");
      } else {
        console.error(error);
        setMessage("Не удалось загрузить команды");
      }
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [currentUserId, filterOnly]);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  const selectedValue = currentTeamId ?? "";

  const options = useMemo(() => {
    const all = [...teams];
    if (!filterOnly && currentTeamId && currentTeamName && !all.some((team) => team.id === currentTeamId)) {
      all.unshift({
        id: currentTeamId,
        name: currentTeamName,
        visibility: TeamVisibility.Private,
        membersCount: 0,
        createdByUserId: "",
      });
    }
    return all;
  }, [currentTeamId, currentTeamName, filterOnly, teams]);

  useEffect(() => {
    if (!filterOnly || !loaded || !currentTeamId) {
      return;
    }

    if (!teams.some((team) => team.id === currentTeamId)) {
      onTeamChange(null, null);
    }
  }, [currentTeamId, filterOnly, loaded, onTeamChange, teams]);

  const showMessage = useCallback((value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(null), 3000);
  }, []);

  const handleCreateTeam = useCallback(async () => {
    if (!currentUserId) {
      showMessage("Сначала выберите профиль игрока");
      return;
    }

    const name = window.prompt("Название команды");
    if (!name || !name.trim()) {
      return;
    }

    const isPublic = window.confirm("Сделать команду публичной?");
    try {
      const created = await createTeam(
        {
          name: name.trim(),
          visibility: isPublic ? TeamVisibility.Public : TeamVisibility.Private,
        },
        currentUserId,
      );
      onTeamChange(created.id, created.name);
      await loadTeams();
      showMessage(`Команда "${created.name}" создана`);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Не удалось создать команду";
      showMessage(text);
    }
  }, [currentUserId, loadTeams, onTeamChange, showMessage]);

  const handleJoinByCode = useCallback(async () => {
    if (!currentUserId) {
      showMessage("Сначала выберите профиль игрока");
      return;
    }

    const code = window.prompt("Код приглашения");
    if (!code || !code.trim()) {
      return;
    }

    try {
      const joined = await joinTeamByCode({ code: code.trim() }, currentUserId);
      onTeamChange(joined.id, joined.name);
      await loadTeams();
      showMessage(`Вы вступили в команду "${joined.name}"`);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Не удалось вступить в команду";
      showMessage(text);
    }
  }, [currentUserId, loadTeams, onTeamChange, showMessage]);

  const handleTeamChange = useCallback(
    async (nextTeamId: string) => {
      if (!nextTeamId) {
        onTeamChange(null, null);
        return;
      }

      const selectedTeam = options.find((team) => team.id === nextTeamId);
      if (!selectedTeam) {
        return;
      }

      if (!filterOnly && selectedTeam.visibility === TeamVisibility.Public && currentUserId) {
        try {
          await joinPublicTeam(selectedTeam.id, currentUserId);
        } catch (error) {
          const text = error instanceof Error ? error.message : "Не удалось вступить в команду";
          showMessage(text);
          return;
        }
      }

      onTeamChange(selectedTeam.id, selectedTeam.name);
    },
    [currentUserId, filterOnly, onTeamChange, options, showMessage],
  );

  const containerStyle = filterOnly
    ? {
        backgroundColor: "transparent",
        padding: "0",
        marginBottom: "12px",
      }
    : {
        border: "1px solid var(--hp-border)",
        borderRadius: "12px",
        backgroundColor: "var(--hp-surface-soft)",
        padding: "12px",
        marginBottom: "12px",
      };

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: filterOnly ? "6px" : "8px" }}>
        <strong style={{ color: "var(--hp-heading)", fontSize: filterOnly ? "13px" : "14px" }}>Команда</strong>
        <button
          type="button"
          onClick={() => void loadTeams()}
          disabled={loading}
          title={loading ? "Обновляем команды" : "Обновить команды"}
          style={{
            minWidth: filterOnly ? "30px" : "auto",
            height: filterOnly ? "30px" : "auto",
            border: filterOnly ? "1px solid var(--hp-border)" : "none",
            borderRadius: filterOnly ? "10px" : 0,
            padding: filterOnly ? "0" : 0,
            background: filterOnly ? "var(--hp-surface)" : "transparent",
            color: "var(--hp-primary)",
            cursor: loading ? "wait" : "pointer",
            fontSize: filterOnly ? "16px" : "12px",
            fontWeight: filterOnly ? 900 : 600,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: filterOnly ? "var(--hp-shadow-sm)" : "none",
          }}
        >
          {filterOnly ? (loading ? "…" : "↻") : loading ? "Обновление..." : "Обновить"}
        </button>
      </div>

      {apiUnavailable ? (
        <div
          style={{
            fontSize: "12px",
            color: "var(--hp-muted)",
            backgroundColor: "var(--hp-surface-muted)",
            borderRadius: "8px",
            padding: "8px",
          }}
        >
          Команды недоступны на текущем сервере.
        </div>
      ) : (
        <>
          <select
            value={selectedValue}
            onChange={(event) => void handleTeamChange(event.target.value)}
            style={{
              width: "100%",
              padding: filterOnly ? "11px 36px 11px 12px" : "10px 12px",
              borderRadius: filterOnly ? "12px" : "10px",
              border: "1px solid var(--hp-border)",
              marginBottom: filterOnly ? 0 : "10px",
              backgroundColor: "var(--hp-input-bg)",
              color: "var(--hp-text)",
              boxShadow: filterOnly ? "var(--hp-shadow-sm)" : "none",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="">Все мероприятия</option>
            {options.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          {!filterOnly && (
            <>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => void handleJoinByCode()}
                  disabled={!currentUserId}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: "10px",
                    border: "1px solid var(--hp-border)",
                    backgroundColor: currentUserId ? "var(--hp-surface)" : "var(--hp-surface-muted)",
                    color: "var(--hp-primary-text)",
                    cursor: currentUserId ? "pointer" : "not-allowed",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Вступить по коду
                </button>
                <button
                  onClick={() => void handleCreateTeam()}
                  disabled={!currentUserId}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: "10px",
                    border: "1px solid var(--hp-primary)",
                    backgroundColor: currentUserId ? "var(--hp-primary)" : "var(--hp-border-strong)",
                    color: "white",
                    cursor: currentUserId ? "pointer" : "not-allowed",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Создать команду
                </button>
              </div>

              <button
                onClick={onOpenTeamsPage}
                style={{
                  marginTop: "8px",
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  border: "1px solid var(--hp-border)",
                  backgroundColor: "var(--hp-surface)",
                  color: "var(--hp-primary-text)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Управление командами
              </button>
            </>
          )}
        </>
      )}

      {message && (
        <div
          style={{
            marginTop: "8px",
            fontSize: "12px",
            color: "var(--hp-primary-text)",
            backgroundColor: "var(--hp-primary-soft)",
            borderRadius: "8px",
            padding: "6px 8px",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
