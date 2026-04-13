/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

// Это необходимо для правильной типизации service worker в TypeScript
declare const self: ServiceWorkerGlobalScope;

// ⚠️ ВАЖНО: Этот комментарий - маркер для Workbox
// Он будет заменен на список файлов для кеширования
const manifest = self.__WB_MANIFEST; // Workbox заменит это на реальный массив

const CACHE_NAME = 'hockey-planner-v1';

// Установка service worker
self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  self.skipWaiting();
});

// Активация и очистка старых кешей
self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Стратегия кеширования
self.addEventListener('fetch', (event) => {
  // Не кешируем API запросы
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
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
      self.registration.showNotification(payload.title || "Уведомление", {
        body: payload.body || "",
        icon: "/logo192.png",
        badge: "/logo192.png",
        data: { url: payload.url || "/events" },
      }),
    );
  } catch {
    event.waitUntil(
      self.registration.showNotification("Уведомление", {
        body: event.data.text(),
        icon: "/logo192.png",
        badge: "/logo192.png",
        data: { url: "/events" },
      }),
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
