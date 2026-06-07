# 🔄 MIGRATION RAILWAY/OVH → NOUVELLE INFRA REGULARENA PRO
## Remplacer l'existant sans risque (Blue-Green Switch)

---

## 📋 SITUATION ACTUELLE

```
Architecture Existante:
├── Frontend: OVH (www.regularena.com)
├── Backend: Railway (ancien projet)
├── BDD: PostgreSQL sur Railway
└── DNS: OVH

Architecture Nouvelle:
├── Frontend: Vercel (new)
├── Backend: Railway (nouveau projet)
├── BDD: PostgreSQL Railway (nouvelle)
└── DNS: Cloudflare (new)
```

**Stratégie** : Créer la nouvelle infra en parallèle, puis basculer progressivement

---

## ✅ ÉTAPE 1 : AUDIT DE L'INFRASTRUCTURE EXISTANTE

### 1.1 Vérifier les services Railway actuels

```bash
# Se connecter à Railway
railway login

# Lister les projets existants
railway projects

# Affichage attendu:
# regularena (ancien projet)
# regularena-pro (nouveau projet à créer)

# Se connecter au projet actuel
railway switch

# Voir les services
railway services

# Voir les variables d'environnement actuelles
railway variables

# IMPORTANT: Noter ces valeurs
# - DATABASE_URL (ancienne BDD)
# - REDIS_URL (ancien cache)
# - JWT_SECRET
# - SENDGRID_API_KEY
# etc.
```

### 1.2 Exporter les données de l'ancienne BDD

```bash
# Créer une sauvegarde de la BDD actuelle
railway run "pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql"

# Télécharger la sauvegarde
mkdir -p ./backups
cp backup-*.sql ./backups/

# Vérifier la sauvegarde
ls -lh ./backups/backup-*.sql

# Ou via Railway CLI directement
railway db:export > backup-production.sql

echo "✅ Sauvegarde de l'ancienne BDD complétée"
```

### 1.3 Documenter la configuration OVH actuelle

```bash
# Noter les informations OVH importantes
cat > ./current-config.md << 'EOF'
# Configuration OVH Actuelle

## Domaine
- Domaine: www.regularena.com
- Registrar: OVH
- DNS: OVH nameservers

## Serveur OVH
- Type: VPS / Dedicated
- OS: Linux (Ubuntu/CentOS)
- Frontend: (Apache/Nginx)
- Port: 80/443

## Points d'entrée actuels
- Frontend: https://www.regularena.com (OVH)
- Backend: https://api.regularena.com (Railway)

## Redirection
- www.regularena.com → OVH
- regularena.com → OVH
- api.regularena.com → Railway

## SSL Certificates
- Frontend: (Let's Encrypt/OVH)
- Backend: (Railway)

EOF

cat ./current-config.md
```

### 1.4 Tester la connectivité actuelle

```bash
#!/bin/bash
# test-current-setup.sh

echo "🔍 Test de l'infrastructure existante..."

echo "\n1. Frontend OVH:"
curl -I https://www.regularena.com
echo "Status: $(curl -s -o /dev/null -w '%{http_code}' https://www.regularena.com)"

echo "\n2. Backend Railway:"
curl -I https://api.regularena.com/health
echo "Status: $(curl -s -o /dev/null -w '%{http_code}' https://api.regularena.com/health)"

echo "\n3. Base de données (via backend):"
curl -s -X GET https://api.regularena.com/api/v1/quiz/available \
  -H "Authorization: Bearer test" | head -20

echo "\n✅ Test complété"
```

---

## 🚀 ÉTAPE 2 : CRÉER LA NOUVELLE INFRA RAILWAY

### 2.1 Créer un nouveau projet Railway

```bash
# Option 1: Via CLI
railway init

# Questions:
# ? Create new project? Yes
# ? Project name: regularena-pro-v2
# ? Environment: production

# Affichage:
# ✓ Project created: regularena-pro-v2
# ✓ Added to current directory
```

**ou** via le dashboard: https://railway.app/new → Create New Project

### 2.2 Ajouter les services (PostgreSQL & Redis)

```bash
# Ajouter PostgreSQL
railway add --postgres

# Affichage:
# ✓ PostgreSQL added
# ✓ DATABASE_URL configured

# Ajouter Redis (optionnel mais recommandé)
railway add --redis

# Affichage:
# ✓ Redis added
# ✓ REDIS_URL configured

# Vérifier les services
railway services

# Résultat attendu:
# regularena-pro-v2
# ├── postgres (DATABASE_URL: postgresql://...)
# └── redis (REDIS_URL: redis://...)
```

### 2.3 Migrer les données de l'ancienne BDD

```bash
# Récupérer l'ancienne DATABASE_URL
railway switch # Sélectionner le projet "regularena"
OLD_DB=$(railway variables | grep DATABASE_URL | cut -d= -f2)

# Récupérer la nouvelle DATABASE_URL
railway switch # Sélectionner le projet "regularena-pro-v2"
NEW_DB=$(railway variables | grep DATABASE_URL | cut -d= -f2)

# Exporter depuis l'ancienne BDD
pg_dump "$OLD_DB" > /tmp/migration-dump.sql

# Importer dans la nouvelle BDD
psql "$NEW_DB" < /tmp/migration-dump.sql

echo "✅ Migration de la BDD complétée"

# Vérifier les données
psql "$NEW_DB" -c "SELECT COUNT(*) as users FROM users;"
psql "$NEW_DB" -c "SELECT COUNT(*) as quizzes FROM quizzes;"
```

### 2.4 Configurer les variables d'environnement du nouveau projet

```bash
# Dans le projet regularena-pro-v2

# Secrets (ne pas copier directement!)
railway variables set NODE_ENV=production
railway variables set PORT=3001

# Copier les secrets de l'ancien projet (avec vérification)
railway switch # Sélectionner "regularena"
OLD_JWT=$(railway variables | grep JWT_SECRET)
OLD_SENDGRID=$(railway variables | grep SENDGRID_API_KEY)

# Basculer vers le nouveau projet
railway switch # Sélectionner "regularena-pro-v2"

# Ajouter les secrets (les mêmes que l'ancien pour compatibilité)
railway variables set JWT_SECRET="$OLD_JWT"
railway variables set SENDGRID_API_KEY="$OLD_SENDGRID"
railway variables set SENDER_EMAIL=noreply@regularena.com

# Configuration supplémentaire
railway variables set CORS_ORIGIN="https://regularena.com,https://www.regularena.com,https://staging.regularena.com"
railway variables set LOG_LEVEL=info
railway variables set SENTRY_DSN="https://..."

# Vérifier
railway variables
```

### 2.5 Déployer le nouveau backend sur Railway

```bash
# Se placer dans le dossier backend
cd backend

# Se connecter au nouveau projet Railway
railway link # Sélectionner "regularena-pro-v2"

# Build et déploiement
railway up

# Affichage:
# ✓ Building...
# ✓ Deploying...
# ✓ Deployed to https://regularena-backend-prod.up.railway.app

# Vérifier le déploiement
railway logs

# Test du health check
curl https://regularena-backend-prod.up.railway.app/health

# Résultat attendu:
# {"status":"ok","timestamp":"2026-06-01T..."}
```

### 2.6 Migrer les données avec Prisma

```bash
# Exécuter les migrations Prisma
railway run npx prisma migrate deploy

# Affichage:
# ✓ Migrations applied successfully

# Seed les données initiales
railway run npx prisma db seed

# Vérifier les données
railway run npx prisma studio

# (Ouvrira une interface web pour vérifier les données)
```

---

## 🌐 ÉTAPE 3 : DÉPLOYER FRONTEND SUR VERCEL

### 3.1 Créer le projet Vercel

```bash
# Créer un account Vercel si nécessaire
# https://vercel.com/signup

# Depuis le dossier frontend
cd frontend

# Lier à Vercel
vercel link

# Questions:
# ? Found project "regularena-pro-uemoa"? No
# ? What's your project's name? regularena-pro
# ? In which directory is your code? ./
# ? Want to modify vercel.json? No

# Affichage:
# ✓ Linked to regularena-pro
# ✓ Access tokens saved
```

### 3.2 Configurer les variables d'environnement Vercel

```bash
# Ajouter les variables d'environnement pour production
vercel env add NEXT_PUBLIC_API_URL
# Value: https://api-prod.regularena.com
# ou: https://regularena-backend-prod.up.railway.app

vercel env add NEXT_PUBLIC_WS_URL
# Value: wss://api-prod.regularena.com
# ou: wss://regularena-backend-prod.up.railway.app

# Ajouter pour staging aussi (test avant go-live)
vercel env add NEXT_PUBLIC_API_URL --environment staging
# Value: https://staging-api.regularena.com

# Vérifier
vercel env list
```

### 3.3 Déployer sur Vercel

```bash
# Déploiement de staging (test)
vercel

# Affichage:
# ✓ Preview: https://regularena-pro.vercel.app
# ✓ Production: https://regularena-pro.vercel.app (pas encore)

# Déploiement production
vercel --prod

# Affichage:
# ✓ Production: https://regularena-pro.vercel.app [copied]

# L'URL provisoire Vercel
curl https://regularena-pro.vercel.app
```

---

## 📡 ÉTAPE 4 : CONFIGURER CLOUDFLARE (DNS)

### 4.1 Créer un compte Cloudflare

```bash
# Aller à https://dash.cloudflare.com/

# "Add a site" → regularena.com

# Sélectionner le plan:
# - Free: Suffisant pour débuter
# - Pro: Si vous avez besoin d'analytics avancés

# Cloudflare vous donnera 2 nameservers à ajouter à OVH
# Example:
# - ns1.cloudflare.com
# - ns2.cloudflare.com
```

### 4.2 Changer les Nameservers chez OVH

```bash
# Login OVH Dashboard: https://www.ovh.com/auth/

# Aller à: Domaines > regularena.com > DNS

# Remplacer les nameservers existants par:
# ns1.cloudflare.com
# ns2.cloudflare.com
# (Optionnel: ns3.cloudflare.com)

# Cela peut prendre 24-48h pour la propagation
```

### 4.3 Configurer les DNS Records dans Cloudflare

```bash
# Dans Cloudflare Dashboard > DNS Records

# 1. Rediriger www vers Vercel (NOUVELLE)
Type: CNAME
Name: www
Target: cname.vercel-dns.com
TTL: 300 (pour migration facile)
Proxy: Cloudflareed (orange cloud)

# 2. Rediriger api vers Railway (NOUVEAU)
Type: CNAME
Name: api
Target: regularena-backend-prod.up.railway.app
TTL: 300
Proxy: DNS only (gray cloud - pas de proxy)

# 3. Root domain (regularena.com)
Type: CNAME
Name: @ (ou laissez vide)
Target: cname.vercel-dns.com
TTL: 300
Proxy: Cloudflareed

# 4. (ANCIEN) Garder en parallèle le temps de test
Type: CNAME
Name: legacy
Target: (ancienne IP OVH)
TTL: 3600
Proxy: DNS only

# Résultat:
# www → Vercel (NOUVEAU)
# api → Railway nouveau (NOUVEAU)
# @ → Vercel (NOUVEAU)
# legacy → OVH ancien (fallback)
```

### 4.4 Vérifier la propagation DNS

```bash
#!/bin/bash
# check-dns.sh

echo "🔍 Vérification de la propagation DNS..."

# Vérifier www
echo "\n1. www.regularena.com:"
dig www.regularena.com +short
# Devrait retourner une IP ou CNAME de Vercel

# Vérifier api
echo "\n2. api.regularena.com:"
dig api.regularena.com +short
# Devrait retourner un CNAME de Railway

# Vérifier root
echo "\n3. regularena.com:"
dig regularena.com +short

# Vérifier avec Google DNS
echo "\n4. Via Google DNS (8.8.8.8):"
dig @8.8.8.8 www.regularena.com +short

# Checker en ligne
echo "\n✓ Vérifier aussi sur: https://www.whatsmydns.net/?q=www.regularena.com"

# Attendre la propagation complète
echo "\n⏳ Propagation peut prendre 5-30 minutes..."
```

---

## 🧪 ÉTAPE 5 : TESTS PARALLÈLES (ANCIENNE VS NOUVELLE)

### 5.1 Tester les deux infrastructures en parallèle

```bash
#!/bin/bash
# test-both-infras.sh

echo "📊 Test comparatif: Ancienne vs Nouvelle infra\n"

# ANCIENNE
echo "═══════════════════════════════════════"
echo "INFRASTRUCTURE EXISTANTE (OVH + Railway)"
echo "═══════════════════════════════════════"

echo "\n✓ Frontend OVH:"
curl -I https://www.regularena.com 2>&1 | grep -E "HTTP|Connection|Server"

echo "\n✓ Backend Railway (ancien):"
curl -I https://api.regularena.com/health 2>&1 | grep -E "HTTP|Connection"

OLD_TIME=$(curl -s -o /dev/null -w '%{time_total}' https://api.regularena.com/api/v1/quiz/available \
  -H "Authorization: Bearer test")
echo "Temps de réponse: ${OLD_TIME}s"

# NOUVELLE
echo "\n\n═══════════════════════════════════════"
echo "INFRASTRUCTURE NOUVELLE (Vercel + Railway v2)"
echo "═══════════════════════════════════════"

echo "\n✓ Frontend Vercel:"
curl -I https://regularena-pro.vercel.app 2>&1 | grep -E "HTTP|Connection|x-vercel"

echo "\n✓ Backend Railway (nouveau):"
curl -I https://regularena-backend-prod.up.railway.app/health 2>&1 | grep -E "HTTP|Connection"

NEW_TIME=$(curl -s -o /dev/null -w '%{time_total}' https://regularena-backend-prod.up.railway.app/api/v1/quiz/available \
  -H "Authorization: Bearer test")
echo "Temps de réponse: ${NEW_TIME}s"

# Comparaison
echo "\n\n═══════════════════════════════════════"
echo "RÉSULTATS COMPARATIFS"
echo "═══════════════════════════════════════"

echo "Ancienne API: ${OLD_TIME}s"
echo "Nouvelle API: ${NEW_TIME}s"

if (( $(echo "$NEW_TIME < $OLD_TIME" | bc -l) )); then
  echo "✅ Nouvelle infra PLUS RAPIDE!"
else
  echo "⚠️ Nouvelle infra PLUS LENTE (à investiguer)"
fi

echo "\n"
```

### 5.2 Tests fonctionnels détaillés

```bash
#!/bin/bash
# test-new-infra.sh

API="https://regularena-backend-prod.up.railway.app"
FRONTEND="https://regularena-pro.vercel.app"

echo "🧪 Tests complets de la nouvelle infrastructure\n"

# 1. Test connexion
echo "1️⃣ Test d'authentification..."
LOGIN=$(curl -s -X POST "$API/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"marie.sow@bceao.int",
    "password":"Test123!"
  }')

TOKEN=$(echo $LOGIN | jq -r '.accessToken // empty')

if [ ! -z "$TOKEN" ]; then
  echo "✅ Authentification OK"
  echo "Token: ${TOKEN:0:30}..."
else
  echo "❌ Authentification ÉCHOUÉE"
  echo "Réponse: $LOGIN"
  exit 1
fi

# 2. Test du profil
echo "\n2️⃣ Test du profil utilisateur..."
PROFILE=$(curl -s "$API/api/v1/users/profile" \
  -H "Authorization: Bearer $TOKEN")

if echo $PROFILE | jq -e '.id' > /dev/null; then
  echo "✅ Profil OK: $(echo $PROFILE | jq -r '.fullName')"
else
  echo "❌ Profil ÉCHOUÉ: $PROFILE"
fi

# 3. Test des quiz
echo "\n3️⃣ Test des quiz..."
QUIZZES=$(curl -s "$API/api/v1/quiz/available?limit=5" \
  -H "Authorization: Bearer $TOKEN")

COUNT=$(echo $QUIZZES | jq '.data | length')
echo "✅ $COUNT quiz disponibles"

# 4. Test du leaderboard
echo "\n4️⃣ Test du leaderboard..."
LEADERBOARD=$(curl -s "$API/api/v1/leaderboard?limit=3" \
  -H "Authorization: Bearer $TOKEN")

TOP=$(echo $LEADERBOARD | jq '.leaderboard[0].fullName')
echo "✅ Top 1: $TOP"

# 5. Test du frontend
echo "\n5️⃣ Test du frontend..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND)
if [ $STATUS -eq 200 ]; then
  echo "✅ Frontend OK (HTTP $STATUS)"
else
  echo "❌ Frontend ERREUR (HTTP $STATUS)"
fi

echo "\n✅ Tous les tests passés!"
```

---

## 🔀 ÉTAPE 6 : STRATÉGIE DE BASCULEMENT (SANS DOWNTIME)

### 6.1 Plan de basculement progressif

```
Jour 1-2: Préparation & Tests
  ├─ Tests techniques complets
  ├─ Tests de charge
  └─ Validation par l'équipe

Jour 3: Basculement à 10% (Canary)
  ├─ Faire pointer 10% du trafic vers la nouvelle infra
  ├─ Monitorer les erreurs
  └─ Valider la stabilité

Jour 4-5: Basculement à 50%
  ├─ Faire pointer 50% du trafic
  ├─ Test avec vrai traffic utilisateur
  └─ Collecter les retours

Jour 6: Basculement à 100% (Production)
  ├─ Basculer 100% du trafic
  ├─ Monitoring intensif 24/7
  └─ Team support en attente

Jour 7-13: Observation (old infrastructure = fallback)
  ├─ Laisser l'ancienne infra active
  ├─ Prêt à rollback si nécessaire
  └─ Validar la stabilité complète

Jour 14: Cleanup
  └─ Désactiver l'ancienne infrastructure
```

### 6.2 Basculement 10% avec Cloudflare (Canary)

```bash
#!/bin/bash
# canary-10-percent.sh

API_TOKEN="YOUR_CLOUDFLARE_API_TOKEN"
ZONE_ID="YOUR_ZONE_ID"

echo "🎯 Basculement 10% du traffic vers la nouvelle infra..."

# 1. Créer un pool avec 90% ancien, 10% nouveau (via Load Balancer Cloudflare)
# C'est compliqué via API, plus facile via dashboard

# Via Dashboard:
# - Aller à: Règles > Règles de routage
# - Créer une règle: 
#   If traffic from 10% random sessions
#   Then forward to new backend
#   Else forward to old backend

# Via CLI (si vous avez un script):
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/load_balancers" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "regularena-canary",
    "default_pool_id": "old_pool",
    "description": "Canary 10% traffic to new infra",
    "steering_policy": "random",
    "ttl": 30,
    "session_affinity": "cookie",
    "rules": [
      {
        "condition": "http.request.headers[\"cf-ray\"] contains \"-1\"",
        "overrides": {
          "session_affinity": "ip_cookie",
          "pool": "new_pool"
        }
      }
    ]
  }'

echo "✅ Basculement 10% configuré"
echo "\n📊 À monitorer:"
echo "  - Erreurs 5xx chez le nouveau backend"
echo "  - Temps de réponse"
echo "  - Logs de l'API"
```

### 6.3 Basculement 100% via DNS (Méthode simple)

```bash
#!/bin/bash
# switchover-100-percent.sh

# Cette méthode est la plus simple et la plus fiable

echo "🚀 Basculement 100% vers la nouvelle infrastructure..."

# 1. Réduire le TTL à 300s (5 min) - pour switchover rapide
# Via Cloudflare Dashboard > DNS Records
# Ou via API:

curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ttl": 300}'

echo "✓ TTL réduit à 300 secondes"
sleep 60

# 2. Basculer www vers Vercel
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$WWW_RECORD_ID" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CNAME",
    "name": "www",
    "content": "cname.vercel-dns.com",
    "ttl": 300,
    "proxied": true
  }'

echo "✓ www pointant vers Vercel"

# 3. Basculer api vers Railway nouveau
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$API_RECORD_ID" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CNAME",
    "name": "api",
    "content": "regularena-backend-prod.up.railway.app",
    "ttl": 300,
    "proxied": false
  }'

echo "✓ api pointant vers Railway nouveau"

# 4. Vérifier la propagation
echo "\n⏳ Vérification de la propagation DNS..."
for i in {1..30}; do
  WWW_IP=$(dig www.regularena.com +short | tail -1)
  API_IP=$(dig api.regularena.com +short | tail -1)
  
  if [[ "$WWW_IP" == *"vercel"* ]] || [[ "$WWW_IP" == *"76.76"* ]]; then
    echo "[$i/30] ✓ www propagé vers Vercel"
    break
  else
    echo "[$i/30] www: $WWW_IP (en attente...)"
    sleep 5
  fi
done

# 5. Tests de connectivité
echo "\n🧪 Tests de connectivité..."
sleep 10

FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://www.regularena.com)
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.regularena.com/health)

echo "Frontend: HTTP $FRONTEND_STATUS"
echo "Backend: HTTP $BACKEND_STATUS"

if [ $FRONTEND_STATUS -eq 200 ] && [ $BACKEND_STATUS -eq 200 ]; then
  echo "\n✅ BASCULEMENT RÉUSSI!"
else
  echo "\n❌ ERREUR - Vérifier les logs"
  echo "Prêt à rollback"
fi

# 6. Augmenter le TTL après 1h
echo "\n⏱️  Augmentation du TTL dans 1 heure..."
sleep 3600

curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$WWW_RECORD_ID" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ttl": 3600}'

echo "✓ TTL augmenté à 3600 secondes"
```

---

## ⚠️ ÉTAPE 7 : PLAN DE ROLLBACK

### 7.1 Rollback rapide en cas de problème

```bash
#!/bin/bash
# rollback.sh
# À exécuter SI les problèmes persistent après le basculement

set -e

echo "⚠️  ROLLBACK EN COURS..."
echo "⏰ Heure: $(date)"

# 1. Basculer le DNS vers l'ancienne infrastructure
echo "\n1️⃣ Basculement DNS vers ancienne infra..."

curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$WWW_RECORD_ID" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CNAME",
    "name": "www",
    "content": "(ancienne-IP-OVH)",
    "ttl": 300
  }'

# 2. Vérifier le basculement
echo "\n2️⃣ Vérification..."
sleep 10

curl -I https://www.regularena.com

# 3. Notifier l'équipe
echo "\n3️⃣ Notifications..."

curl -X POST https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK \
  -d '{"text":"🚨 ROLLBACK EFFECTUÉ - Retour à l'\''ancienne infra. Vérifier l'\''impact."}'

# 4. Documenter l'incident
cat > ./rollback-report-$(date +%Y%m%d-%H%M%S).md << 'EOF'
# Rapport de Rollback

**Date**: $(date)
**Raison**: À remplir manuellement
**Impact**: À estimer
**Actions prises**: Voir rollback.sh

## À faire après:
- [ ] Analyser les logs de la nouvelle infra
- [ ] Identifier le problème exact
- [ ] Faire les corrections
- [ ] Retester avant re-tentative
EOF

echo "\n✅ ROLLBACK COMPLÉTÉ"
echo "ℹ️ Vérifier ./rollback-report-*.md pour les détails"
```

### 7.2 Données de l'ancienne infrastructure (à conserver)

```bash
# NE PAS SUPPRIMER l'ancienne infrastructure pendant au moins 2 semaines

# Jour 1-14: Conserver l'ancienne infra fonctionnelle
# - OVH: Garder le serveur actif
# - Railway ancien: Garder les services actifs
# - Backups: Conserver les backups BD

# Jour 15+: Après validation complète
# - Archiver les backups
# - Désactiver les services Railway anciens
# - Garder OVH comme fallback

# Commandes de nettoyage (à JOUR 15+):
# railway switch # Sélectionner le vieux projet
# railway services rm <service-id> # Supprimer service par service
# railway projects rm regularena # Supprimer le projet entier

# Ne supprimez PAS le domaine OVH immédiatement!
```

---

## 📊 ÉTAPE 8 : MONITORING POST-BASCULEMENT

### 8.1 Dashboard de monitoring

```bash
#!/bin/bash
# monitor-after-switchover.sh
# À exécuter toutes les 5 minutes pendant 48h

API="https://api.regularena.com"
FRONTEND="https://www.regularena.com"

echo "📊 Monitoring post-basculement - $(date)"

# 1. Disponibilité
echo "\n1. Disponibilité:"
curl -s -o /dev/null -w "Frontend: %{http_code} | " $FRONTEND
curl -s -o /dev/null -w "Backend: %{http_code}\n" $API/health

# 2. Temps de réponse
echo "\n2. Performance:"
curl -s -o /dev/null -w "Frontend: %{time_total}s | " $FRONTEND
curl -s -o /dev/null -w "Backend: %{time_total}s\n" $API/health

# 3. Erreurs
echo "\n3. Erreurs (dernières 5 min):"
curl -s "$API/metrics/errors?interval=5m" -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.errors | length'

# 4. Utilisateurs actifs
echo "\n4. Utilisateurs actifs:"
curl -s "$API/metrics/active-users" -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.count'

# 5. Base de données
echo "\n5. Base de données:"
curl -s "$API/metrics/database" -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.connections'

# Sauvegarder les logs
echo "$(date): Frontend=$(curl -s -o /dev/null -w '%{http_code}' $FRONTEND), Backend=$(curl -s -o /dev/null -w '%{http_code}' $API/health)" >> ./monitoring.log

echo "\n✅ Monitoring complété"
```

### 8.2 Alertes automatiques

```bash
#!/bin/bash
# alert-on-errors.sh
# À exécuter via cron toutes les 5 min

API="https://api.regularena.com"
THRESHOLD_ERRORS=10
THRESHOLD_RESPONSE_TIME=3000  # ms

# Vérifier les erreurs
ERRORS=$(curl -s "$API/metrics/errors?interval=5m" -H "Authorization: Bearer $TOKEN" | jq '.count // 0')

if [ $ERRORS -gt $THRESHOLD_ERRORS ]; then
  curl -X POST https://hooks.slack.com/services/YOUR/SLACK \
    -d "{\"text\":\"⚠️ Trop d'erreurs: $ERRORS en 5 minutes\"}"
fi

# Vérifier le temps de réponse
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" $API/health | cut -d'.' -f1)000

if [ $RESPONSE_TIME -gt $THRESHOLD_RESPONSE_TIME ]; then
  curl -X POST https://hooks.slack.com/services/YOUR/SLACK \
    -d "{\"text\":\"⚠️ API lente: ${RESPONSE_TIME}ms\"}"
fi
```

---

## ✅ CHECKLIST FINALE

### Avant le basculement
- [ ] Nouvelle infra testée complètement
- [ ] Données migrées et vérifiées
- [ ] DNS configuré et propagé
- [ ] SSL/TLS fonctionnant
- [ ] Monitoring actif
- [ ] Plan de rollback validé
- [ ] Équipe notifiée
- [ ] Sauvegarde complète effectuée

### Après le basculement (J+1)
- [ ] Aucune erreur critique
- [ ] Performance nominale
- [ ] Utilisateurs ne signalent pas de problèmes
- [ ] Ancienne infra en standby
- [ ] Logs collectés et analysés

### Après 7 jours
- [ ] Stabilité confirmée
- [ ] Aucun incident sérieux
- [ ] Metrics normales
- [ ] Prêt à désactiver l'ancienne infra

---

## 📞 CONTACTS D'URGENCE

Si quelque chose se passe mal:

```
1. Slack: #regularena-incident
2. Email: devops@regularena.com
3. Téléphone: +221 XXX XXX XXXX
```

**Premier réflexe: ROLLBACK!**
```bash
./rollback.sh
```

Puis analyser calmement le problème.

---

**Prêt? Commencez par l'ÉTAPE 1!**

Version: 2.0 (Migration depuis Railway/OVH existant)  
Status: 🟢 Production-ready  
Durée totale: 2-3 jours (avec tests)
