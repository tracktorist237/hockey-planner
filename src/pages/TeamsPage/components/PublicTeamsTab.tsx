import { TeamDto } from "src/types/teams";
import { TeamCard } from "./TeamCard";

interface PublicTeamsTabProps {
  teams: TeamDto[];
  loading: boolean;
  onOpenTeam: (team: TeamDto) => void;
}

export function PublicTeamsTab({ teams, loading, onOpenTeam }: PublicTeamsTabProps) {
  return (
    <div style={{ marginTop: 14 }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 20, color: "#0f172a" }}>Найти публичную команду</h2>
      <p style={{ margin: "0 0 12px", color: "#64748b", lineHeight: 1.4 }}>
        Здесь команда не выбирается одним нажатием. Сначала откройте страницу команды, посмотрите информацию и подтвердите вступление.
      </p>

      <div style={{ display: "grid", gap: 10, maxHeight: 390, overflowY: "auto", paddingRight: 4 }}>
        {loading && <div style={{ color: "#64748b" }}>Загружаем...</div>}
        {!loading && teams.length === 0 && <div style={{ color: "#64748b" }}>Публичных команд для вступления пока нет.</div>}
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            actionText="Открыть страницу команды"
            actionTone="blue"
            onAction={() => onOpenTeam(team)}
          />
        ))}
      </div>
    </div>
  );
}
