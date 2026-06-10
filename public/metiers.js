'use strict';
/* ================================================================
   REGUL ARENA — metiers.js  (navigation des packs par MÉTIER)
   ----------------------------------------------------------------
   Autonome. Lit le tableau global `packs` (index.html l.963) où
   p[0] = titre, p[3] = tableau de questions. Relance un pack via le
   lanceur solo EXISTANT : startQ(questions, 'Titre'). Aucune régression.

   INTÉGRATION (2 lignes dans index.html) :
     1) avant </body> :   <script src="metiers.js" defer></script>
     2) un bouton menu :  <button onclick="CFG_METIERS.afficher()">Par métier</button>

   RÉGLAGE : ajuste les `kw` ci-dessous. Le match se fait sur le titre
   du pack, en minuscules et sans accents. Un pack peut viser plusieurs
   métiers. Les packs non classés tombent dans "Tronc commun".
================================================================ */
window.CFG_METIERS = (function () {
  const NAVY = '#002B5C', GOLD = '#C9991A', CREAM = '#F5F3EE', INK = '#1d2433';

  const METIERS = [
    { id:'clientele',  nom:'Chargé de clientèle',         emo:'🤝', kw:['client','conseil','epargne','compte','particulier','vente','relation','bancarisation'] },
    { id:'agence',     nom:'Chef d’agence',                emo:'🏛️', kw:['agence','manage','encadr','reseau','animation','commercial'] },
    { id:'trade',      nom:'Trade Finance / Commerce',     emo:'🌍', kw:['trade','documentaire','credoc','remise','import','export','swift','rfe','rapatri','devise','commerce','exterieur'] },
    { id:'conformite', nom:'Conformité / LAB-FT',          emo:'🛡️', kw:['conformite','lab','lbc','blanchiment','kyc','sanction','gafi','vigilance'] },
    { id:'audit',      nom:'Audit / Contrôle / Risques',    emo:'🔍', kw:['audit','controle','risque','fraude','inspection','bale','prudentiel','cobac','commission'] },
    { id:'credit',     nom:'Crédit / Engagements',         emo:'💳', kw:['credit','engagement','garantie','octroi','recouvr','contentieux','pret'] },
    { id:'operations', nom:'Opérations / Back-office',      emo:'⚙️', kw:['caisse','back','operation','monetique','virement','compensation','guichet','pcb','comptable','traitement'] },
    { id:'tresorerie', nom:'Trésorerie / Marchés',         emo:'📈', kw:['tresorerie','marche','change','titre','interbancaire','refinancement','bceao','liquidite','obligation'] },
  ];

  const noAcc = s => (s || '').toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function tousPacks() { return (typeof packs !== 'undefined' && Array.isArray(packs)) ? packs : []; }
  function titre(p)    { return Array.isArray(p) ? (p[0] || 'Pack') : (p.nom || p.titre || p[0] || 'Pack'); }
  function questions(p){ return Array.isArray(p) ? p[3] : (p.questions || p.q || p[3]); }
  function nbQ(p)      { const q = questions(p); return Array.isArray(q) ? q.length : 0; }

  function metiersDuPack(p) {
    const t = noAcc(titre(p));
    const ids = METIERS.filter(m => m.kw.some(k => t.includes(k))).map(m => m.id);
    return ids.length ? ids : ['_tronc'];
  }
  function packsDuMetier(id) {
    if (id === '_tout') return tousPacks();
    return tousPacks().filter(p => metiersDuPack(p).includes(id));
  }

  function lancerPack(p) {
    const q = questions(p);
    if (typeof startQ === 'function' && Array.isArray(q) && q.length) { fermer(); startQ(q, titre(p)); }
    else alert('Pack indisponible : ' + titre(p));
  }

  /* ---------------------------- UI ---------------------------- */
  let _ov = null, _cur = [];

  function shell(inner) {
    return ''
      + '<div style="max-width:920px;margin:0 auto;padding:24px 18px 60px;">'
      +   '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;">'
      +     '<div style="font-family:\'Playfair Display\',serif;font-size:24px;font-weight:800;color:' + NAVY + ';">Choisis ton métier</div>'
      +     '<button onclick="CFG_METIERS.fermer()" style="border:none;background:' + NAVY + ';color:#fff;width:38px;height:38px;border-radius:50%;font-size:18px;cursor:pointer;">×</button>'
      +   '</div>'
      +   inner
      + '</div>';
  }

  function carte(html, onclick, accent) {
    return '<div onclick="' + onclick + '" style="cursor:pointer;background:#fff;border:1px solid #e6e1d6;border-left:5px solid ' + (accent || GOLD) + ';border-radius:14px;padding:16px 18px;transition:.15s;box-shadow:0 1px 3px rgba(0,0,0,.05);" '
      + 'onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 6px 18px rgba(0,43,92,.12)\'" '
      + 'onmouseout="this.style.transform=\'\';this.style.boxShadow=\'0 1px 3px rgba(0,0,0,.05)\'">' + html + '</div>';
  }

  function vueMetiers() {
    const liste = METIERS.concat([{ id:'_tronc', nom:'Tronc commun', emo:'📚', kw:[] }]);
    const cells = liste.map(m => {
      const n = packsDuMetier(m.id).length;
      if (m.id === '_tronc' && n === 0) return '';
      return carte(
        '<div style="display:flex;align-items:center;gap:14px;">'
        + '<div style="font-size:30px;">' + m.emo + '</div>'
        + '<div style="flex:1;">'
        +   '<div style="font-weight:700;color:' + INK + ';font-size:16px;">' + m.nom + '</div>'
        +   '<div style="color:#7a7468;font-size:13px;margin-top:2px;">' + n + ' pack' + (n > 1 ? 's' : '') + '</div>'
        + '</div>'
        + '<div style="color:' + GOLD + ';font-size:20px;">›</div></div>',
        "CFG_METIERS._open('" + m.id + "')", NAVY);
    }).join('');
    const tout = carte(
      '<div style="text-align:center;font-weight:700;color:' + NAVY + ';">📂 Voir tous les packs</div>',
      "CFG_METIERS._open('_tout')", GOLD);
    return shell(
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;">' + cells + '</div>'
      + '<div style="margin-top:18px;">' + tout + '</div>');
  }

  function vuePacks(id) {
    _cur = packsDuMetier(id);
    const m = METIERS.find(x => x.id === id) || { nom: id === '_tout' ? 'Tous les packs' : 'Tronc commun', emo:'📂' };
    const items = _cur.length
      ? _cur.map((p, i) => carte(
          '<div style="display:flex;align-items:center;gap:14px;">'
          + '<div style="flex:1;"><div style="font-weight:700;color:' + INK + ';font-size:16px;">' + titre(p) + '</div>'
          + '<div style="color:#7a7468;font-size:13px;margin-top:2px;">' + nbQ(p) + ' question' + (nbQ(p) > 1 ? 's' : '') + '</div></div>'
          + '<div style="background:' + GOLD + ';color:#fff;padding:7px 16px;border-radius:20px;font-weight:700;font-size:13px;">Jouer ▸</div></div>',
          'CFG_METIERS._play(' + i + ')', GOLD)).join('')
      : '<div style="text-align:center;color:#7a7468;padding:30px;">Aucun pack pour ce métier.</div>';
    return shell(
      '<button onclick="CFG_METIERS.afficher()" style="border:none;background:transparent;color:' + NAVY + ';font-weight:700;cursor:pointer;margin-bottom:14px;font-size:14px;">‹ Retour aux métiers</button>'
      + '<div style="font-family:\'Playfair Display\',serif;font-size:19px;color:' + NAVY + ';margin-bottom:14px;">' + m.emo + ' ' + m.nom + '</div>'
      + '<div style="display:grid;gap:12px;">' + items + '</div>');
  }

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
  function _play(i)   { if (_cur[i]) lancerPack(_cur[i]); }
  function fermer()   { if (_ov) _ov.style.display = 'none'; document.body.style.overflow = ''; }

  return { afficher, fermer, lancerPack, packsDuMetier, metiersDuPack, _open, _play, METIERS };
})();
