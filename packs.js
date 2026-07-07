'use strict';
/* ================================================================
   REGUL ARENA — Source de vérité serveur pour les questions
   ================================================================
   Extrait les constantes de questions depuis public/index.html au
   démarrage. Le contenu pédagogique reste dans le HTML (mode solo),
   et le serveur valide les duels sur exactement les mêmes données.
================================================================ */
// MODIFIÉ — source unique serveur : les banques viennent de banks.js (plus de scraping de index.html).
// Corrige aussi le bug d'extraction QN (auparavant QN=0 côté serveur).
const banks = require('./banks');

const PACK_MAP = {
  'rfe-uemoa': ['QR'],
  'bale-umoa': ['QB'],
  'umoa-bale': ['QB'],
  'cemac':     ['QC'],
  'mix':       ['QR', 'QB', 'QC'],
  'general':   ['QR', 'QB', 'QC'],
  'nouveaux-textes': ['QN'],
};

let DATA = { QR: [], QB: [], QC: [], QN: [] };

function loadPacks() {
  DATA = { QR: banks.QR||[], QB: banks.QB||[], QC: banks.QC||[], QN: banks.QN||[] };
  console.log(`[packs] chargé (banks.js) : QR=${DATA.QR.length} QB=${DATA.QB.length} QC=${DATA.QC.length} QN=${DATA.QN.length}`);
}

// MODIFIÉ — copie exacte de ARENA_THEMES (public/index.html) : permet au serveur de reconnaître
// les mêmes "thm:xxx" que le mode solo, pour que duels/tournois tirent le bon pool de questions.
const ARENA_THEMES = {
  lbcft:        { rx:/LBC|blanchiment|\bFT\b|\bPPE\b|TBML|soup[çc]on|vigilance|CENTIF|ANIF|GABAC|GIABA|\bKYC\b|b[ée]n[ée]ficiaire effectif|tipping/i },
  ifrs9:        { rx:/IFRS\s*9|\bECL\b|pertes attendues|stage\s*[123]|\bSICR\b|d[ée]pr[ée]ciation|day-1|lifetime/i },
  gouvernance:  { rx:/gouvernance|administrateur|comit[ée] d.audit|comit[ée] des risques|contr[ôo]le interne|conformit[ée]|audit interne|ind[ée]pendant/i },
  eme:          { rx:/monnaie [ée]lectronique|\bEME\b|cantonnement|mobile money|porteur|[ée]metteur de monnaie/i },
  grandsrisques:{ rx:/grand risque|division des risques|grand standing|concentration|m[êe]me b[ée]n[ée]ficiaire|quotit[ée]/i },
  prudentiel:   { rx:/B[âa]le|CET1|fonds propres|solvabilit[ée]|coussin|ratio de levier|\bpilier|\bAPR\b|pond[ée]r|capital social/i },
  creances:     { rx:/cr[ée]ance|souffrance|douteux|impay[ée]|contagion|provision/i },
  rfe:          { rx:/\bRFE\b|relations financi[èe]res|domiciliation|rapatriement|r[ée]trocession|contr[ôo]le des changes|interm[ée]diaire agr[éé]|comptes? en devises/i },
  externalisation:{ rx:/externalisation|\bcloud\b|sous-traitance|r[ée]versibilit[ée]|prestataire/i },
  protection:   { rx:/consommateur|r[ée]clamation|m[ée]diation|\bTEG\b|usure|tarifaire|services? gratuits|OQSF/i }
};

function shuffle(a) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

// MODIFIÉ — résout UN id vers une liste de questions (couvre packs généraux + qn + inter + cat: + thm:)
function _resolveIdToQuestions(id) {
  if (PACK_MAP[id]) {
    let pool = [];
    PACK_MAP[id].forEach(k => { pool = pool.concat(DATA[k] || []); });
    return pool;
  }
  if (id === 'qn')    return DATA.QN || [];
  if (id === 'inter') return [].concat(DATA.QR, DATA.QB, DATA.QC, DATA.QN);
  const all = [].concat(DATA.QR, DATA.QB, DATA.QC, DATA.QN);
  if (id.indexOf('cat:') === 0) {
    const c = id.slice(4);
    return all.filter(q => q.cat === c);
  }
  if (id.indexOf('thm:') === 0) {
    const t = ARENA_THEMES[id.slice(4)];
    if (!t) return [];
    return all.filter(q => t.rx.test((q.cat || '') + ' ' + (q.q || q.question || '') + ' ' + (q.source || q.reference || '')));
  }
  return null; // id inconnu
}

function pickQuestions(packId, n = 10) {
  // MODIFIÉ — support multi-thèmes : packId peut être "rfe-uemoa,thm:lbcft,cat:Titre V"
  const ids = String(packId || 'general').split(',').map(s => s.trim()).filter(Boolean);
  let pool = [], matchedAny = false;
  ids.forEach(id => {
    const p = _resolveIdToQuestions(id);
    if (p && p.length) { matchedAny = true; pool = pool.concat(p); }
  });
  if (!matchedAny) { // MODIFIÉ — comportement identique à avant si aucun id reconnu
    (PACK_MAP['general'] || []).forEach(k => { pool = pool.concat(DATA[k] || []); });
  } else {
    pool = [...new Set(pool)]; // MODIFIÉ — dédoublonnage par référence (ex: rfe-uemoa + mix partagent QR)
  }
  if (pool.length === 0) return [];
  return shuffle(pool).slice(0, n).map(x => ({
    // MODIFIÉ — champs tolérants (q/question, choices/options, answer/correct)
    q:       x.q ?? x.question ?? '',
    choices: x.choices ?? x.options ?? [],
    correct: x.answer ?? x.correct ?? 0,
    source:  x.source || x.reference || 'BCEAO/CIMA 2026',
  }));
}

loadPacks();

function getData() { return DATA; } // MODIFIÉ — pour la route /packs/bootstrap

module.exports = { pickQuestions, loadPacks, getData };
