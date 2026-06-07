// REGUL ARENA — Service Worker
// Version : incrementer à chaque déploiement pour forcer la mise à jour du cache
const CACHE_VERSION = 'regul-arena-v1';

// Ressources mises en cache à l'installation (shell statique uniquement)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// ─── Installation ────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // On tente de mettre en cache les assets statiques
      // On ignore les erreurs individuelles pour ne pas bloquer l'install
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Cache miss pour', url, err.message);
          })
        )
      );
    })
  );
  // Activer immédiatement sans attendre la fermeture des anciens onglets
  self.skipWaiting();
});

// ─── Activation : nettoyage des anciens caches ────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => {
            console.log('[SW] Suppression ancien cache :', key);
            return caches.delete(key);
          })
      )
    )
  );
  // Prendre le contrôle de tous les clients ouverts immédiatement
  self.clients.claim();
});

// ─── Fetch : Network-first avec fallback cache ────────────────────────────────
// Stratégie :
//   - Requêtes API (/api/*, /auth/*) → network only, jamais mises en cache
//   - Assets statiques → cache-first
//   - Pages HTML → network-first, fallback sur cache puis page offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-HTTP (chrome-extension, etc.)
  if (!request.url.startsWith('http')) return;

  // Requêtes API → toujours réseau, pas de cache
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/socket') ||
    request.method !== 'GET'
  ) {
    return; // Laisser le navigateur gérer normalement
  }

  // Assets statiques (images, icônes, JS, CSS) → cache-first
  if (
    request.destination === 'image' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Pages HTML → network-first, fallback cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // Fallback sur la page d'accueil si disponible
          return caches.match('/') || caches.match('/index.html');
        });
      })
  );
});
