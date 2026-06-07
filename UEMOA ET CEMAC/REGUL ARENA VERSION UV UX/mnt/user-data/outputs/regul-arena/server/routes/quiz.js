/**
 * REGUL ARENA - Backend routes pour le module Quiz
 *
 * À placer dans : /server/routes/quiz.js (ou équivalent dans ton repo)
 *
 * Intégration dans server.js (ou app.js) :
 *   const quizRoutes = require('./routes/quiz');
 *   app.use('/api/quiz', quizRoutes);
 *
 * Dépendances supposées (déjà dans ton stack) :
 *   - express
 *   - middleware JWT (req.user.id disponible après authMiddleware)
 *   - une connexion DB (ici on suppose Knex/raw SQL ; adapte à Sequelize/Prisma si besoin)
 *
 * ⚠️ SÉCURITÉ : le score est recalculé côté serveur à partir de la banque
 *    de questions, JAMAIS pris tel quel depuis le client. Le client envoie
 *    seulement ses réponses (selectedIndex par questionId).
 */

const express = require('express');
const router = express.Router();

// On require la banque de questions côté serveur aussi (single source of truth)
// Important : ce fichier doit être accessible sur le serveur. Stratégie possible :
//   Option A : dupliquer la banque dans /server/data/quiz-bank.js (objet pur Node.js)
//   Option B : générer la version JS frontend à partir de cette source serveur
// Pour cet exemple on assume Option A.
const QUIZ_BANK = require('../data/quiz-bank');

// ⚠️ Place ton vrai middleware d'authentification ici
const requireAuth = (req, res, next) => {
  // exemple : vérifie JWT, attache req.user = { id, level, xp }
  if (!req.user) return res.status(401).json({ error: 'auth_required' });
  next();
};

// ════════════════════════════════════════════════════════════
//  POST /api/quiz/submit
//   Reçoit les réponses du joueur, recalcule le score, persiste, retourne nouveau profil
// ════════════════════════════════════════════════════════════
router.post('/submit', requireAuth, async (req, res) => {
  try {
    const { answers, category, durationSec } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'invalid_payload', message: 'answers manquant ou vide' });
    }

    // Recalcul serveur-côté de l'XP et du score
    let correctCount = 0;
    let xpEarned = 0;
    const detailedResults = [];

    for (const ans of answers) {
      const q = QUIZ_BANK.find(qq => qq.id === ans.questionId);
      if (!q) {
        // Question inconnue : on l'ignore (potentielle tentative de triche)
        continue;
      }
      const isCorrect = ans.selectedIndex === q.correctIndex;
      let questionXp = 0;
      if (isCorrect) {
        correctCount++;
        questionXp = q.xp;
        // Bonus rapidité serveur-côté
        if (typeof ans.timeSpent === 'number' && ans.timeSpent < 10) {
          questionXp = Math.round(q.xp * 1.25);
        }
        xpEarned += questionXp;
      }
      detailedResults.push({
        questionId: q.id,
        isCorrect,
        xpEarned: questionXp,
        difficulty: q.difficulty
      });
    }

    const total = answers.length;
    const percentage = Math.round((correctCount / total) * 100);

    // Persistance (adapte à ton ORM/driver)
    // Exemple Knex :
    // await db('quiz_attempts').insert({
    //   user_id: req.user.id,
    //   category: category || 'mixte',
    //   total, correct: correctCount, percentage, xp_earned: xpEarned,
    //   duration_sec: durationSec || 0,
    //   created_at: new Date()
    // });

    // Mise à jour XP et niveau utilisateur
    const updatedProfile = await applyXpAndLevel(req.user.id, xpEarned);

    return res.json({
      ok: true,
      result: {
        correct: correctCount,
        total,
        percentage,
        xpEarned,
        detailedResults
      },
      profile: updatedProfile  // { level, xp, xpToNextLevel, unlocks: [...] }
    });

  } catch (err) {
    console.error('[quiz.submit]', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// ════════════════════════════════════════════════════════════
//  GET /api/quiz/categories
//   Liste des catégories disponibles, avec count par niveau de difficulté
// ════════════════════════════════════════════════════════════
router.get('/categories', (req, res) => {
  const cats = {};
  for (const q of QUIZ_BANK) {
    if (!cats[q.category]) cats[q.category] = { name: q.category, total: 0, byDifficulty: {} };
    cats[q.category].total++;
    cats[q.category].byDifficulty[q.difficulty] = (cats[q.category].byDifficulty[q.difficulty] || 0) + 1;
  }
  return res.json({ categories: Object.values(cats) });
});

// ════════════════════════════════════════════════════════════
//  GET /api/quiz/leaderboard?scope=global|country|friends
//   Classement (mock — adapte à ta vraie DB)
// ════════════════════════════════════════════════════════════
router.get('/leaderboard', requireAuth, async (req, res) => {
  const scope = req.query.scope || 'global';
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

  // Exemple Knex (à adapter) :
  // const rows = await db('users')
  //   .select('id', 'pseudo', 'country', 'level', 'xp', 'title')
  //   .orderBy('xp', 'desc')
  //   .limit(limit);

  // Stub pour démo :
  const rows = []; // TODO: brancher sur ta DB
  return res.json({ scope, limit, leaderboard: rows });
});

// ════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════

/**
 * Applique le gain d'XP et calcule le nouveau niveau.
 * Formule de progression : XP pour atteindre niveau N = 500 * N * (N+1) / 2
 *   Niveau 1 -> 2 : 1000 XP
 *   Niveau 2 -> 3 : 1500 XP
 *   Niveau 5 -> 6 : 3000 XP
 * Tu peux ajuster la courbe selon le rythme de progression voulu.
 */
async function applyXpAndLevel(userId, xpEarned) {
  // Récupère le profil actuel (à adapter à ton ORM)
  // const user = await db('users').where({ id: userId }).first();
  // Stub pour démo :
  const user = { id: userId, level: 5, xp: 2450 };  // ← remplace par ton vrai fetch

  const newTotalXp = user.xp + xpEarned;
  const oldLevel = user.level;

  // Recalcul du niveau
  let newLevel = oldLevel;
  while (newTotalXp >= xpRequiredForLevel(newLevel + 1)) {
    newLevel++;
  }

  // Persistance (à adapter)
  // await db('users').where({ id: userId }).update({ xp: newTotalXp, level: newLevel });

  const xpForCurrent = xpRequiredForLevel(newLevel);
  const xpForNext = xpRequiredForLevel(newLevel + 1);
  const xpToNextLevel = xpForNext - newTotalXp;

  // Déblocages liés au level-up
  const unlocks = [];
  if (newLevel > oldLevel) {
    for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
      const u = getUnlocksForLevel(lvl);
      if (u) unlocks.push(...u);
    }
  }

  return {
    level: newLevel,
    xp: newTotalXp,
    xpInCurrentLevel: newTotalXp - xpForCurrent,
    xpForNextLevel: xpForNext - xpForCurrent,
    xpToNextLevel,
    leveledUp: newLevel > oldLevel,
    unlocks
  };
}

function xpRequiredForLevel(level) {
  if (level <= 1) return 0;
  // Triangle d'XP : 500 + 1000 + 1500 + ... = 500 * n * (n-1) / 2 pour atteindre niveau n+1
  return 500 * level * (level - 1) / 2;
}

function getUnlocksForLevel(level) {
  // Définis ici les déblocages par niveau — synchronisés avec ton design system
  const unlockMap = {
    2:  [{ type: 'badge', id: 'first_steps',  label: 'Premiers pas' }],
    3:  [{ type: 'quiz',  id: 'intermediate', label: 'Quiz Intermédiaires débloqués' }],
    5:  [{ type: 'feature', id: 'duel',        label: 'Mode Duel débloqué ⚔️' }],
    7:  [{ type: 'cosmetic', id: 'avatar_pro',  label: 'Avatar "Régulateur Pro"' }],
    10: [{ type: 'feature', id: 'tournament',   label: 'Tournois intra-pays débloqués 🏆' }],
    15: [{ type: 'title',   id: 'le_docteur',   label: 'Titre : Le Docteur 🎓' }],
    20: [{ type: 'feature', id: 'guild',        label: 'Création de guilde débloquée 🛡️' }],
    25: [{ type: 'title',   id: 'regulator_gold', label: 'Titre : Régulateur d\'Or 👑' }]
  };
  return unlockMap[level] || null;
}

module.exports = router;
