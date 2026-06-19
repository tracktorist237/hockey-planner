import { useCallback, useEffect, useState } from "react";
import { getTeamPwaLogoUrl } from "src/api/teams";
import { TeamDto } from "src/types/teams";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export type TeamPwaInstallResult = "accepted" | "dismissed" | "manual" | "unavailable";

export interface TeamPwaInstallOptions {
  appName: string;
}

const isStandalone = (): boolean => {
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
};

const isIos = (): boolean => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Team logo could not be loaded"));
    image.src = source;
  });

const createIcon = async (sourceUrl: string, size: number): Promise<string> => {
  const response = await fetch(sourceUrl, { mode: "cors", cache: "force-cache" });
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
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export function useTeamPwaInstall(team: TeamDto | null, options: TeamPwaInstallOptions) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!team?.avatarUrl || isStandalone()) {
      setIsReady(false);
      return;
    }

    let disposed = false;
    let manifestUrl: string | null = null;
    const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const touchIconLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    const originalManifestHref = manifestLink?.href;
    const originalTouchIconHref = touchIconLink?.href;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    setIsPreparing(true);
    setIsReady(false);
    setInstallPrompt(null);

    const applyManifest = (icon192: string, icon512: string) => {
      if (disposed) {
        return;
      }

      const normalizedAppName = options.appName.trim() || team.name;
      const launchUrl = new URL(`/pwa/teams/${team.id}`, window.location.origin).href;
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
          { src: icon192, type: "image/png", sizes: "192x192", purpose: "any maskable" },
          { src: icon512, type: "image/png", sizes: "512x512", purpose: "any maskable" },
        ],
      };

      manifestUrl = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" }));

      if (manifestLink) {
        manifestLink.href = manifestUrl;
      }
      if (touchIconLink) {
        touchIconLink.href = icon192;
      }

      setIsReady(true);
    };

    const pwaLogoUrl = getTeamPwaLogoUrl(team.id);
    const iconPreparation = Promise.all([
      createIcon(pwaLogoUrl, 192),
      createIcon(pwaLogoUrl, 512),
    ]);

    void iconPreparation
      .then(([icon192, icon512]) => applyManifest(icon192, icon512))
      .catch((error) => {
        console.warn("Team logo cannot be resized in the browser; original image will be used:", error);
        if (!disposed) {
          applyManifest(team.avatarUrl!, team.avatarUrl!);
        }
      })
      .finally(() => {
        if (!disposed) {
          setIsPreparing(false);
        }
      });

    return () => {
      disposed = true;
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      setInstallPrompt(null);

      if (manifestLink && originalManifestHref) {
        manifestLink.href = originalManifestHref;
      }
      if (touchIconLink && originalTouchIconHref) {
        touchIconLink.href = originalTouchIconHref;
      }
      if (manifestUrl) {
        URL.revokeObjectURL(manifestUrl);
      }
    };
  }, [options.appName, team?.avatarUrl, team?.id, team?.name]);

  const install = useCallback(async (): Promise<TeamPwaInstallResult> => {
    if (!team?.avatarUrl || !isReady || isStandalone()) {
      return "unavailable";
    }

    if (!installPrompt) {
      return "manual";
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    return choice.outcome;
  }, [installPrompt, isReady, team?.avatarUrl]);

  return {
    canOfferInstall: Boolean(team?.avatarUrl) && !isStandalone(),
    isPreparing,
    isReady,
    requiresManualInstall: isReady && (!installPrompt || isIos()),
    install,
  };
}
