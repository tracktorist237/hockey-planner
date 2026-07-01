import { useCallback, useEffect, useMemo, useState } from "react";

const DISMISSED_UNTIL_KEY = "hp:pwaInstallDismissedUntil";
const DISMISS_DELAY_MS = 7 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const isRunningStandalone = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };

  return (
    Boolean(window.matchMedia?.("(display-mode: standalone)").matches) ||
    Boolean(window.matchMedia?.("(display-mode: fullscreen)").matches) ||
    Boolean(window.matchMedia?.("(display-mode: minimal-ui)").matches) ||
    navigatorWithStandalone.standalone === true ||
    document.referrer.startsWith("android-app://")
  );
};

const isDismissedNow = (): boolean => {
  try {
    const rawValue = localStorage.getItem(DISMISSED_UNTIL_KEY);
    const dismissedUntil = rawValue ? Number(rawValue) : 0;
    return Number.isFinite(dismissedUntil) && dismissedUntil > Date.now();
  } catch {
    return false;
  }
};

export function usePwaInstallPrompt(isEnabled: boolean) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(() => isRunningStandalone());
  const [isDismissed, setIsDismissed] = useState(() => isDismissedNow());

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setIsDismissed(isDismissedNow());
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
      try {
        localStorage.removeItem(DISMISSED_UNTIL_KEY);
      } catch {
        // Optional install prompt persistence.
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const canInstall = useMemo(
    () => isEnabled && Boolean(installPrompt) && !isStandalone && !isDismissed,
    [installPrompt, isDismissed, isEnabled, isStandalone],
  );

  const install = useCallback(async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (choice.outcome === "dismissed") {
      try {
        localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_DELAY_MS));
      } catch {
        // Optional install prompt persistence.
      }
      setIsDismissed(true);
    }
  }, [installPrompt]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_DELAY_MS));
    } catch {
      // Optional install prompt persistence.
    }
    setIsDismissed(true);
  }, []);

  return {
    canInstall,
    install,
    dismiss,
  };
}
