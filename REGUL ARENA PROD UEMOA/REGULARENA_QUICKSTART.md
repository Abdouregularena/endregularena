# 🚀 REGULARENA PRO UEMOA - Guide de Démarrage Rapide

## 📋 Prérequis

- **Node.js** 18.x ou supérieur
- **npm** ou **yarn**
- **Git**
- **PostgreSQL** 15+ (ou Docker)
- **Redis** (ou Docker)
- Compte sur **Vercel** ou **Railway** (optionnel pour déploiement)

---

## ⚡ Installation Locale - 5 Minutes

### 1️⃣ Cloner et configurer

```bash
# Créer le dossier du projet
mkdir regularena-pro-uemoa
cd regularena-pro-uemoa

# Initialiser Git
git init

# Créer la structure
mkdir frontend backend
```

### 2️⃣ Frontend (React/Next.js)

```bash
cd frontend

# Créer l'app Next.js
npx create-next-app@latest . --typescript --tailwind

# Installer les dépendances supplémentaires
npm install framer-motion lucide-react socket.io-client axios

# Ajouter les variables d'environnement
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
EOF

# Lancer le serveur de développement
npm run dev
# L'app sera accessible sur http://localhost:3000
```

### 3️⃣ Backend (Node.js/NestJS)

```bash
cd ../backend

# Créer un nouveau projet NestJS
npm install -g @nestjs/cli
nest new . --package-manager npm

# Installer les dépendances
npm install @nestjs/common @nestjs/platform-express @nestjs/jwt @nestjs/passport
npm install @prisma/client prisma socket.io @socket.io/redis-adapter
npm install dotenv bcrypt jsonwebtoken
npm install -D @types/node

# Initialiser Prisma
npx prisma init

# Ajouter les variables d'environnement
cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres:password@localhost:5432/regularena"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key-change-in-production"
NODE_ENV="development"
PORT=3001
EOF

# Créer les migrations
npx prisma migrate dev --name init

# Lancer le serveur
npm run start:dev
# Le serveur sera accessible sur http://localhost:3001
```

### 4️⃣ Base de données avec Docker

```bash
# À la racine du projet, créer docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: regularena
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
EOF

# Lancer les services
docker-compose up -d

# Vérifier le statut
docker-compose ps
```

---

## 🗄️ Configuration de la Base de Données

### Schéma Prisma (schema.prisma)

Créer le fichier `backend/prisma/schema.prisma` :

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============== UTILISATEURS ==============
model User {
  id            String     @id @default(cuid())
  email         String     @unique
  passwordHash  String
  fullName      String?
  institution   String?
  countryCode   String?
  userType      UserType   @default(PROFESSIONNEL)
  totalXp       Int        @default(0)
  level         Int        @default(1)
  skillRating   Int        @default(1000) // Elo-like
  
  // Relations
  quizResults   QuizResult[]
  matchesAs1    ArenaMatch[] @relation("Player1")
  matchesAs2    ArenaMatch[] @relation("Player2")
  achievements  Achievement[]
  
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@index([countryCode])
  @@index([totalXp])
}

enum UserType {
  PROFESSIONNEL
  ADMIN
  SUPERVISOR
}

// ============== QUIZ ==============
model Quiz {
  id               String   @id @default(cuid())
  title            String
  category         String
  description      String?
  difficulty       Difficulty
  totalQuestions   Int
  timeLimitMinutes Int?
  bceaoReference   String?
  
  questions        Question[]
  results          QuizResult[]
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([difficulty])
  @@index([category])
}

enum Difficulty {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

// ============== QUESTIONS ==============
model Question {
  id                  String   @id @default(cuid())
  quizId              String
  quiz                Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  
  questionText        String
  questionType        QuestionType
  difficultyScore     Int
  regulatoryReference String?
  explanation         String?
  
  answers             Answer[]
  
  createdAt           DateTime @default(now())

  @@index([quizId])
}

enum QuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE
  SHORT_ANSWER
}

model Answer {
  id          String   @id @default(cuid())
  questionId  String
  question    Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  
  answerText  String
  isCorrect   Boolean
  position    Int? // Ordre de présentation

  @@unique([questionId, position])
  @@index([questionId])
}

// ============== RÉSULTATS QUIZ ==============
model QuizResult {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  quizId           String
  quiz             Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  
  score            Int
  totalQuestions   Int
  percentage       Float
  xpEarned         Int
  durationSeconds  Int
  
  completedAt      DateTime @default(now())

  @@unique([userId, quizId, completedAt])
  @@index([userId])
  @@index([completedAt])
}

// ============== ARENA & MATCHS ==============
model ArenaMatch {
  id          String     @id @default(cuid())
  player1Id   String
  player1     User       @relation("Player1", fields: [player1Id], references: [id])
  
  player2Id   String?
  player2     User?      @relation("Player2", fields: [player2Id], references: [id])
  
  player1Score Int?
  player2Score Int?
  
  winnerId    String?
  matchType   MatchType
  matchStatus MatchStatus @default(PENDING)
  
  createdAt   DateTime   @default(now())
  completedAt DateTime?

  @@index([player1Id])
  @@index([player2Id])
  @@index([matchStatus])
}

enum MatchType {
  QUICK
  RANKED
  TOURNAMENT
}

enum MatchStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}

// ============== ACHIEVEMENTS ==============
model Achievement {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  achievementType String
  badgeIcon      String?
  pointsEarned   Int
  
  unlockedAt    DateTime @default(now())

  @@unique([userId, achievementType])
  @@index([userId])
}

// ============== ARTICLES BCEAO ==============
model Article {
  id          String   @id @default(cuid())
  title       String
  content     String
  category    String
  source      String   // "BCEAO", "Documentation", etc.
  externalUrl String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category])
}
```

### Migrations

```bash
# Créer les migrations
npx prisma migrate dev --name initial_schema

# Seed la base de données (optionnel)
cat > backend/prisma/seed.ts << 'EOF'
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Créer un utilisateur de test
  const user = await prisma.user.create({
    data: {
      email: 'test@regularena.com',
      passwordHash: await bcrypt.hash('password123', 10),
      fullName: 'Test User',
      institution: 'BCEAO',
      countryCode: 'SN',
      userType: 'PROFESSIONNEL',
    },
  });

  // Créer un quiz de test
  const quiz = await prisma.quiz.create({
    data: {
      title: 'Dispositif Prudentiel - Niveau 1',
      category: 'Prudentiel',
      description: 'Introduction au dispositif prudentiel BCEAO',
      difficulty: 'BEGINNER',
      totalQuestions: 10,
      bceaoReference: 'DP-2023-001',
    },
  });

  console.log('✅ Seed completed:', { user, quiz });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
EOF

# Exécuter le seed
npx ts-node prisma/seed.ts
```

---

## 🔑 Configuration Environnement

### Frontend (.env.local)

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Features
NEXT_PUBLIC_ENABLE_ARENA=true
NEXT_PUBLIC_ENABLE_TOURNAMENTS=false

# Analytics (optionnel)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=regularena-pro.com
```

### Backend (.env)

```env
# Base de données
DATABASE_URL="postgresql://postgres:password@localhost:5432/regularena"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentification
JWT_SECRET="your-super-secret-key-change-in-prod"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Serveur
NODE_ENV="development"
PORT=3001

# CORS
CORS_ORIGIN="http://localhost:3000"

# Email (optionnel)
SENDGRID_API_KEY=""
SENDER_EMAIL="noreply@regularena.com"
```

---

## 🏃 Scripts de démarrage

### Option 1 : Démarrage manuel

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Docker (si nécessaire)
docker-compose up -d
```

### Option 2 : Avec Makefile (Linux/Mac)

```makefile
.PHONY: install dev docker-up docker-down db-seed clean

install:
	cd frontend && npm install
	cd ../backend && npm install

dev:
	docker-compose up -d
	cd backend && npm run start:dev &
	cd frontend && npm run dev

docker-up:
	docker-compose up -d
	@echo "✅ Database and Redis running on localhost:5432 and localhost:6379"

docker-down:
	docker-compose down

db-seed:
	cd backend && npx prisma db seed

clean:
	rm -rf frontend/node_modules backend/node_modules
	docker-compose down -v

test:
	cd frontend && npm run test
	cd ../backend && npm run test
```

Utilisation :
```bash
make install  # Installation initiale
make dev      # Démarrer tous les services
make docker-up # Redémarrer les services
```

### Option 3 : Avec pm2 (Production-like)

```bash
# Installer pm2
npm install -g pm2

# Créer pm2-ecosystem.config.js
cat > pm2-ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'regularena-backend',
      script: 'dist/main.js',
      cwd: './backend',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      watch: true,
      ignore_watch: ['node_modules', 'dist'],
    },
    {
      name: 'regularena-frontend',
      script: 'node_modules/.bin/next start',
      cwd: './frontend',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
    },
  ],
};
EOF

# Lancer avec pm2
pm2 start pm2-ecosystem.config.js
pm2 logs
```

---

## ✅ Vérification de l'installation

### Checklist

- [ ] Node.js 18+ installé : `node --version`
- [ ] PostgreSQL en cours d'exécution : `psql -U postgres`
- [ ] Redis en cours d'exécution : `redis-cli ping` → `PONG`
- [ ] Frontend sur http://localhost:3000
- [ ] Backend sur http://localhost:3001
- [ ] Base de données migrée : `npx prisma studio`

### Tests rapides

```bash
# Vérifier le backend
curl http://localhost:3001/health

# Vérifier la connexion BDD
npx prisma studio # Ouvre Prisma Studio

# Tester une requête API
curl -X GET http://localhost:3001/api/v1/quizzes
```

---

## 🌐 Déploiement Production

### Déploiement Frontend sur Vercel

```bash
cd frontend

# Installer Vercel CLI
npm i -g vercel

# Se connecter à Vercel
vercel login

# Déployer
vercel --prod

# Ajouter variables d'environnement
vercel env add NEXT_PUBLIC_API_URL https://api.regularena.com
```

### Déploiement Backend sur Railway

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Se connecter
railway login

# Initialiser le projet
railway init

# Connecter la BDD PostgreSQL
railway add --postgres

# Déployer
railway up
```

### Docker Build pour production

```bash
# Backend
cd backend
docker build -t regularena-backend:latest .
docker push your-registry/regularena-backend:latest

# Frontend
cd ../frontend
docker build -t regularena-frontend:latest .
docker push your-registry/regularena-frontend:latest
```

---

## 📚 Ressources utiles

| Ressource | URL |
|-----------|-----|
| Documentation Next.js | https://nextjs.org/docs |
| Documentation NestJS | https://docs.nestjs.com |
| Prisma ORM | https://www.prisma.io/docs |
| Socket.io | https://socket.io/docs |
| Tailwind CSS | https://tailwindcss.com/docs |
| Vercel | https://vercel.com/docs |
| Railway | https://railway.app/docs |

---

## 🆘 Troubleshooting

### Erreur : "Cannot find module"

```bash
# Réinstaller les dépendances
npm ci --legacy-peer-deps
```

### Erreur : "PORT 3000 already in use"

```bash
# Sur macOS/Linux
lsof -i :3000
kill -9 <PID>

# Sur Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Erreur : "PostgreSQL connection refused"

```bash
# Vérifier le statut
docker-compose ps

# Redémarrer
docker-compose restart postgres

# Vérifier les logs
docker-compose logs postgres
```

### Erreur : "Redis connection refused"

```bash
# Même procédure que PostgreSQL
docker-compose restart redis
docker-compose logs redis
```

---

## 🎓 Prochaines étapes

1. **Développer les endpoints API** : Ajouter quiz, résultats, leaderboard
2. **Implémenter WebSocket** : Mode Arène en temps réel
3. **Ajouter l'authentification** : JWT, refresh tokens
4. **Tests** : Jest pour backend, Cypress pour frontend
5. **CI/CD** : GitHub Actions pour automatiser les déploiements

---

**Status** : ✅ Prêt à développer  
**Durée estimée** : 15 minutes pour une installation complète  
**Support** : Rejoindre la communauté Discord ou GitHub Discussions
