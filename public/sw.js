// REGUL ARENA — service worker (PWA installable)
// Stratégie "network-first" : toujours la dernière version en ligne,
// le cache ne sert que de secours hors-ligne. Évite le bug "vieille version bloquée".
const CACHE = 'regul-arena-v1';
const CORE = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(CORE).catch(function(){}); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    fetch(req).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(req, copy).catch(function(){}); });
      return res;
    }).catch(function(){
      return caches.match(req).then(function(r){ return r || caches.match('/index.html'); });
      /* ════════════════════════════════════════════════════════════════
   REGUL ARENA — PUSH WEB (Option B)
   ▶️ À COLLER À LA FIN de public/sw.js (100 % additif, ne touche à rien d'autre)
   Gère l'affichage des notifications push et le clic dessus.
   Format du payload envoyé par le serveur :
     { title, body, tag, url }
════════════════════════════════════════════════════════════════ */

self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {
    try { data = { title: 'REGUL ARENA', body: event.data ? event.data.text() : '' }; } catch (_) { data = {}; }
  }
  var title = data.title || 'REGUL ARENA';
  var options = {
    body: data.body || '',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: data.tag || 'regul-arena',
    renotify: true,
    vibrate: [80, 40, 80],
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      // Si l'app est déjà ouverte, on la met au premier plan et on la navigue
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if ('focus' in c) {
          try { if ('navigate' in c) c.navigate(target); } catch (e) {}
          return c.focus();
        }
      }
      // Sinon on ouvre une nouvelle fenêtre
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
    })
  );
});
