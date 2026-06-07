'use strict';
/* ================================================================
   REGUL ARENA — Source de vérité serveur pour les questions
   ================================================================
   Extrait les constantes de questions depuis public/index.html au
   démarrage. Le contenu pédagogique reste dans le HTML (mode solo),
   et le serveur valide les duels sur exactement les mêmes données.
   Si le HTML est introuvable ou mal formé : log + tableau vide,
   seuls les duels refusent de démarrer.
================================================================ */
const fs   = require('fs');
const path = require('path');

// MODIFIÉ — marqueurs réels du HTML (QR/QB/QC), au lieu de "const PACKS = ["
const SOURCES = { QR: 'const QR=[', QB: 'const QB=[', QC: 'const QC=[' };

// MODIFIÉ — mapping pack_id (envoyé par le frontend) → listes de questions
const PACK_MAP = {
  'rfe-uemoa': ['QR'],
  'bale-umoa': ['QB'],
  'umoa-bale': ['QB'],          // alias
  'cemac':     ['QC'],
  'mix':       ['QR', 'QB', 'QC'],
  'general':   ['QR', 'QB', 'QC'],
};

let DATA = { QR: [], QB: [], QC: [] };

/* Extrait un tableau JSON `marker[ ... ]` en respectant les chaînes. */
function extractArray(src, marker) {
  const start = src.indexOf(marker);
  if (start === -1) return null;
  const arrStart = src.indexOf('[', start);
  if (arrStart === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = arrStart; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '[') depth++;
    else if (ch === ']' && --depth === 0) return src.slice(arrStart, i + 1);
  }
  return null;
}

function loadPacks() {
  try {
    const htmlPath = path.join(__dirname, 'public', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const out = {};
    for (const key of Object.keys(SOURCES)) {
      const raw = extractArray(html, SOURCES[key]);
      out[key] = raw ? JSON.parse(raw) : [];
    }
    DATA = out;
    console.log(`[packs] chargé : QR=${DATA.QR.length} QB=${DATA.QB.length} QC=${DATA.QC.length}`);
  } catch (e) {
    console.error('[packs] ERREUR chargement :', e.message);
    console.error('[packs] Le module duels serveur-validé sera désactivé jusqu\'au redémarrage.');
    DATA = { QR: [], QB: [], QC: [] };
  }
}

function shuffle(a) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

/* Retourne n questions au format serveur { q, choices, correct, source }. */
function pickQuestions(packId, n = 10) {
  const keys = PACK_MAP[packId] || PACK_MAP['general'];
  let pool = [];
  keys.forEach(k => { pool = pool.concat(DATA[k] || []); });
  if (pool.length === 0) return [];
  return shuffle(pool).slice(0, n).map(x => ({
    q:       x.q,
    choices: x.choices,
    correct: x.answer,                       // MODIFIÉ — le HTML utilise `answer`, le serveur attend `correct`
    source:  x.source || x.reference || 'BCEAO/CIMA 2026',
  }));
}

loadPacks();

module.exports = { pickQuestions, loadPacks };
