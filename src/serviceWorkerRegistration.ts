const isLocalhost = Boolean(
  window.location.hostname === "localhost" ||
    window.location.hostname === "[::1]" ||
    window.location.hostname.match(
      /^127(?:\.\d+)?\.\d+\.\d+\.\d+$/
    )
);

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

export const SW_KILL_SWITCH_APPLIED_KEY = "hpSwKillSwitchApplied20260629";

export function register(config?: Config) {
  if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
    try {
      if (window.localStorage.getItem(SW_KILL_SWITCH_APPLIED_KEY) === "true") {
        return;
      }
    } catch {
      return;
    }

    const publicUrl = new URL(
      (process as { env: { PUBLIC_URL: string } }).env.PUBLIC_URL,
      window.location.href
    );

    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener("load", () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
      try {
        window.localStorage.setItem(SW_KILL_SWITCH_APPLIED_KEY, "true");
      } catch {
        // Continue anyway; the kill-switch service worker still performs the reset.
      }

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then((registration) => {
          console.log(
            "Service worker is active (localhost mode):",
            registration
          );
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl: string, config?: Config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      try {
        window.localStorage.setItem(SW_KILL_SWITCH_APPLIED_KEY, "true");
      } catch {
        // Ignore storage failures; the service worker still performs the reset.
      }

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              console.log("New content available, please refresh.");
              config?.onUpdate?.(registration);
            } else {
              console.log("Content cached for offline use.");
              config?.onSuccess?.(registration);
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error("Error during service worker registration:", error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
  fetch(swUrl, {
    headers: { "Service-Worker": "script" },
  })
    .then((response) => {
      const contentType = response.headers.get("content-type");
      if (
        response.status === 404 ||
        (contentType && contentType.indexOf("javascript") === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log(
        "No internet connection found. App is running in offline mode."
      );
    });
}
