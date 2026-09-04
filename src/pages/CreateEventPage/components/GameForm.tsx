import { UniformColorSection } from "src/pages/CreateEventPage/components/UniformColorSection";
import { EditableEventTitle } from "src/pages/CreateEventPage/components/EditableEventTitle";

interface GameFormProps {
  title: string;
  leagueName: string;
  homeTeamName: string;
  awayTeamName: string;
  uniformColorId: string;
  teamId: string | null;
  onTitleChange: (value: string) => void;
  onLeagueChange: (value: string) => void;
  onHomeChange: (value: string) => void;
  onAwayChange: (value: string) => void;
  onUniformColorChange: (value: string) => void;
  sourceLocked?: boolean;
}

export const GameForm = ({
  title,
  leagueName,
  homeTeamName,
  awayTeamName,
  uniformColorId,
  teamId,
  onTitleChange,
  onLeagueChange,
  onHomeChange,
  onAwayChange,
  onUniformColorChange,
  sourceLocked = false,
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
          disabled={sourceLocked}
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
            disabled={sourceLocked}
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
            disabled={sourceLocked}
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
        <EditableEventTitle
          label="Название матча"
          value={title || `${homeTeamName} — ${awayTeamName}`}
          onChange={onTitleChange}
          backgroundColor="var(--hp-success-soft)"
          borderColor="var(--hp-success-border)"
          color="var(--hp-success)"
          disabled={sourceLocked}
        />
      )}
    </div>
  );
};
