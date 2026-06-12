/* ══════════════════════════════════════════════════════════════
   REGUL ARENA — Module Navigation par Métier
   Fichier : metiers.js  (public/metiers.js)
   Lance un quiz via startQ(questions, titre) — fonction globale index.html
   ══════════════════════════════════════════════════════════════ */
var CFG_METIERS = (function () {
  'use strict';

  var NAVY  = '#002B5C';
  var GOLD  = '#C9991A';
  var CREAM = '#F5F3EE';
  var INK   = '#1a2233';

  /* ── 8 catégories métiers UEMOA/CEMAC ── */
  var METIERS = [
    {
      id: 'conformite', nom: 'Conformité / LBC-FT', emo: '🛡️',
      kw: ['conformit', 'lbc', 'ft', 'blanchiment', 'financement', 'terrorisme', 'lcb', 'kyc', 'gafi', 'fatf']
    },
    {
      id: 'trade', nom: 'Trade Finance / Commerce extérieur', emo: '🌐',
      kw: ['trade', 'commerce', 'extérieur', 'rfe', 'change', 'transfert', 'domiciliation', 'crédit documentaire', 'lettre de crédit', 'garantie internationale', 'swift', 'incoterm', 'importat', 'exportat']
    },
    {
      id: 'credit', nom: 'Crédit / Risques', emo: '💳',
      kw: ['crédit', 'risque', 'prudentiel', 'bâle', 'fonds propres', 'tier', 'lcr', 'nsfr', 'grands risques', 'division', 'levier', 'apr', 'cet1', 'provision']
    },
    {
      id: 'comptabilite', nom: 'Comptabilité / Reporting', emo: '📊',
      kw: ['comptab', 'reporting', 'fodep', 'déclaration', 'pilier 3', 'communication financière', 'bilan', 'résultat', 'normes']
    },
    {
      id: 'caisse', nom: 'Caisse / Opérations', emo: '🏧',
      kw: ['caisse', 'opération', 'paiement', 'virement', 'espèces', 'monnaie', 'billet', 'coffreur', 'trésorerie']
    },
    {
      id: 'commercial', nom: 'Commercial / Front Office', emo: '🤝',
      kw: ['commercial', 'front', 'client', 'conseiller', 'épargne', 'dépôt', 'placement', 'produit bancaire']
    },
    {
      id: 'audit', nom: 'Audit / Inspection', emo: '🔍',
      kw: ['audit', 'inspection', 'contrôle', 'supervision', 'surveillance', 'commission bancaire', 'bceao', 'cobac', 'srep', 'icaap']
    },
    {
      id: 'cemac', nom: 'Zone CEMAC (BEAC · COBAC)', emo: '🌍',
      kw: ['cemac', 'beac', 'cobac', 'cameroun', 'gabon', 'congo', 'tchad', 'centrafrique', 'guinée équatoriale']
    }
  ];

  var _ov  = null;
  var _cur = [];

  /* ── Détecte le métier d'un pack à partir du titre + sous-titre ── */
  function metierDuPack(titre) {
    var t = (titre || '').toLowerCase();
    for (var mi = 0; mi < METIERS.length; mi++) {
      var m = METIERS[mi];
      for (var ki = 0; ki < m.kw.length; ki++) {
        if (t.indexOf(m.kw[ki]) !== -1) return m.id;
      }
    }
    return null;
  }

  /* ── Retourne les questions correspondant à un métier ── */
  function packsDuMetier(metierId) {
    // Packs disponibles dans index.html : QR (RFE), QB (Bâle), QC (CEMAC)
    var sources = [
      { qs: (typeof QR !== 'undefined' ? QR : []), titre: 'Relations Financières Extérieures', metier: 'trade' },
      { qs: (typeof QB !== 'undefined' ? QB : []), titre: 'Dispositif Prudentiel UMOA (Bâle II/III)', metier: 'credit' },
      { qs: (typeof QC !== 'undefined' ? QC : []), titre: 'Réglementation CEMAC (BEAC · COBAC)', metier: 'cemac' }
    ];
    var result = [];
    for (var si = 0; si < sources.length; si++) {
      var s = sources[si];
      var mId = s.metier || metierDuPack(s.titre);
      if (mId === metierId && s.qs.length > 0) {
        result.push(s);
      }
    }
    return result;
  }

  /* ── HTML helpers ── */
  function carte(contenu, action, border) {
    return '<div onclick="' + action + '" style="background:#fff;border-radius:14px;padding:18px;cursor:pointer;border:2px solid ' + (border || '#e5e1d8') + ';transition:box-shadow .15s;" onmouseover="this.style.boxShadow=\'0 4px 18px rgba(0,43,92,.13)\'" onmouseout="this.style.boxShadow=\'none\'">' + contenu + '</div>';
  }

  function shell(inner) {
    return '<div style="max-width:640px;margin:0 auto;padding:20px 16px;">' + inner + '</div>';
  }

  /* ── Vue liste des métiers ── */
  function vueMetiers() {
    var items = METIERS.map(function (m) {
      var packs = packsDuMetier(m.id);
      var nQ = packs.reduce(function (s, p) { return s + p.qs.length; }, 0);
      if (nQ === 0) return ''; // masquer métier sans questions
      return carte(
        '<div style="display:flex;align-items:center;gap:14px;">'
        + '<div style="font-size:32px;line-height:1;">' + m.emo + '</div>'
        + '<div style="flex:1;">'
        + '<div style="font-weight:700;color:' + NAVY + ';font-size:15px;">' + m.nom + '</div>'
        + '<div style="color:#7a7468;font-size:12px;margin-top:2px;">' + nQ + ' question' + (nQ > 1 ? 's' : '') + '</div>'
        + '</div>'
        + '<div style="background:' + GOLD + ';color:#fff;padding:6px 14px;border-radius:20px;font-weight:700;font-size:13px;">Voir ›</div>'
        + '</div>',
        'CFG_METIERS._open(\'' + m.id + '\')',
        GOLD
      );
    }).join('');

    return shell(
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">'
      + '<div style="font-family:\'Playfair Display\',serif;font-size:22px;color:' + NAVY + ';font-weight:700;">🧭 Par métier</div>'
      + '<button onclick="CFG_METIERS.fermer()" style="border:none;background:rgba(0,43,92,.08);color:' + NAVY + ';font-weight:700;cursor:pointer;border-radius:8px;padding:8px 14px;font-size:14px;">✕ Fermer</button>'
      + '</div>'
      + '<div style="display:grid;gap:12px;">' + (items || '<div style="text-align:center;color:#7a7468;padding:30px;">Aucun pack disponible.</div>') + '</div>'
    );
  }

  /* ── Vue packs d'un métier ── */
  function vuePacks(metierId) {
    var m = METIERS.filter(function (x) { return x.id === metierId; })[0] || { nom: 'Tous les packs', emo: '📂' };
    _cur = packsDuMetier(metierId);
    var items = _cur.length
      ? _cur.map(function (p, i) {
          return carte(
            '<div style="display:flex;align-items:center;gap:14px;">'
            + '<div style="flex:1;">'
            + '<div style="font-weight:700;color:' + INK + ';font-size:15px;">' + p.titre + '</div>'
            + '<div style="color:#7a7468;font-size:12px;margin-top:2px;">' + p.qs.length + ' question' + (p.qs.length > 1 ? 's' : '') + '</div>'
            + '</div>'
            + '<div style="background:' + GOLD + ';color:#fff;padding:7px 16px;border-radius:20px;font-weight:700;font-size:13px;">Jouer ▸</div>'
            + '</div>',
            'CFG_METIERS._play(' + i + ')',
            GOLD
          );
        }).join('')
      : '<div style="text-align:center;color:#7a7468;padding:30px;">Aucun pack pour ce métier.</div>';

    return shell(
      '<button onclick="CFG_METIERS.afficher()" style="border:none;background:transparent;color:' + NAVY + ';font-weight:700;cursor:pointer;margin-bottom:14px;font-size:14px;">‹ Retour aux métiers</button>'
      + '<div style="font-family:\'Playfair Display\',serif;font-size:19px;color:' + NAVY + ';margin-bottom:14px;">' + m.emo + ' ' + m.nom + '</div>'
      + '<div style="display:grid;gap:12px;">' + items + '</div>'
    );
  }

  /* ── Overlay plein écran ── */
  function paint(html) {
    if (!_ov) {
      _ov = document.createElement('div');
      _ov.id = 'cfg-metiers-ov';
      _ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:' + CREAM + ';overflow-y:auto;font-family:\'IBM Plex Sans\',sans-serif;';
      document.body.appendChild(_ov);
    }
    _ov.innerHTML = html;
    _ov.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function afficher() { paint(vueMetiers()); }
  function _open(id)  { paint(vuePacks(id)); }
  function _play(i) {
    if (!_cur[i]) return;
    fermer();
    // startQ est la fonction globale de index.html
    if (typeof startQ === 'function') {
      startQ(_cur[i].qs, _cur[i].titre);
    }
  }
  function fermer() {
    if (_ov) _ov.style.display = 'none';
    document.body.style.overflow = '';
  }

  return { afficher: afficher, fermer: fermer, _open: _open, _play: _play, METIERS: METIERS };
})();
