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
    })
  );
});
