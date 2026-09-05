import type { ExternalLeagueProvider } from "src/api/externalLeagueTeams";

export type TeamsTab = "my" | "public" | "code" | "create";

export interface SelectedExternalTeam {
  provider: ExternalLeagueProvider;
  externalTeamId: string;
  name: string;
  isPrimary: boolean;
}
