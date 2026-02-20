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

export {};