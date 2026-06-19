/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

declare const self: ServiceWorkerGlobalScope;

const manifest = self.__WB_MANIFEST;
void manifest;

const CACHE_NAME = "hockey-planner-v2";
const TEAM_PWA_CACHE_NAME = "hockey-planner-team-pwa";

const getPathname = (request: Request) => new URL(request.url).pathname;
const isSameOrigin = (request: Request) => new URL(request.url).origin === self.location.origin;
const isApiRequest = (request: Request) => getPathname(request).startsWith("/api/");
const isServiceWorkerRequest = (request: Request) => getPathname(request).endsWith("/service-worker.js");
const isTeamPwaAssetRequest = (request: Request) => getPathname(request).startsWith("/pwa-assets/teams/");
const isNavigationRequest = (request: Request) =>
  request.mode === "navigate" || request.headers.get("accept")?.includes("text/html");
const isStaticAssetRequest = (request: Request) => {
  const pathname = getPathname(request);
  return (
    pathname.startsWith("/static/") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".webmanifest") ||
    pathname.endsWith("/manifest.json")
  );
};

const cacheFirst = async (request: Request) => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  if (networkResponse && networkResponse.status === 200) {
    const responseToCache = networkResponse.clone();
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, responseToCache);
  }

  return networkResponse;
};

const networkFirst = async (request: Request) => {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, responseToCache);
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const cachedShell = await caches.match("/index.html");
    if (cachedShell) {
      return cachedShell;
    }

    throw error;
  }
};

self.addEventListener("install", (event) => {
  console.log("Service worker installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(manifest.map((entry) => entry.url)))
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.warn("Failed to precache app shell:", error);
      }),
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service worker activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== TEAM_PWA_CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    !isSameOrigin(event.request) ||
    isApiRequest(event.request) ||
    isServiceWorkerRequest(event.request)
  ) {
    return;
  }

  if (isTeamPwaAssetRequest(event.request)) {
    event.respondWith(
      caches.match(event.request).then((response) =>
        response ?? new Response("Team PWA asset not found", { status: 404 }),
      ),
    );
    return;
  }

  if (isNavigationRequest(event.request)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (isStaticAssetRequest(event.request)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  event.respondWith(networkFirst(event.request));
});

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  try {
    const payload = event.data.json() as {
      title?: string;
      body?: string;
      url?: string;
    };

    event.waitUntil(
      Promise.all([
        self.registration.showNotification(payload.title || "Уведомление", {
          body: payload.body || "",
          icon: "/logo192.png",
          badge: "/logo192.png",
          data: { url: payload.url || "/events" },
        }),
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
          clientList.forEach((client) => {
            client.postMessage({ type: "HP_NOTIFICATION_RECEIVED" });
          });
        }),
      ]),
    );
  } catch {
    event.waitUntil(
      Promise.all([
        self.registration.showNotification("Уведомление", {
          body: event.data.text(),
          icon: "/logo192.png",
          badge: "/logo192.png",
          data: { url: "/events" },
        }),
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
          clientList.forEach((client) => {
            client.postMessage({ type: "HP_NOTIFICATION_RECEIVED" });
          });
        }),
      ]),
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = ((event.notification.data as { url?: string } | undefined)?.url) || "/events";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return Promise.resolve(undefined);
    }),
  );
});

export {};
