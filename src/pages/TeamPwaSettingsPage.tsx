import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { getTeam } from "src/api/teams";
import { LoadingIndicator } from "src/components/LoadingIndicator";
import { InternalPageHeader } from "src/components/InternalPageHeader";
import { useAuth } from "src/hooks/useAuth";
import { TeamDto } from "src/types/teams";
import {
  getActiveTeamPwaId,
  getTeamPwaPreferences,
  isStandalonePwa,
  isTeamPwaReinstallRequired,
  setTeamPwaPreferences,
  TeamPwaStartPage,
} from "src/utils/teamPwa";

const startPageOptions: Array<{ value: TeamPwaStartPage; label: string }> = [
  { value: "events", label: "Мероприятия" },
  { value: "team", label: "Команда" },
  { value: "news", label: "Новости" },
];

export function TeamPwaSettingsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const activeTeamId = getActiveTeamPwaId();
  const [team, setTeam] = useState<TeamDto | null>(null);
  const [startPage, setStartPage] = useState<TeamPwaStartPage>(() =>
    activeTeamId ? getTeamPwaPreferences(activeTeamId).startPage : "team",
  );
  const [loading, setLoading] = useState(Boolean(activeTeamId));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!activeTeamId || !currentUser?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    void getTeam(activeTeamId, currentUser.id)
      .then(setTeam)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить команду.");
      })
      .finally(() => setLoading(false));
  }, [activeTeamId, currentUser?.id]);

  if (!isStandalonePwa() || !activeTeamId) {
    return <Navigate to="/settings" replace />;
  }

  const handleChange = (nextPage: TeamPwaStartPage) => {
    const currentPreferences = getTeamPwaPreferences(activeTeamId);
    setTeamPwaPreferences(activeTeamId, {
      ...currentPreferences,
      startPage: nextPage,
      teamName: team?.name ?? currentPreferences.teamName,
    });
    setStartPage(nextPage);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--hp-bg-gradient)", color: "var(--hp-text)", padding: 16, boxSizing: "border-box" }}>
      <main style={{ width: "100%", maxWidth: 620, margin: "0 auto" }}>
        <InternalPageHeader title="Стартовая страница" onBack={() => navigate("/settings")} position="static" marginBottom={16} />

        {isTeamPwaReinstallRequired() && (
          <div style={{ marginBottom: 12, border: "1px solid var(--hp-warning-border)", borderRadius: 14, padding: 13, background: "var(--hp-warning-soft)", color: "var(--hp-warning)", fontSize: 14, fontWeight: 800, lineHeight: 1.45 }}>
            Это приложение установлено в старом формате. Удалите его ярлык и установите приложение команды заново, иначе настройка запуска применяться не будет.
          </div>
        )}

        {error && <div style={{ marginBottom: 12, border: "1px solid var(--hp-danger-border)", borderRadius: 12, padding: 12, background: "var(--hp-danger-soft)", color: "var(--hp-danger)", fontWeight: 800 }}>{error}</div>}
        {loading && <div style={{ borderRadius: 16, padding: 20, background: "var(--hp-surface)", boxShadow: "var(--hp-shadow-sm)" }}><LoadingIndicator text="Загружаем приложение команды..." /></div>}

        {!loading && (
          <section style={{ border: "1px solid var(--hp-border)", borderRadius: 16, padding: 16, background: "var(--hp-surface)", boxShadow: "var(--hp-shadow-sm)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, overflow: "hidden", background: "var(--hp-surface-soft)", border: "1px solid var(--hp-border)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                {team?.avatarUrl
                  ? <img src={team.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ color: "var(--hp-primary)", fontWeight: 900 }}>{(team?.name ?? "H").slice(0, 1).toUpperCase()}</span>}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: "var(--hp-heading)", fontWeight: 900, overflowWrap: "anywhere" }}>
                  {team?.name ?? getTeamPwaPreferences(activeTeamId).teamName ?? "Приложение команды"}
                </div>
                {saved && <div style={{ marginTop: 3, color: "var(--hp-success)", fontSize: 12, fontWeight: 800 }}>Сохранено</div>}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6 }}>
              {startPageOptions.map((option) => {
                const selected = startPage === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange(option.value)}
                    style={{
                      minWidth: 0,
                      border: `1px solid ${selected ? "var(--hp-primary)" : "var(--hp-border)"}`,
                      borderRadius: 11,
                      padding: "11px 4px",
                      background: selected ? "var(--hp-primary-soft)" : "var(--hp-surface-soft)",
                      color: selected ? "var(--hp-primary)" : "var(--hp-text)",
                      fontSize: 12,
                      fontWeight: 900,
                      overflowWrap: "anywhere",
                      cursor: "pointer",
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
