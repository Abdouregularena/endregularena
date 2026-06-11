/* ═══════════════════════════════════════════════════════════════
   MODULE NAVIGATION PAR MÉTIER — REGUL ARENA  (version sur-mesure)
   - Se branche automatiquement sur render() : AUCUNE modif d'index.html.
   - S'affiche en haut de la page "Quiz & Formation" (TAB==='quiz').
   - Lance les packs via la vraie fonction du site : startQ(<tableau>, titre).
   - Aucun impact backend / scoring / régression.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── Inventaire des packs (miroir de rQP) : dataset global + métiers couverts ──
  var PACKS_METIERS = [
    { ds: 'QR', titre: 'Relations Financières Extérieures (RFE UEMOA)', metiers: ['conformite', 'trade'] },
    { ds: 'QB', titre: 'Dispositif Prudentiel UMOA — Bâle II/III',      metiers: ['risques'] },
    { ds: 'QC', titre: 'Réglementation CEMAC (BEAC · COBAC)',           metiers: ['cemac'] }
  ];

  var METIERS = [
    { id: 'conformite', nom: 'Conformité / LBC-FT',           icone: '🛡️' },
    { id: 'trade',      nom: 'Trade Finance / Commerce intl',  icone: '🌍' },
    { id: 'risques',    nom: 'Crédit / Risques',              icone: '📊' },
    { id: 'cemac',      nom: 'Zone CEMAC',                    icone: '🌐' },
    { id: 'compta',     nom: 'Comptabilité / Reporting',      icone: '🧾' },
    { id: 'operations', nom: 'Caisse / Opérations',           icone: '🏦' },
    { id: 'commercial', nom: 'Commercial / Front office',     icone: '🤝' },
    { id: 'audit',      nom: 'Audit / Inspection',            icone: '🔍' }
  ];

  function esc(s) { return String(s).replace(/'/g, "\\'"); }

  function lirePacks() {
    return PACKS_METIERS.map(function (p) {
      var qs = (typeof window[p.ds] !== 'undefined' && Array.isArray(window[p.ds])) ? window[p.ds] : [];
      return { ds: p.ds, titre: p.titre, metiers: p.metiers, n: qs.length };
    }).filter(function (p) { return p.n > 0; });
  }

  function classerParMetier(packs) {
    var map = {};
    METIERS.forEach(function (m) { map[m.id] = []; });
    packs.forEach(function (p) {
      (p.metiers || []).forEach(function (mid) { if (map[mid]) map[mid].push(p); });
    });
    return map;
  }

  // ── Vue 1 : grille des métiers (uniquement ceux qui ont au moins 1 pack) ──
  function renderMetiers() {
    var box = document.getElementById('metiers-content');
    if (!box) return;
    var groupes = classerParMetier(lirePacks());
    var actifs = METIERS.filter(function (m) { return (groupes[m.id] || []).length > 0; });
    if (!actifs.length) { box.innerHTML = ''; return; }

    var html = '<div class="card" style="padding:16px;">' +
      '<div style="font-weight:800;color:white;font-size:15px;margin-bottom:3px;">🧭 Naviguer par métier</div>' +
      '<div style="font-size:11px;color:var(--sub);margin-bottom:12px;">Choisis ton métier pour accéder directement à tes packs.</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;">';
    actifs.forEach(function (m) {
      var n = groupes[m.id].length;
      html += '<div class="ch" onclick="renderPacksMetier(\'' + m.id + '\')" ' +
        'style="cursor:pointer;background:rgba(255,255,255,.04);border:1px solid rgba(201,153,26,.35);border-radius:12px;padding:14px;text-align:center;">' +
        '<div style="font-size:28px;line-height:1;">' + m.icone + '</div>' +
        '<div style="font-weight:700;color:white;font-size:12px;margin:7px 0 3px;">' + m.nom + '</div>' +
        '<div style="color:#C9991A;font-size:11px;font-weight:700;">' + n + ' pack' + (n > 1 ? 's' : '') + '</div>' +
        '</div>';
    });
    html += '</div></div>';
    box.innerHTML = html;
  }

  // ── Vue 2 : packs d'un métier ──
  function renderPacksMetier(id) {
    var box = document.getElementById('metiers-content');
    if (!box) return;
    var groupes = classerParMetier(lirePacks());
    var m = METIERS.filter(function (x) { return x.id === id; })[0] || { nom: 'Packs', icone: '📦' };
    var packs = groupes[id] || [];

    var html = '<div class="card" style="padding:16px;">' +
      '<button class="btn-out btn-sm" onclick="renderMetiers()" style="margin-bottom:12px;">← Métiers</button>' +
      '<div style="font-weight:800;color:white;font-size:15px;margin-bottom:10px;">' + m.icone + ' ' + m.nom + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">';
    packs.forEach(function (p) {
      html += '<div class="card ch" style="padding:13px;display:flex;justify-content:space-between;align-items:center;gap:10px;" ' +
        'onclick="lancerPackMetier(\'' + esc(p.ds) + '\',\'' + esc(p.titre) + '\')">' +
        '<div style="min-width:0;"><div style="font-weight:700;color:white;font-size:13px;">' + p.titre + '</div>' +
        '<div style="font-size:11px;color:var(--sub);">' + p.n + ' questions</div></div>' +
        '<span style="color:var(--cyan);font-size:20px;flex-shrink:0;line-height:1;">&#8594;</span></div>';
    });
    if (!packs.length) html += '<p style="color:var(--sub);font-size:12px;">Aucun pack dans ce métier.</p>';
    html += '</div></div>';
    box.innerHTML = html;
  }

  // ── Lancement : utilise la vraie fonction du site startQ(<tableau>, titre) ──
  function lancerPackMetier(ds, titre) {
    var qs = window[ds];
    if (Array.isArray(qs) && typeof window.startQ === 'function') {
      window.startQ(qs, titre);
    } else {
      alert('Impossible de lancer ce pack (' + ds + ').');
    }
  }

  // ── Auto-branchement sur render() : injecte le bloc en haut de la page Quiz ──
  function injectMetiers() {
    if (window.QZ && window.QZ.q && window.QZ.q.length > 0) return; // quiz en cours → ne pas injecter
    var ct = document.getElementById('ct');
    if (!ct) return;
    if (!document.getElementById('metiers-content')) {
      var b = document.createElement('div');
      b.id = 'metiers-content';
      b.style.marginBottom = '16px';
      ct.insertBefore(b, ct.firstChild);
    }
    renderMetiers();
  }

  function wireRender() {
    if (typeof window.render !== 'function') { return setTimeout(wireRender, 150); }
    if (window.__metiersWired) return;
    window.__metiersWired = true;
    var orig = window.render;
    window.render = function () {
      var r = orig.apply(this, arguments);
      try { if (window.TAB === 'quiz') injectMetiers(); } catch (e) {}
      return r;
    };
    try { if (window.TAB === 'quiz') injectMetiers(); } catch (e) {} // cas : déjà sur l'onglet Quiz
  }

  // Expose pour les onclick inline
  window.renderMetiers = renderMetiers;
  window.renderPacksMetier = renderPacksMetier;
  window.lancerPackMetier = lancerPackMetier;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireRender);
  } else {
    wireRender();
  }
})();
