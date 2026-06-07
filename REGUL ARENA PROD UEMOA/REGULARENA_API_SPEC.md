# 📡 REGULARENA PRO UEMOA - API REST Specification

## 🔐 Authentification

Tous les endpoints sauf `/auth/*` et `/public/*` nécessitent un **JWT Bearer Token**.

### Header requis :
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Récupération du token

```http
POST /api/v1/auth/login HTTP/1.1
Host: api.regularena-pro.com
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Réponse (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cuid_12345",
    "email": "user@example.com",
    "fullName": "Jean Dupont",
    "institution": "Banque Centrale UEMOA",
    "countryCode": "SN",
    "level": 12,
    "totalXp": 34200
  },
  "expiresIn": "15m"
}
```

---

## 📋 Endpoints - Vue d'ensemble

| Groupe | Endpoints |
|--------|-----------|
| **Authentification** | POST /auth/login, /auth/register, /auth/refresh |
| **Utilisateurs** | GET /users/profile, PATCH /users/profile, GET /users/:id |
| **Quiz** | GET /quiz/available, POST /quiz/:id/start, POST /quiz/:id/submit, GET /quiz/:id/results |
| **Leaderboard** | GET /leaderboard, GET /leaderboard/country/:code, GET /leaderboard/stats |
| **Arena** | POST /arena/matchmake, GET /arena/match/:matchId, POST /arena/match/:matchId/answer |
| **Achievements** | GET /achievements, GET /achievements/:type |
| **Articles** | GET /articles, GET /articles/:id, GET /articles/category/:category |

---

## 🔓 Authentification

### 1. Inscription

```http
POST /api/v1/auth/register HTTP/1.1
Host: api.regularena-pro.com
Content-Type: application/json

{
  "email": "user@bank.com",
  "password": "SecurePass123!",
  "passwordConfirm": "SecurePass123!",
  "fullName": "Marie Sow",
  "institution": "Banque de développement",
  "countryCode": "SN"
}
```

**Réponse (201 Created):**
```json
{
  "id": "cuid_98765",
  "email": "user@bank.com",
  "fullName": "Marie Sow",
  "institution": "Banque de développement",
  "countryCode": "SN",
  "userType": "PROFESSIONNEL",
  "level": 1,
  "totalXp": 0,
  "createdAt": "2026-06-01T10:30:00Z"
}
```

**Erreurs possibles:**
- `400` : Email déjà utilisé, mot de passe faible
- `422` : Données invalides

---

### 2. Connexion

```http
POST /api/v1/auth/login HTTP/1.1
Host: api.regularena-pro.com
Content-Type: application/json

{
  "email": "user@bank.com",
  "password": "SecurePass123!"
}
```

**Réponse (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { /* ... */ },
  "expiresIn": "15m"
}
```

---

### 3. Rafraîchir le token

```http
POST /api/v1/auth/refresh HTTP/1.1
Host: api.regularena-pro.com
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Réponse (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "15m"
}
```

---

### 4. Déconnexion

```http
POST /api/v1/auth/logout HTTP/1.1
Host: api.regularena-pro.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Réponse (200 OK):**
```json
{
  "message": "Déconnexion réussie"
}
```

---

## 👤 Gestion des Utilisateurs

### 1. Obtenir le profil actuel

```http
GET /api/v1/users/profile HTTP/1.1
Host: api.regularena-pro.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Réponse (200 OK):**
```json
{
  "id": "cuid_98765",
  "email": "user@bank.com",
  "fullName": "Marie Sow",
  "institution": "Banque de développement",
  "countryCode": "SN",
  "level": 12,
  "totalXp": 45320,
  "skillRating": 1250,
  "stats": {
    "quizzesCompleted": 142,
    "arenaMatchesWon": 28,
    "arenaMatchesLost": 15,
    "currentStreak": 7,
    "longestStreak": 23
  },
  "badges": [
    { "type": "EXPERT_REGULATION", "unlockedAt": "2026-05-15T08:00:00Z" },
    { "type": "ARENA_CHAMPION", "unlockedAt": "2026-05-20T14:30:00Z" }
  ],
  "createdAt": "2026-01-10T09:00:00Z",
  "updatedAt": "2026-06-01T10:30:00Z"
}
```

---

### 2. Mettre à jour le profil

```http
PATCH /api/v1/users/profile HTTP/1.1
Host: api.regularena-pro.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "fullName": "Marie Sow Updated",
  "institution": "BCEAO",
  "countryCode": "SN"
}
```

**Réponse (200 OK):**
```json
{
  "id": "cuid_98765",
  "fullName": "Marie Sow Updated",
  "institution": "BCEAO",
  "countryCode": "SN",
  "updatedAt": "2026-06-01T11:00:00Z"
}
```

---

### 3. Obtenir le profil d'un autre utilisateur

```http
GET /api/v1/users/u7k9x2m1 HTTP/1.1
Host: api.regularena-pro.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Réponse (200 OK):**
```json
{
  "id": "u7k9x2m1",
  "fullName": "Jean Koné",
  "institution": "Banque Centrale Mali",
  "countryCode": "ML",
  "level": 15,
  "totalXp": 67850,
  "stats": {
    "quizzesCompleted": 186,
    "arenaMatchesWon": 42,
    "currentStreak": 12
  },
  "badges": [ /* ... */ ]
}
```

**Note :** Les données sensibles (email, adresse) ne sont pas affichées pour les autres utilisateurs.

---

## 📚 Quiz & Formation

### 1. Lister tous les quiz disponibles

```http
GET /api/v1/quiz/available?category=prudentiel&difficulty=intermediate&skip=0&take=10 HTTP/1.1
Host: api.regularena-pro.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `category` : prudentiel, penal, echanges, residents (optionnel)
- `difficulty` : beginner, intermediate, advanced (optionnel)
- `skip` : Pagination (défaut: 0)
- `take` : Nombre d'items (défaut: 10, max: 50)

**Réponse (200 OK):**
```json
{
  "data": [
    {
      "id": "quiz_001",
      "title": "Dispositif Prudentiel - Niveau 2",
      "category": "prudentiel",
      "description": "Quiz intermédiaire sur les règles prudentielles BCEAO",
      "difficulty": "INTERMEDIATE",
      "totalQuestions": 20,
      "timeLimitMinutes": 15,
      "bceaoReference": "DP-2023-001",
      "userProgress": {
        "completed": true,
        "bestScore": 18,
        "lastAttempt": "2026-05-28T14:00:00Z",
        "attempts": 3
      }
    },
    { /* ... */ }
  ],
  "pagination": {
    "total": 340,
    "skip": 0,
    "take": 10,
    "hasMore": true
  }
}
```

---

### 2. Obtenir les détails d'un quiz

```http
GET /api/v1/quiz/quiz_001 HTTP/1.1
Host: api.regularena-pro.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Réponse (200 OK):**
```json
{
  "id": "quiz_001",
  "title": "Dispositif Prudentiel - Niveau 2",
  "category": "prudentiel",
  "description": "Quiz intermédiaire sur les règles prudentielles BCEAO",
  "difficulty": "INTERMEDIATE",
  "totalQuestions": 20,
  "timeLimitMinutes": 15,
  "bceaoReference": "DP-2023-001",
  "questions": [
    {
      "id": "q001",
      "questionText": "Quels sont les trois piliers du dispositif prudentiel ?",
      "questionType": "MULTIPLE_CHOICE",
      "answers": [
        {
          "id": "a001",
          "answerText": "Exigences de capital, liquidité et gouvernance",
          "position": 1
        },
        {
          "id": "a002",
          "answerText": "Inflation, croissance et emploi",
          "position": 2
        },
        {
          "id": "a003",
          "answerText": "Taux de change, balance commerciale et inflation",
          "position": 3
        }
      ]
    },
    { /* ... */ }
  ]
}
```

---

### 3. Démarrer un quiz

```http
POST /api/v1/quiz/quiz_001/start HTTP/1.1
Host: api.regularena-pro.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "mode": "practice"
}
```

**Body:**
- `mode` : "practice" (sans notation) ou "exam" (avec notation)

**Réponse (201 Created):**
```json
{
  "sessionId": "sess_abc123",
  "quizId": "quiz_001",
  "startedAt": "2026-06-01T10:00:00Z",
  "endsAt": "2026-06-01T10:15:00Z",
  "totalQuestions": 20,
  "mode": "practice"
}
```

---

### 4. Soumettre les réponses d'un quiz

```http
POST /api/v1/quiz/quiz_001/submit HTTP/1.1
Host: api.regularena-pro.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "sessionId": "sess_abc123",
  "answers": [
    {
      "questionId": "q001",
      "selectedAnswerId": "a001"
    },
    {
      "questionId": "q002",
      "selectedAnswerId": "a004"
    },
    { /* ... */ }
  ]
}
```

**Réponse (200 OK):**
```json
{
  "sessionId": "sess_abc123",
  "score": 18,
  "totalQuestions": 20,
  "percentage": 90,
  "xpEarned": 450,
  "durationSeconds": 720,
  "results": [
    {
      "questionId": "q001",
      "isCorrect": true,
      "selectedAnswer": "a001",
      "correctAnswer": "a001",
      "explanation": "Les trois piliers du dispositif prudentiel BCEAO sont effectivement..."
    },
    {
      "questionId": "q002",
      "isCorrect": false,
      "selectedAnswer": "a004",
      "correctAnswer": "a003",
      "explanation": "La définition correcte de la liquidité est..."
    },
    { /* ... */ }
  ],
  "newLevel": 12,
  "newTotalXp": 45770,
  "badges": [
    {
      "type": "STREAK_7",
      "title": "Série de 7 jours",
      "message": "Vous avez réussi 7 quiz en 7 jours !"
    }
  ]
}
```

---

### 5. Récupérer les résultats d'un quiz

```http
GET /api/v1/quiz/quiz_001/results?userId=cuid_98765 HTTP/1.1
Host: api.regularena-pro.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `userId` : ID de l'utilisateur (optionnel, défaut: utilisateur actuel)
- `limit` : Nombre d'essais à retourner (défaut: 10)

**Réponse (200 OK):**
```json
{
  "quizId": "quiz_001",
  "quizTitle": "Dispositif Prudentiel - Niveau 2",
  "userResults": [
    {
      "id": "res_001",
      "score": 18,
      "totalQuestions": 20,
      "percentage": 90,
      "xpEarned": 450,
      "durationSeconds": 720,
      "completedAt": "2026-06-01T10:00:00Z"
    },
    {
      "id": "res_002",
      "score": 16,
      "totalQuestions": 20,
      "percentage": 80,
      "xpEarned": 350,
      "durationSeconds": 900,
      "completedAt": "2026-05-28T14:00:00Z"
    }
  ],
  "stats": {
    "totalAttempts": 2,
    "averageScore": 17,
    "bestScore": 18,
    "averagePercentage": 85,
    "totalXpEarned": 800
  }
}
```

---

## 🏆 Leaderboard

### 1. Classement global

```http
GET /api/v1/leaderboard?period=all_time&limit=50&skip=0 HTTP/1.1
Host: api.regularena-pro.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `period` : "weekly", "monthly", "all_time" (défaut: all_time)
- `limit` : 1-100 (défaut: 50)
- `skip` : Pagination (défaut: 0)

**Réponse (200 OK):**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "u7k9x2m1",
      "fullName": "Koné Mamadou",
      "countryCode": "ML",
      "institution": "Banque Centrale Mali",
      "totalXp": 102450,
      "level": 18,
      "skillRating": 1850,
      "badgeCount": 24,
      "arenaWins": 52,
      "change": 0
    },
    {
      "rank": 2,
      "userId": "u4m8k1p2",
      "fullName": "Diallo Fatoumata",
      "countryCode": "SN",
      "institution": "BCEAO",
      "totalXp": 98720,
      "level": 17,
      "skillRating": 1820,
      "badgeCount": 22,
      "arenaWins": 48,
      "change": -1
    },
    { /* ... */ }
  ],
  "userRank": {
    "rank": 342,
    "totalUsers": 12450,
    "percentile": 97.3
  },
  "pagination": {
    "total": 12450,
    "skip": 0,
    "limit": 50,
    "hasMore": true
  }
}
```

---

### 2. Leaderboard par pays

```http
GET /api/v1/leaderboard/country/SN?limit=50 HTTP/1.1
Host: api.regularena-pro.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Réponse (200 OK):**
```json
{
  "country": "SN",
  "countryName": "Sénégal",
  "totalUsers": 2150,
  "leaderboard": [
    {
      "rank": 1,
      "fullName": "Diallo Fatoumata",
      "totalXp": 98720,
      "level": 17,
      "arenaWins": 48
    },
    { /* ... */ }
  ]
}
```

---

### 3. Statistiques du leaderboard

```http
GET /api/v1/leaderboard/stats HTTP/1.1
Host: api.regularena-pro.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Réponse (200 OK):**
```json
{
  "totalUsers": 12450,
  "activeToday": 2340,
  "activeThisWeek": 8920,
  "topCountries": [
    { "countryCode": "SN", "countryName": "Sénégal", "users": 2150 },
    { "countryCode": "CI", "countryName": "Côte d'Ivoire", "users": 1890 },
    { "countryCode": "ML", "countryName": "Mali", "users": 1720 },
    { "countryCode": "BF", "countryName": "Burkina Faso", "users": 1450 }
  ],
  "topInstitutions": [
    { "name": "BCEAO", "users": 4200 },
    { "name": "Banque Centrale Mali", "users": 1850 },
    { "name": "Banque Centrale Sénégal", "users": 1620 }
  ],
  "averageLevel": 8.5,
  "medianXp": 22340
}
```

---

## ⚡ Arena - Matchmaking & Duels

### 1. Chercher un adversaire

```http
POST /api/v1/arena/matchmake HTTP/1.1
Host: api.regularena-pro.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "gameType": "quick",
  "preferredCountry": "SN"
}
```

**Body:**
- `gameType` : "quick" (2 min), "ranked" (5 min), "tournament" (10 min)
- `preferredCountry` : Code du pays (optionnel)

**Réponse (202 Accepted) - En attente:**
```json
{
  "matchmakeSessionId": "mm_session_xyz",
  "gameType": "quick",
  "status": "WAITING",
  "waitingTime": 15,
  "message": "Recherche d'un adversaire..."
}
```

---

### 2. Recevoir un événement WebSocket quand un match est trouvé

```javascript
// Client WebSocket
socket.on('arena:match_found', (data) => {
  console.log({
    matchId: "match_abc123",
    opponent: {
      id: "u7k9x2m1",
      fullName: "Jean Koné",
      level: 15,
      skillRating: 1250
    },
    startAt: "2026-06-01T10:30:00Z"
  });
});
```

---

### 3. Obtenir les détails d'un match en cours

```http
GET /api/v1/arena/match/match_abc123 HTTP/1.1
Host: api.regularena-pro.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Réponse (200 OK):**
```json
{
  "id": "match_abc123",
  "gameType": "quick",
  "status": "IN_PROGRESS",
  "player1": {
    "id": "cuid_98765",
    "fullName": "Marie Sow",
    "level": 12,
    "score": 8,
    "isReady": true
  },
  "player2": {
    "id": "u7k9x2m1",
    "fullName": "Jean Koné",
    "level": 15,
    "score": 6,
    "isReady": true
  },
  "questions": [
    {
      "id": "q001",
      "questionText": "Quel est le rôle principal de la BCEAO ?",
      "questionType": "MULTIPLE_CHOICE",
      "answers": [ /* ... */ ],
      "currentQuestion": 1,
      "totalQuestions": 10
    }
  ],
  "startedAt": "2026-06-01T10:30:00Z",
  "endsAt": "2026-06-01T10:32:00Z"
}
```

---

### 4. Soumettre une réponse dans l'Arène

```javascript
// Via WebSocket pour le temps réel
socket.emit('arena:answer', {
  matchId: 'match_abc123',
  questionId: 'q001',
  selectedAnswerId: 'a001'
});

// Événement reçu après la réponse
socket.on('arena:answer_result', {
  isCorrect: true,
  points: 10,
  opponent_status: "thinking",
  next_question: { /* ... */ }
});
```

---

### 5. Terminer un match et récupérer les résultats

```http
GET /api/v1/arena/match/match_abc123/results HTTP/1.1
Host: api.regularena-pro.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Réponse (200 OK):**
```json
{
  "id": "match_abc123",
  "gameType": "quick",
  "status": "COMPLETED",
  "player1": {
    "id": "cuid_98765",
    "fullName": "Marie Sow",
    "finalScore": 9,
    "correctAnswers": 9,
    "xpEarned": 200,
    "ratingChange": 25
  },
  "player2": {
    "id": "u7k9x2m1",
    "fullName": "Jean Koné",
    "finalScore": 7,
    "correctAnswers": 7,
    "xpEarned": 150,
    "ratingChange": -25
  },
  "winner": "cuid_98765",
  "completedAt": "2026-06-01T10:32:00Z"
}
```

---

## 🏅 Achievements & Badges

### 1. Lister tous les achievements d'un utilisateur

```http
GET /api/v1/achievements?userId=cuid_98765&status=unlocked HTTP/1.1
Host: api.regularena-pro.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `userId` : ID de l'utilisateur (optionnel, défaut: utilisateur actuel)
- `status` : "unlocked", "locked", "all" (défaut: all)

**Réponse (200 OK):**
```json
{
  "achievements": [
    {
      "id": "ach_001",
      "achievementType": "EXPERT_REGULATION",
      "title": "Expert Réglementaire",
      "description": "Atteindre le niveau 10",
      "badgeIcon": "🎓",
      "pointsEarned": 1000,
      "unlockedAt": "2026-05-15T08:00:00Z",
      "progress": 100
    },
    {
      "id": "ach_002",
      "achievementType": "ARENA_CHAMPION",
      "title": "Champion de l'Arène",
      "description": "Remporter 10 duels rapides",
      "badgeIcon": "👑",
      "pointsEarned": 500,
      "unlockedAt": "2026-05-20T14:30:00Z",
      "progress": 100
    },
    {
      "id": "ach_003",
      "achievementType": "QUIZ_MASTER",
      "title": "Maître des Quiz",
      "description": "Compléter 100 quiz",
      "badgeIcon": "📚",
      "pointsEarned": 1500,
      "unlockedAt": null,
      "progress": 67  // 67/100 quiz complétés
    }
  ],
  "stats": {
    "totalUnlocked": 12,
    "totalPoints": 8500,
    "nextAchievement": "QUIZ_MASTER (67% - 33 quiz restants)"
  }
}
```

---

### 2. Obtenir les détails d'un achievement spécifique

```http
GET /api/v1/achievements/ARENA_CHAMPION HTTP/1.1
Host: api.regularena-pro.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Réponse (200 OK):**
```json
{
  "achievementType": "ARENA_CHAMPION",
  "title": "Champion de l'Arène",
  "description": "Remporter 10 duels rapides",
  "badgeIcon": "👑",
  "pointsEarned": 500,
  "criteria": [
    {
      "stat": "Quick arena wins",
      "required": 10,
      "userProgress": 10,
      "completed": true
    }
  ],
  "rarity": "rare",
  "userUnlockedAt": "2026-05-20T14:30:00Z",
  "globalUnlockCount": 423
}
```

---

## 📰 Articles BCEAO

### 1. Lister les articles

```http
GET /api/v1/articles?category=prudentiel&sort=latest&limit=20&skip=0 HTTP/1.1
Host: api.regularena-pro.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `category` : prudentiel, penal, echanges, residents, autres (optionnel)
- `sort` : "latest", "oldest", "most_read" (défaut: latest)
- `limit` : 1-50 (défaut: 20)
- `skip` : Pagination (défaut: 0)

**Réponse (200 OK):**
```json
{
  "articles": [
    {
      "id": "art_001",
      "title": "Directive sur les exigences de capital 2026",
      "summary": "Nouvelles exigences prudentielles pour les établissements de crédit...",
      "category": "prudentiel",
      "source": "BCEAO",
      "externalUrl": "https://bceao.int/...",
      "publishedAt": "2026-05-28T10:00:00Z",
      "readingTimeMinutes": 8,
      "views": 2340
    },
    { /* ... */ }
  ],
  "pagination": {
    "total": 524,
    "skip": 0,
    "limit": 20,
    "hasMore": true
  }
}
```

---

### 2. Obtenir un article complet

```http
GET /api/v1/articles/art_001 HTTP/1.1
Host: api.regularena-pro.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Réponse (200 OK):**
```json
{
  "id": "art_001",
  "title": "Directive sur les exigences de capital 2026",
  "content": "# Directive BCEAO/2026/01\n\nArtisaning 1 : Champ d'application...",
  "contentHtml": "<h1>Directive BCEAO/2026/01</h1>\n<p>Article 1 : Champ d'application...</p>",
  "category": "prudentiel",
  "source": "BCEAO",
  "externalUrl": "https://bceao.int/...",
  "publishedAt": "2026-05-28T10:00:00Z",
  "updatedAt": "2026-05-29T14:00:00Z",
  "readingTimeMinutes": 8,
  "relatedQuizzes": ["quiz_001", "quiz_003"],
  "views": 2450
}
```

---

## ❌ Gestion des Erreurs

### Codes d'erreur standard

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Données invalides |
| 401 | Unauthorized | Token manquant ou invalide |
| 403 | Forbidden | Accès refusé |
| 404 | Not Found | Ressource introuvable |
| 422 | Unprocessable Entity | Validation échouée |
| 429 | Too Many Requests | Rate limit atteint |
| 500 | Internal Server Error | Erreur serveur |

### Format d'erreur standard

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "La validation des données a échoué",
    "details": [
      {
        "field": "email",
        "message": "Email invalide"
      },
      {
        "field": "password",
        "message": "Le mot de passe doit contenir au moins 8 caractères"
      }
    ]
  },
  "timestamp": "2026-06-01T10:30:00Z"
}
```

---

## 🔄 Pagination

Tous les endpoints retournant une liste supportent la pagination :

```http
GET /api/v1/quiz/available?skip=20&take=10 HTTP/1.1
```

**Réponse :**
```json
{
  "data": [ /* ... */ ],
  "pagination": {
    "total": 340,
    "skip": 20,
    "take": 10,
    "hasMore": true
  }
}
```

---

## 🔐 Rate Limiting

Les limites suivantes s'appliquent :

| Endpoint | Limite | Période |
|----------|--------|---------|
| `/auth/login` | 5 requêtes | 15 minutes |
| `/auth/register` | 3 requêtes | 1 heure |
| `/quiz/*/submit` | 100 requêtes | 1 heure |
| Autres endpoints | 1000 requêtes | 1 heure |

**Header de réponse:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1654000000
```

---

## 📚 Collections Postman

Importer les collections suivantes dans Postman :

```
https://api.regularena-pro.com/postman/collections/v1
```

Ou créer manuellement :

1. **Environment Variables :**
   - `base_url` : https://api.regularena-pro.com
   - `access_token` : (sera set après login)
   - `user_id` : (sera set après login)

2. **Collection Auth :**
   - POST /auth/login
   - POST /auth/register
   - POST /auth/refresh

3. **Collection Quiz :**
   - GET /quiz/available
   - POST /quiz/{{quizId}}/start
   - POST /quiz/{{quizId}}/submit

Et ainsi de suite...

---

**Dernière mise à jour** : Juin 2026  
**Version API** : v1  
**Status** : 🟢 Production-ready
