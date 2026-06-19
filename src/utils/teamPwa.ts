export type TeamPwaStartPage = "team" | "events" | "news";

export interface TeamPwaPreferences {
  startPage: TeamPwaStartPage;
  teamName?: string;
  appName?: string;
}

const STORAGE_PREFIX = "hp:teamPwaPreferences:";
const ACTIVE_TEAM_ID_KEY = "hp:activeTeamPwaId";
const REINSTALL_REQUIRED_KEY = "hp:teamPwaReinstallRequired";

const isStartPage = (value: unknown): value is TeamPwaStartPage =>
  value === "team" || value === "events" || value === "news";

export const getTeamPwaPreferences = (teamId: string): TeamPwaPreferences => {
  try {
    const rawValue = localStorage.getItem(`${STORAGE_PREFIX}${teamId}`);
    if (!rawValue) {
      return { startPage: "team" };
    }

    const parsed = JSON.parse(rawValue) as Partial<TeamPwaPreferences>;
    return {
      startPage: isStartPage(parsed.startPage) ? parsed.startPage : "team",
      teamName: parsed.teamName?.trim() || undefined,
      appName: parsed.appName?.trim() || undefined,
    };
  } catch {
    return { startPage: "team" };
  }
};

export const setTeamPwaPreferences = (teamId: string, preferences: TeamPwaPreferences): void => {
  localStorage.setItem(`${STORAGE_PREFIX}${teamId}`, JSON.stringify(preferences));
};

export const getTeamPwaDestination = (teamId: string): string => {
  switch (getTeamPwaPreferences(teamId).startPage) {
    case "events":
      return "/events";
    case "news":
      return "/news";
    default:
      return `/teams/${teamId}`;
  }
};

export const isStandalonePwa = (): boolean => {
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
};

export const setActiveTeamPwa = (teamId: string, reinstallRequired: boolean): void => {
  sessionStorage.setItem(ACTIVE_TEAM_ID_KEY, teamId);
  if (reinstallRequired) {
    sessionStorage.setItem(REINSTALL_REQUIRED_KEY, "true");
  } else {
    sessionStorage.removeItem(REINSTALL_REQUIRED_KEY);
  }
};

export const getActiveTeamPwaId = (): string | null =>
  isStandalonePwa() ? sessionStorage.getItem(ACTIVE_TEAM_ID_KEY) : null;

export const isTeamPwaReinstallRequired = (): boolean =>
  isStandalonePwa() && sessionStorage.getItem(REINSTALL_REQUIRED_KEY) === "true";
