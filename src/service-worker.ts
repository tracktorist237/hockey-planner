/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

declare const self: ServiceWorkerGlobalScope;

const manifest = self.__WB_MANIFEST;
void manifest;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))),
      self.registration.unregister(),
    ])
      .then(() =>
        self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        }),
      )
      .then((clients) => {
        clients.forEach((client) => {
          client.navigate(client.url);
        });
      }),
  );
});

self.addEventListener("fetch", () => {
  return;
});

export {};
