import { useCallback, useState } from "react";
import { getTeamPwaLogoUrl } from "src/api/teams";
import { TeamDto } from "src/types/teams";
import { isStandalonePwa } from "src/utils/teamPwa";

export type TeamPwaInstallResult = "redirected" | "unavailable";

export interface TeamPwaInstallOptions {
  appName: string;
}

const TEAM_PWA_CACHE_NAME = "hockey-planner-team-pwa";

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Team logo could not be loaded"));
    image.src = source;
  });

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Team icon could not be created"));
      }
    }, "image/png");
  });

const createIcon = async (sourceUrl: string, size: number): Promise<Blob> => {
  const response = await fetch(sourceUrl, { mode: "cors", cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Team logo request failed: ${response.status}`);
  }

  const sourceBlob = await response.blob();
  const objectUrl = URL.createObjectURL(sourceBlob);

  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas is unavailable");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);

    const padding = Math.round(size * 0.12);
    const availableSize = size - padding * 2;
    const scale = Math.min(availableSize / image.naturalWidth, availableSize / image.naturalHeight);
    const width = Math.round(image.naturalWidth * scale);
    const height = Math.round(image.naturalHeight * scale);

    context.drawImage(image, Math.round((size - width) / 2), Math.round((size - height) / 2), width, height);
    return await canvasToBlob(canvas);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export function useTeamPwaInstall(team: TeamDto | null, options: TeamPwaInstallOptions) {
  const [isPreparing, setIsPreparing] = useState(false);

  const install = useCallback(async (): Promise<TeamPwaInstallResult> => {
    if (!team?.avatarUrl || isStandalonePwa() || !("serviceWorker" in navigator) || !("caches" in window)) {
      return "unavailable";
    }

    setIsPreparing(true);
    try {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        throw new Error("Service worker is not controlling the page");
      }

      const normalizedAppName = options.appName.trim() || team.name;
      const version = `${Date.now()}`;
      const assetBase = `/pwa-assets/teams/${encodeURIComponent(team.id)}`;
      const manifestPath = `${assetBase}/manifest-${version}.webmanifest`;
      const icon192Path = `${assetBase}/icon-192-${version}.png`;
      const icon512Path = `${assetBase}/icon-512-${version}.png`;
      const launchUrl = new URL(`/pwa/teams/${team.id}`, window.location.origin).href;
      const pwaLogoUrl = getTeamPwaLogoUrl(team.id);

      const [icon192, icon512] = await Promise.all([
        createIcon(pwaLogoUrl, 192),
        createIcon(pwaLogoUrl, 512),
      ]);

      const manifest = {
        id: launchUrl,
        name: normalizedAppName.slice(0, 50),
        short_name: normalizedAppName.slice(0, 24),
        description: `Hockey Planner: ${team.name}`,
        start_url: launchUrl,
        scope: `${window.location.origin}/`,
        display: "standalone",
        theme_color: "#0b1220",
        background_color: "#ffffff",
        icons: [
          { src: new URL(icon192Path, window.location.origin).href, type: "image/png", sizes: "192x192", purpose: "any maskable" },
          { src: new URL(icon512Path, window.location.origin).href, type: "image/png", sizes: "512x512", purpose: "any maskable" },
        ],
      };

      const cache = await caches.open(TEAM_PWA_CACHE_NAME);
      const existingRequests = await cache.keys();
      await Promise.all(existingRequests
        .filter((request) => new URL(request.url).pathname.startsWith(`${assetBase}/`))
        .map((request) => cache.delete(request)));

      await Promise.all([
        cache.put(icon192Path, new Response(icon192, { headers: { "Content-Type": "image/png", "Cache-Control": "no-cache" } })),
        cache.put(icon512Path, new Response(icon512, { headers: { "Content-Type": "image/png", "Cache-Control": "no-cache" } })),
        cache.put(manifestPath, new Response(JSON.stringify(manifest), {
          headers: { "Content-Type": "application/manifest+json", "Cache-Control": "no-cache" },
        })),
      ]);

      const installerUrl = new URL("/team-install.html", window.location.origin);
      installerUrl.searchParams.set("teamId", team.id);
      installerUrl.searchParams.set("manifest", manifestPath);
      installerUrl.searchParams.set("icon", icon192Path);
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
