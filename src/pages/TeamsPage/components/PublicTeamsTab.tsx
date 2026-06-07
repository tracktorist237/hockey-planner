import { useMemo, useState } from "react";
import { TeamDto } from "src/types/teams";
import { LoadingIndicator } from "src/components/LoadingIndicator";
import { inputStyle } from "./styles";
import { TeamCard } from "./TeamCard";

interface PublicTeamsTabProps {
  teams: TeamDto[];
  loading: boolean;
  onOpenTeam: (team: TeamDto) => void;
}

const getTeamSearchText = (team: TeamDto): string =>
  [
    team.name,
    team.description,
    ...(team.phones ?? []).flatMap((item) => [item.title, item.value]),
    ...(team.links ?? []).flatMap((item) => [item.title, item.value]),
    ...(team.addresses ?? []).flatMap((item) => [item.title, item.value]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export function PublicTeamsTab({ teams, loading, onOpenTeam }: PublicTeamsTabProps) {
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();
  const filteredTeams = useMemo(
    () => teams.filter((team) => !normalizedSearch || getTeamSearchText(team).includes(normalizedSearch)),
    [normalizedSearch, teams],
  );

  return (
    <div style={{ marginTop: 14 }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 20, color: "var(--hp-text-strong)" }}>Найти публичную команду</h2>
      <p style={{ margin: "0 0 12px", color: "var(--hp-muted)", lineHeight: 1.4 }}>
        Откройте страницу команды и вступите, если всё подходит.
      </p>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Поиск команды"
        style={{ ...inputStyle, marginBottom: 10 }}
      />

      {!loading && teams.length > 0 && (
        <div style={{ marginBottom: 10, color: "var(--hp-muted)", fontSize: 13, fontWeight: 700 }}>
          Найдено: {filteredTeams.length}
        </div>
      )}

      <div style={{ display: "grid", gap: 10, maxHeight: 390, overflowY: "auto", paddingRight: 4 }}>
        {loading && <LoadingIndicator text="Загружаем..." />}
        {!loading && teams.length === 0 && <div style={{ color: "var(--hp-muted)" }}>Публичных команд для вступления пока нет.</div>}
        {!loading && teams.length > 0 && filteredTeams.length === 0 && <div style={{ color: "var(--hp-muted)" }}>Команды не найдены.</div>}
        {filteredTeams.map((team) => (
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
