'use strict';
/* ================================================================
   REGUL ARENA — Source de vérité serveur pour les questions
   ================================================================
   Extrait les constantes de questions depuis public/index.html au
   démarrage. Le contenu pédagogique reste dans le HTML (mode solo),
   et le serveur valide les duels sur exactement les mêmes données.
================================================================ */
const fs   = require('fs');
const path = require('path');

// MODIFIÉ — marqueurs en REGEX : tolère espaces, const/let/var (ex: "const QR = [")
const SOURCES = {
  QR: /(?:const|let|var)\s+QR\s*=\s*\[/,
  QB: /(?:const|let|var)\s+QB\s*=\s*\[/,
  QC: /(?:const|let|var)\s+QC\s*=\s*\[/,
};

const PACK_MAP = {
  'rfe-uemoa': ['QR'],
  'bale-umoa': ['QB'],
  'umoa-bale': ['QB'],          // alias
  'cemac':     ['QC'],
  'mix':       ['QR', 'QB', 'QC'],
  'general':   ['QR', 'QB', 'QC'],
};

let DATA = { QR: [], QB: [], QC: [] };

// MODIFIÉ — extraction quote-aware : gère "  '  et `  (le HTML utilise des quotes simples)
function extractArray(src, re) {
  const m = re.exec(src);
  if (!m) return null;
  const arrStart = src.indexOf('[', m.index);
  if (arrStart === -1) return null;
  let depth = 0, quote = null, esc = false;
  for (let i = arrStart; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '[') depth++;
    else if (ch === ']' && --depth === 0) return src.slice(arrStart, i + 1);
  }
  return null;
}

function loadPacks() {
  let html;
  try {
    html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
  } catch (e) {
    console.error('[packs] index.html illisible :', e.message);
    DATA = { QR: [], QB: [], QC: [] };
    return;
  }
  const out = { QR: [], QB: [], QC: [] };
  for (const key of Object.keys(SOURCES)) {
    try {
      const raw = extractArray(html, SOURCES[key]);
      if (!raw) { console.warn(`[packs] marqueur ${key} introuvable dans index.html`); continue; }
      // MODIFIÉ — new Function au lieu de JSON.parse : accepte quotes simples, clés non quotées, virgules finales
      const arr = new Function('return (' + raw + ');')();
      out[key] = Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.error(`[packs] parse ${key} échoué : ${e.message}`);   // MODIFIÉ — isolation : un pack KO ne tue plus les autres
    }
  }
  DATA = out;
  console.log(`[packs] chargé : QR=${DATA.QR.length} QB=${DATA.QB.length} QC=${DATA.QC.length}`);
}

function shuffle(a) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

function pickQuestions(packId, n = 10) {
  const keys = PACK_MAP[packId] || PACK_MAP['general'];
  let pool = [];
  keys.forEach(k => { pool = pool.concat(DATA[k] || []); });
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

module.exports = { pickQuestions, loadPacks };
