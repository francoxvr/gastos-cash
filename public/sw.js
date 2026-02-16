// Service Worker para Gastos Cash PWA
// Versión del caché - incrementar cuando actualices archivos
const CACHE_VERSION = 'gastos-cash-v1';

// Archivos a cachear para funcionamiento offline
const STATIC_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
  // Agrega aquí otros archivos CSS/JS que uses
];

// Evento de instalación - cachea archivos estáticos
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => {
        console.log('Service Worker: Cacheando archivos');
        return cache.addAll(STATIC_CACHE);
      })
      .then(() => self.skipWaiting()) // Activa el SW inmediatamente
  );
});

// Evento de activación - limpia cachés antiguos
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_VERSION) {
            console.log('Service Worker: Eliminando caché antigua', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Toma control de todas las páginas
  );
});

// Estrategia de caché: Network First, Cache Fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clona la respuesta y guárdala en caché
        const responseClone = response.clone();
        caches.open(CACHE_VERSION).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Si falla la red, intenta obtener del caché
        return caches.match(event.request);
      })
  );
});