import { useCallback, useState } from "react";
import { getTeamPwaIconUrl, getTeamPwaManifestUrl } from "src/api/teams";
import { TeamDto } from "src/types/teams";
import { isStandalonePwa } from "src/utils/teamPwa";

export type TeamPwaInstallResult = "redirected" | "unavailable";

export interface TeamPwaInstallOptions {
  appName: string;
}

export function useTeamPwaInstall(team: TeamDto | null, options: TeamPwaInstallOptions) {
  const [isPreparing, setIsPreparing] = useState(false);

  const install = useCallback(async (): Promise<TeamPwaInstallResult> => {
    if (!team?.avatarUrl || isStandalonePwa()) {
      return "unavailable";
    }

    setIsPreparing(true);
    try {
      const normalizedAppName = options.appName.trim() || team.name;
      const manifestUrl = getTeamPwaManifestUrl(team.id, normalizedAppName.slice(0, 50));
      const iconUrl = getTeamPwaIconUrl(team.id, 180);

      const [manifestResponse, iconResponse] = await Promise.all([
        fetch(manifestUrl, { cache: "no-store" }),
        fetch(iconUrl, { cache: "no-store" }),
      ]);
      if (!manifestResponse.ok || !iconResponse.ok) {
        throw new Error("Team PWA server assets are unavailable");
      }

      const installerUrl = new URL("/team-install.html", window.location.origin);
      installerUrl.searchParams.set("teamId", team.id);
      installerUrl.searchParams.set("manifest", manifestUrl);
      installerUrl.searchParams.set("icon", iconUrl);
      installerUrl.searchParams.set("name", normalizedAppName.slice(0, 50));
      window.location.assign(installerUrl.href);
      return "redirected";
    } catch (error) {
      console.error("Team PWA preparation failed:", error);
      return "unavailable";
    } finally {
      setIsPreparing(false);
    }
  }, [options.appName, team]);

  return {
    canOfferInstall: Boolean(team?.avatarUrl) && !isStandalonePwa(),
    isPreparing,
    isReady: Boolean(team?.avatarUrl),
    install,
  };
}
