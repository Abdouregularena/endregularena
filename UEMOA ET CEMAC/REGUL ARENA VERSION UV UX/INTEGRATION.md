# 🚀 Regul Arena — Guide d'intégration du module Quiz

Ce package contient **3 fichiers prêts à coller dans ton repo `Abdouregularena/endregularena`** + 20 questions BCEAO/UMOA tirées directement du dispositif prudentiel 2016.

---

## 📦 Contenu du package

| Fichier | Destination dans ton repo | Rôle |
|---|---|---|
| `public/js/quiz-data.js` | `public/js/quiz-data.js` | Banque de 20 questions UMOA/BCEAO + helpers |
| `public/js/quiz.js` | `public/js/quiz.js` | Classe `RegulArenaQuiz` (UI + timer + XP + animations) |
| `server/routes/quiz.js` | `server/routes/quiz.js` (ou `routes/quiz.js`) | Endpoints API sécurisés (scoring serveur-côté) |

---

## ⚡ Étape 1 — Coller les fichiers (5 min)

```bash
# Depuis la racine de ton repo local
cp /chemin/vers/quiz-data.js public/js/quiz-data.js
cp /chemin/vers/quiz.js      public/js/quiz.js
cp /chemin/vers/quiz-routes.js server/routes/quiz.js
```

---

## ⚡ Étape 2 — Brancher le frontend dans ton `index.html` (2 min)

Dans le `<head>` ou avant la fermeture du `<body>`, ajoute :

```html
<!-- Charge la banque AVANT le module quiz -->
<script src="js/quiz-data.js"></script>
<script src="js/quiz.js"></script>
```

Crée un container quelque part dans ton HTML (par exemple dans ton écran de quiz) :

```html
<div id="quiz-root"></div>
```

Puis lance le quiz quand l'utilisateur clique sur "Quiz Solo" :

```html
<script>
function startSoloQuiz() {
  // Cache le dashboard, montre le container quiz
  document.getElementById('quiz-root').style.display = 'block';

  const quiz = new RegulArenaQuiz({
    container: document.getElementById('quiz-root'),
    playerLevel: currentUser.level || 1,   // ← depuis ta session
    questionCount: 10,
    timePerQuestion: 20,
    category: null,                         // ← null = mélangé. Ex: 'Fonds propres'
    apiBase: '/api',                        // ← active la sauvegarde serveur
    authToken: getJwtFromCookie(),          // ← ton token JWT existant
    onComplete: (result) => {
      console.log('Quiz terminé', result);
      // Tu peux ici déclencher l'animation "Level Up!" si result.profile.leveledUp
    }
  });
  quiz.start();
}
</script>
```

---

## ⚡ Étape 3 — Brancher le backend (10 min)

### 3.1 — Dupliquer la banque côté serveur (sécurité)

Le serveur a besoin de connaître les bonnes réponses pour **recalculer le score** (jamais faire confiance au client). Crée :

**`server/data/quiz-bank.js`** — copie le contenu de `quiz-data.js` MAIS remplace la fin par :

```js
// Au lieu de : window.QUIZ_BANK = [...]
// Mets :
const QUIZ_BANK = [/* ... même contenu que window.QUIZ_BANK ... */];
module.exports = QUIZ_BANK;
```

> 💡 **Astuce DRY** : pour éviter de maintenir deux copies, tu peux à terme générer `quiz-data.js` à partir du fichier serveur via un script `npm run build:quiz-bank`. Pour l'instant, la duplication suffit.

### 3.2 — Brancher les routes dans `server.js` (ou `app.js`)

```js
const express = require('express');
const app = express();

app.use(express.json());

// Tes routes existantes (auth, etc.)...

// 👇 Ajoute ceci :
const quizRoutes = require('./routes/quiz');
app.use('/api/quiz', quizRoutes);
```

### 3.3 — Adapter à ta DB

Dans `server/routes/quiz.js`, deux endroits à modifier (cherche les `// TODO` et `// Stub`) :

1. **`applyXpAndLevel()`** : remplace le stub `const user = { id: userId, level: 5, xp: 2450 }` par ton vrai fetch DB (Knex, Sequelize, Prisma...).

2. **`GET /leaderboard`** : remplace le tableau vide par ta query DB triée par XP DESC.

3. **`POST /submit` (persistance)** : décommente les lignes `db('quiz_attempts').insert(...)` et adapte-les à ta table de scores.

### 3.4 — Schéma DB suggéré (PostgreSQL)

Si tu n'as pas encore de table pour les attempts :

```sql
CREATE TABLE quiz_attempts (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id),
  category    VARCHAR(50),
  total       INT NOT NULL,
  correct     INT NOT NULL,
  percentage  INT NOT NULL,
  xp_earned   INT NOT NULL DEFAULT 0,
  duration_sec INT,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_attempts_user ON quiz_attempts(user_id, created_at DESC);

-- Sur la table users, assure-toi d'avoir :
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS title VARCHAR(50);
```

---

## 🎯 Endpoints exposés

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/quiz/submit` | ✅ JWT | Soumet les réponses, recalcule, persiste, retourne profil mis à jour |
| GET | `/api/quiz/categories` | ❌ | Liste les catégories disponibles avec stats |
| GET | `/api/quiz/leaderboard?scope=global&limit=50` | ✅ JWT | Classement |

### Exemple de payload `/api/quiz/submit`

**Request (envoyé automatiquement par le module frontend) :**
```json
{
  "answers": [
    { "questionId": "UMOA-FP-001", "selectedIndex": 1, "timeSpent": 8 },
    { "questionId": "UMOA-LIQ-001", "selectedIndex": 1, "timeSpent": 12 }
  ],
  "category": "mixte",
  "durationSec": 145
}
```

**Response :**
```json
{
  "ok": true,
  "result": {
    "correct": 8, "total": 10, "percentage": 80, "xpEarned": 425,
    "detailedResults": [...]
  },
  "profile": {
    "level": 6, "xp": 2875,
    "xpInCurrentLevel": 375, "xpForNextLevel": 3000, "xpToNextLevel": 2625,
    "leveledUp": true,
    "unlocks": [{ "type": "cosmetic", "id": "avatar_pro", "label": "Avatar Pro" }]
  }
}
```

---

## 🔐 Points de sécurité importants

1. **Le score est TOUJOURS recalculé côté serveur.** Le client envoie seulement les réponses, pas le score. Si quelqu'un trafique son `localStorage` ou son JS, ça ne sert à rien.

2. **Les questions inconnues sont ignorées** dans `/submit` — donc impossible d'inventer des `questionId` pour gagner du XP.

3. **Rate-limiting recommandé** : ajoute `express-rate-limit` sur `/api/quiz/submit` (max ~10 quiz/heure par user) pour éviter le farming automatique.

4. **CSRF** : ton JWT en `Authorization: Bearer` est protégé contre CSRF si tu n'utilises pas de cookies pour l'auth.

---

## 📈 Statistiques de la banque livrée

| Catégorie | Questions | XP total |
|---|---|---|
| Fonds propres (CET1, T1, FPE) | 6 | 900 |
| Liquidité (RLCT, RLLT) | 3 | 350 |
| Division des risques | 3 | 450 |
| Définitions & gouvernance | 3 | 350 |
| Piliers Bâle | 3 | 600 |
| Ratio de levier & transition | 2 | 250 |
| APR & pondération | 1 | 300 |
| **TOTAL** | **21** | **3 200** |

Toutes les questions citent leur source exacte dans le dispositif prudentiel UMOA 2016 (paragraphe + titre). Ça donne à ta plateforme une **crédibilité immédiate** auprès des professionnels bancaires UEMOA.

---

## 🛠️ Prochaines étapes recommandées (par priorité)

### Court terme (cette semaine)
1. **Coller les 3 fichiers**, lancer en local, vérifier le quiz tourne (sans backend d'abord, avec `apiBase: null`).
2. **Brancher le backend** + DB, tester un quiz complet bout-en-bout.
3. **Tester sur mobile** (responsive est déjà géré dans le CSS).

### Moyen terme (semaines 2-3)
1. **Enrichir la banque** : passer de 21 à 100+ questions. Tu peux me redemander de générer 20 questions supplémentaires sur des thèmes ciblés (ex: "réglementation des changes", "supervision consolidée", "plan comptable bancaire").
2. **Ajouter les autres modules** du Tier 1 : système de niveaux (UI), shop cosmétique.
3. **Implémenter le module Duel** (Tier 2) avec WebSocket — peut réutiliser la banque + module quiz.

### Long terme (mois 2+)
1. **Reporting réglementaire** : utilise le PDF `INSTRUCTION_N_005082017_RELATIVE_AUX_MODALITES_DE_DECLARATION_DES_ETATS_PRUDENTIELS.pdf` pour créer un module "Simulation de déclaration prudentielle". C'est un différenciateur énorme vs la concurrence.
2. **Mode certificat** : à 100 questions réussies sur une catégorie, génère un PDF de certification "Régulateur certifié BCEAO niveau X". Vendable comme premium.

---

## 💬 Si tu reviens vers moi

Pour optimiser tes crédits messages, le plus rentable est de me demander :
- **+20 questions sur un thème précis** (1 message = 20 questions de qualité)
- **Le module Duel complet** (logique WebSocket + UI dual-screen)
- **Le module Shop/Boutique** (catalogue + UI achats avec or virtuel)
- **Un script de génération de PDF certificat** (bonus monétisation)

Bonne route, et reviens dès que tu as testé l'intégration ! 🚀
