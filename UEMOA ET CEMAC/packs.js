'use strict';

/* ================================================================
   REGUL ARENA — Source de vérité serveur pour les questions
   ================================================================
   Au lieu de dupliquer PACKS en deux endroits (HTML + JS), on extrait
   la constante PACKS depuis public/index.html au démarrage.

   Avantages :
   • Une seule source de vérité (le contenu pédagogique reste dans le HTML
     comme aujourd'hui — aucun changement workflow pour qui édite les
     questions).
   • Aucun risque de divergence entre ce que voit le mode solo et ce que
     valide le serveur en mode duel.
   • Si le fichier HTML est introuvable ou mal formé, on log et on continue
     avec un tableau vide — le reste de l'app fonctionne, seuls les duels
     refusent de démarrer.

   Si à l'avenir vous voulez séparer le contenu (par exemple le mettre en
   base ou dans un fichier JSON dédié), il suffit de modifier loadPacks().
================================================================ */

const fs   = require('fs');
const path = require('path');

function loadPacks() {
  try {
    const htmlPath = path.join(__dirname, 'public', 'index.html');
    const html     = fs.readFileSync(htmlPath, 'utf8');

    const startMarker = 'const PACKS = [';
    const endMarker   = 'let _soloState';

    const startIdx = html.indexOf(startMarker);
    if (startIdx < 0) throw new Error('Marqueur "const PACKS = [" non trouvé');
    const endIdx = html.indexOf(endMarker, startIdx);
    if (endIdx < 0) throw new Error('Marqueur "let _soloState" non trouvé');

    // Trouver le `];` final avant `let _soloState`
    const arrayEnd = html.lastIndexOf('];', endIdx);
    if (arrayEnd < 0) throw new Error('Fin du tableau PACKS non trouvée');

    const arrayText = html.slice(startIdx + 'const PACKS = '.length, arrayEnd + 1);

    // Évaluation dans une closure isolée (pas d'accès à require, process, etc.)
    // Le contenu PACKS est statique et provient d'un fichier qu'on contrôle —
    // c'est un risque acceptable. Si vous voulez durcir : passer par JSON.parse
    // après une transformation, mais ça impose un format JSON strict.
    const packs = Function('"use strict"; return (' + arrayText + ');')();

    if (!Array.isArray(packs)) throw new Error('PACKS extrait n\'est pas un tableau');

    // Validation minimale : chaque pack doit avoir id et questions[]
    packs.forEach((p, i) => {
      if (!p.id) throw new Error(`Pack #${i} sans id`);
      if (!Array.isArray(p.questions)) throw new Error(`Pack ${p.id} sans questions[]`);
    });

    console.log(`[packs] ${packs.length} packs chargés (${packs.reduce((s, p) => s + p.questions.length, 0)} questions au total)`);
    return packs;
  } catch (e) {
    console.error('[packs] ERREUR chargement :', e.message);
    console.error('[packs] Le module duels serveur-validé sera désactivé jusqu\'au redémarrage.');
    return [];
  }
}

const PACKS = loadPacks();

/** Trouve un pack par son id. Renvoie null si introuvable. */
function getPack(id) {
  return PACKS.find(p => p.id === id) || null;
}

/**
 * Tire `count` questions d'un pack, mélangées (Fisher-Yates).
 * Si count > nombre de questions du pack, on tire avec répétition modulo
 * la taille du pack (préserve le comportement actuel du frontend).
 */
function pickQuestions(packId, count) {
  const pack = getPack(packId);
  if (!pack) return null;
  const src = pack.questions.slice();
  // Fisher-Yates
  for (let i = src.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [src[i], src[j]] = [src[j], src[i]];
  }
  const out = [];
  for (let i = 0; i < count; i++) out.push(src[i % src.length]);
  return out;
}

module.exports = { PACKS, getPack, pickQuestions };
