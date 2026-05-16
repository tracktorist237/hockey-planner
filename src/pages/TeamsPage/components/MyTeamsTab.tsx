import { TeamDto } from "src/types/teams";
import { TeamCard } from "./TeamCard";

interface MyTeamsTabProps {
  teams: TeamDto[];
  loading: boolean;
  onGoPublic: () => void;
  onGoCode: () => void;
  onOpenTeam: (team: TeamDto) => void;
  pinnedTeamIds: string[];
  onTogglePin: (teamId: string) => void;
}

export function MyTeamsTab({ teams, loading, onGoPublic, onGoCode, onOpenTeam, pinnedTeamIds, onTogglePin }: MyTeamsTabProps) {
  return (
    <div style={{ marginTop: 14 }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 20, color: "#0f172a" }}>Мои команды</h2>
      <p style={{ margin: "0 0 12px", color: "#64748b", lineHeight: 1.4 }}>
        Здесь только команды, в которые вы уже вступили. Управление открывается на отдельной странице команды.
      </p>

      <div style={{ display: "grid", gap: 10 }}>
        {loading && <div style={{ color: "#64748b" }}>Загружаем...</div>}
        {!loading && teams.length === 0 && (
          <div style={{ border: "1px dashed #cbd5e1", borderRadius: 16, padding: 16, color: "#475569", background: "#f8fafc" }}>
            <div style={{ fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>Вы пока не состоите ни в одной команде</div>
            <div style={{ lineHeight: 1.45, marginBottom: 12 }}>
              Можно найти публичную команду или вступить в закрытую по коду приглашения.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button type="button" onClick={onGoPublic} style={{ border: 0, borderRadius: 12, padding: "11px 10px", background: "#dbeafe", color: "#1d4ed8", fontWeight: 800 }}>
                Найти
              </button>
              <button type="button" onClick={onGoCode} style={{ border: 0, borderRadius: 12, padding: "11px 10px", background: "#f1f5f9", color: "#334155", fontWeight: 800 }}>
                Ввести код
              </button>
            </div>
          </div>
        )}
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            actionText="Открыть команду"
            actionTone="blue"
            isPinned={pinnedTeamIds.includes(team.id)}
            onTogglePin={() => onTogglePin(team.id)}
            onAction={() => onOpenTeam(team)}
          />
        ))}
      </div>
    </div>
  );
}
