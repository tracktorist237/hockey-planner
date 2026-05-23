import { UniformColorSection } from "src/pages/CreateEventPage/components/UniformColorSection";

interface GameFormProps {
  leagueName: string;
  homeTeamName: string;
  awayTeamName: string;
  uniformColorId: string;
  teamId: string | null;
  onLeagueChange: (value: string) => void;
  onHomeChange: (value: string) => void;
  onAwayChange: (value: string) => void;
  onUniformColorChange: (value: string) => void;
}

export const GameForm = ({
  leagueName,
  homeTeamName,
  awayTeamName,
  uniformColorId,
  teamId,
  onLeagueChange,
  onHomeChange,
  onAwayChange,
  onUniformColorChange,
}: GameFormProps) => {
  const TEAM_HINT = "Северная Столица";
  const homeSuggestionsId = "home-team-suggestions";
  const awaySuggestionsId = "away-team-suggestions";

  return (
    <div
      style={{
        backgroundColor: "var(--hp-surface-soft)",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "20px",
        border: "1px solid var(--hp-primary-soft)",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px", fontWeight: "600", color: "var(--hp-heading)" }}>
        🏆 Информация о матче
      </h3>

      <div style={{ marginBottom: "16px", width: "100%", boxSizing: "border-box" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "15px" }}>
          Лига (дивизион)
        </label>
        <input
          value={leagueName}
          onChange={(e) => onLeagueChange(e.target.value)}
          placeholder="Например: Д4"
          style={{
            width: "100%",
            padding: "14px",
            border: "1px solid var(--hp-border)",
            borderRadius: "10px",
            fontSize: "16px",
            backgroundColor: "var(--hp-surface)",
            color: "var(--hp-text)",
            boxSizing: "border-box",
            maxWidth: "100%",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ width: "100%", boxSizing: "border-box" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "15px" }}>
            Домашняя команда *
          </label>
          <input
            value={homeTeamName}
            onChange={(e) => onHomeChange(e.target.value)}
            placeholder="Например: Медведи"
            list={homeSuggestionsId}
            style={{
              width: "100%",
              padding: "14px",
              border: "1px solid var(--hp-border)",
              borderRadius: "10px",
              fontSize: "16px",
              backgroundColor: "var(--hp-surface)",
              color: "var(--hp-text)",
              boxSizing: "border-box",
              maxWidth: "100%",
            }}
          />
          <datalist id={homeSuggestionsId}>
            <option value={TEAM_HINT} />
          </datalist>
        </div>

        <div style={{ width: "100%", boxSizing: "border-box" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "15px" }}>
            Гостевая команда *
          </label>
          <input
            value={awayTeamName}
            onChange={(e) => onAwayChange(e.target.value)}
            placeholder="Например: Волки"
            list={awaySuggestionsId}
            style={{
              width: "100%",
              padding: "14px",
              border: "1px solid var(--hp-border)",
              borderRadius: "10px",
              fontSize: "16px",
              backgroundColor: "var(--hp-surface)",
              color: "var(--hp-text)",
              boxSizing: "border-box",
              maxWidth: "100%",
            }}
          />
          <datalist id={awaySuggestionsId}>
            <option value={TEAM_HINT} />
          </datalist>
        </div>
      </div>

      <UniformColorSection selectedUniformColorId={uniformColorId} teamId={teamId} onChange={onUniformColorChange} />

      {homeTeamName && awayTeamName && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "var(--hp-success-soft)",
            borderRadius: "10px",
            fontSize: "14px",
            color: "var(--hp-success)",
            textAlign: "center",
            border: "1px solid var(--hp-success-border)",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <strong>Название матча:</strong>
          <br />
          <span style={{ fontSize: "15px", fontWeight: "600" }}>{homeTeamName} — {awayTeamName}</span>
        </div>
      )}
    </div>
  );
};
