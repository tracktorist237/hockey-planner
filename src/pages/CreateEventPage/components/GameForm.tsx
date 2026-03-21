interface GameFormProps {
  leagueName: string;
  homeTeamName: string;
  awayTeamName: string;
  onLeagueChange: (value: string) => void;
  onHomeChange: (value: string) => void;
  onAwayChange: (value: string) => void;
}

export const GameForm = ({
  leagueName,
  homeTeamName,
  awayTeamName,
  onLeagueChange,
  onHomeChange,
  onAwayChange,
}: GameFormProps) => {
  return (
    <div
      style={{
        backgroundColor: "#f8f9fa",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "20px",
        border: "1px solid #e3f2fd",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px", fontWeight: "600", color: "#1a237e" }}>
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
            border: "1px solid #e0e0e0",
            borderRadius: "10px",
            fontSize: "16px",
            backgroundColor: "white",
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
            style={{
              width: "100%",
              padding: "14px",
              border: "1px solid #e0e0e0",
              borderRadius: "10px",
              fontSize: "16px",
              backgroundColor: "white",
              boxSizing: "border-box",
              maxWidth: "100%",
            }}
          />
        </div>

        <div style={{ width: "100%", boxSizing: "border-box" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "15px" }}>
            Гостевая команда *
          </label>
          <input
            value={awayTeamName}
            onChange={(e) => onAwayChange(e.target.value)}
            placeholder="Например: Волки"
            style={{
              width: "100%",
              padding: "14px",
              border: "1px solid #e0e0e0",
              borderRadius: "10px",
              fontSize: "16px",
              backgroundColor: "white",
              boxSizing: "border-box",
              maxWidth: "100%",
            }}
          />
        </div>
      </div>

      {homeTeamName && awayTeamName && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#e8f5e9",
            borderRadius: "10px",
            fontSize: "14px",
            color: "#2e7d32",
            textAlign: "center",
            border: "1px solid #c8e6c9",
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
