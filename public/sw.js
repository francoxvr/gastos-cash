// Service Worker para Gastos Cash PWA (Next.js)
// Versión del caché - incrementar cuando actualices archivos
const CACHE_VERSION = 'gastos-cash-v1';

// Archivos estáticos a cachear (sin index.html)
const STATIC_CACHE = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Evento de instalación - cachea archivos estáticos
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => {
        console.log('Service Worker: Cacheando archivos estáticos');
        return cache.addAll(STATIC_CACHE);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('Service Worker: Error al cachear:', error);
      })
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
    }).then(() => self.clients.claim())
  );
});

// Estrategia de caché: Network First, Cache Fallback
self.addEventListener('fetch', (event) => {
  // Ignora requests que no sean GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Solo cachea respuestas exitosas
        if (response && response.status === 200) {
          const responseClone = response.clone();
          
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Si falla la red, intenta obtener del caché
        return caches.match(event.request);
      })
  );
});