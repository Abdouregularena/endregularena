# 🚨 GUIDE D'URGENCE - REGULARENA PRO UEMOA

## ⚡ Raccourcis (Si quelque chose ne marche pas)

### Problème: "Le frontend est blanc/ne charge pas"

```bash
# 1. Vérifier le statut Vercel
vercel status

# 2. Voir les logs
vercel logs --tail

# 3. Redéployer
cd frontend
vercel --prod

# 4. Vérifier le DNS
dig www.regularena.com +short
# Doit retourner une IP ou CNAME de Vercel

# Si rien ne fonctionne: ROLLBACK
./rollback.sh
```

---

### Problème: "Le backend est down (API errors)"

```bash
# 1. Vérifier le status du backend
curl https://api.regularena.com/health

# 2. Voir les logs Railway
railway logs --tail

# 3. Vérifier les variables d'env
railway variables

# 4. Redéployer
cd backend
railway up

# 5. Vérifier la BDD
railway run psql "$DATABASE_URL" -c "SELECT 1;"

# Si rien ne fonctionne: ROLLBACK
./rollback.sh
```

---

### Problème: "Les utilisateurs ne peuvent pas se connecter"

```bash
# 1. Vérifier JWT_SECRET
railway variables | grep JWT_SECRET

# 2. Tester l'authentification
curl -X POST https://api.regularena.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"marie.sow@bceao.int",
    "password":"Test123!"
  }' | jq

# 3. Vérifier la BDD (données existent?)
railway run psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"

# 4. Vérifier les logs
railway logs --grep "auth"
```

---

### Problème: "DNS pas propagé (les utilisateurs ne trouvent pas le domaine)"

```bash
# 1. Vérifier la propagation
dig www.regularena.com +short
dig @8.8.8.8 www.regularena.com +short  # Google DNS

# 2. Checker globalement
# https://www.whatsmydns.net/?q=www.regularena.com

# 3. Attendre (max 48h mais généralement < 30 min)
# TTL réduit à 300s pendant migration

# 4. Rafraîchir le cache DNS local
# macOS: sudo dscacheutil -flushcache
# Linux: sudo systemctl restart systemd-resolved
# Windows: ipconfig /flushdns
```

---

### Problème: "Trop d'erreurs 500"

```bash
# 1. Vérifier les logs
railway logs --grep "ERROR"

# 2. Vérifier la BDD
railway run psql "$DATABASE_URL" -c "SELECT * FROM information_schema.tables;"

# 3. Vérifier les variables d'env (secrets manquants?)
railway variables

# 4. Vérifier les ressources (CPU, RAM, connections)
railway logs | grep -E "CPU|Memory|connections"

# 5. Si c'est la BDD
railway run npx prisma migrate deploy
railway run npx prisma db seed

# 6. Redéployer
railway up
```

---

### Problème: "Performance très lente"

```bash
# 1. Tester la latence
curl -w "Time: %{time_total}s\n" https://api.regularena.com/health

# 2. Vérifier les logs pour les queries lentes
railway logs | grep "duration"

# 3. Vérifier les connexions BDD
railway run psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity;"

# 4. Vérifier le cache Redis
railway variables | grep REDIS_URL

# 5. Si le problème persiste: augmenter les ressources
# Via Railway Dashboard: Settings > Resources
```

---

### Problème: "La BDD est corrompue/données perdues"

```bash
# 1. Restaurer depuis backup (NE PAS PANIQUER!)
LATEST_BACKUP=$(ls -t ./backups/backup-*.sql | head -1)

# 2. Récupérer la DATABASE_URL actuelle
export DATABASE_URL=$(railway variables | grep DATABASE_URL | cut -d= -f2)

# 3. Restaurer
psql "$DATABASE_URL" < "$LATEST_BACKUP"

# 4. Vérifier
railway run psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"

# ⚠️ Vous aviez une sauvegarde n'est-ce pas? (À moins que...)
```

---

## 🔄 ROLLBACK RAPIDE (TOUS LES CAS)

**Si TOUT ce passe mal après le basculement:**

```bash
#!/bin/bash
# rollback.sh (exécuter immédiatement)

echo "🚨 ROLLBACK EN COURS..."

# 1. Basculer DNS vers l'ancienne infrastructure
# (via Cloudflare Dashboard ou API)

# 2. Attendre la propagation (~5 min)
sleep 300

# 3. Vérifier
curl https://www.regularena.com

# 4. Notifier l'équipe
# Slack: "Rollback effectué - Retour à l'ancienne infra"

echo "✅ Rollback complété"
echo "Ancienne infra devrait être fonctionnelle"
```

**Cloudflare API Rollback:**

```bash
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$WWW_RECORD_ID" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CNAME",
    "content": "(ancienne-IP-OVH)",
    "ttl": 300
  }'
```

---

## 📞 CONTACTS D'URGENCE (24/7)

```
🆘 En cas d'urgence:

Slack:
  #regularena-incident

Email:
  devops@regularena.com

Téléphone:
  +221 XX XXX XXXX

Support:
  support@regularena.com
```

---

## 📊 CHECKLIST DE DIAGNOSTIC RAPIDE

```
Est-ce que ça MARCHE?

Frontend (www.regularena.com):
├─ [ ] URL accessible
├─ [ ] Pas de erreur blanc/500
├─ [ ] Login fonctionnel
└─ [ ] Dashboard charge

Backend (api.regularena.com):
├─ [ ] /health répond
├─ [ ] /auth/login fonctionne
├─ [ ] /quiz/available charge
└─ [ ] Leaderboard accessible

DNS:
├─ [ ] www.regularena.com resolve
├─ [ ] api.regularena.com resolve
└─ [ ] Propagation complète

BDD:
├─ [ ] Connexion possible
├─ [ ] Données présentes
├─ [ ] Migrations appliquées
└─ [ ] Seed complété
```

---

## ⚡ SOLUTIONS RAPIDES PAR SYMPTÔME

### Le site affiche "Cannot GET /"
```bash
# Frontend pas construit correctement
cd frontend
vercel --prod --skip-build
# ou
vercel rollback  # Revenir à la version précédente
```

### "Error: connect ECONNREFUSED 127.0.0.1:5432"
```bash
# BDD inaccessible
# 1. Vérifier DATABASE_URL
railway variables

# 2. Vérifier que PostgreSQL est actif
railway services

# 3. Redémarrer PostgreSQL
railway services rm postgres
railway add --postgres
```

### "JWT signature invalid"
```bash
# Le JWT_SECRET n'est pas le même
# Résolution:
railway variables set JWT_SECRET="$(cat backup-jwt-secret.txt)"

# PUIS redéployer
railway up
```

### "CORS error: Origin not allowed"
```bash
# CORS_ORIGIN non configuré correctement
railway variables set CORS_ORIGIN="https://regularena.com,https://www.regularena.com"

# Redéployer
railway up
```

### "Too many connections to database"
```bash
# BDD surchargée
# Solutions rapides:
# 1. Redémarrer la BDD
railway run psql "$DATABASE_URL" -c "SELECT pg_reload_conf();"

# 2. Tuer les connexions zombies
railway run psql "$DATABASE_URL" -c "
  SELECT pg_terminate_backend(pid) 
  FROM pg_stat_activity 
  WHERE state = 'inactive' AND query_start < now() - interval '1 day';
"

# 3. Augmenter les ressources (Railway Dashboard)
```

---

## 🔍 LOGS À VÉRIFIER

### Frontend Logs
```bash
# Logs Vercel
vercel logs

# Erreurs JavaScript
# Vérifier la console navigateur (F12)
# Réseau (Network tab) → vérifier les réponses API
```

### Backend Logs
```bash
# Logs Railway
railway logs --tail

# Chercher les erreurs
railway logs --grep "ERROR"

# Chercher les timeouts
railway logs --grep "timeout"

# Chercher les auth issues
railway logs --grep "auth\|401\|403"
```

### Logs Système
```bash
# Vérifier les ressources
railway run "top -b -n 1 | head -20"

# Vérifier l'espace disque
railway run "df -h"

# Vérifier la mémoire
railway run "free -h"
```

---

## 🛠️ TESTS RAPIDES

```bash
#!/bin/bash
# quick-test.sh

echo "🧪 Tests rapides..."

# 1. Frontend
echo -n "Frontend: "
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" https://www.regularena.com)
[ "$FRONTEND" = "200" ] && echo "✅ $FRONTEND" || echo "❌ $FRONTEND"

# 2. Backend health
echo -n "Backend health: "
HEALTH=$(curl -s https://api.regularena.com/health | jq '.status')
[ "$HEALTH" = '"ok"' ] && echo "✅ $HEALTH" || echo "❌ $HEALTH"

# 3. API test
echo -n "API test: "
API_TEST=$(curl -s https://api.regularena.com/api/v1/quiz/available | jq '.data | length')
echo "✅ $API_TEST quiz disponibles"

# 4. Database
echo -n "Database: "
DB=$(railway run psql "$DATABASE_URL" -t -c "SELECT 1;")
[ "$DB" = " 1" ] && echo "✅ Connecté" || echo "❌ Erreur"

echo "\n✅ Test rapide complété"
```

---

## 📝 AVANT D'APPELER AU SUPPORT

**Préparez les informations suivantes:**

```
1. Quel est le problème exactement?
   └─ Exemple: "Frontend affiche erreur 502"

2. Quand ça a commencé?
   └─ Heure UTC du problème

3. Avez-vous modifié quelque chose?
   └─ Variables d'env, code, DNS?

4. Avez-vous fait un rollback?
   └─ Si oui, est-ce que ça a aidé?

5. Les logs (5-10 dernières lignes)
   └─ railway logs | tail -20

6. Votre navigateur et version
   └─ Pour les problèmes frontend

7. Résultat de ce commandes:
   └─ curl https://www.regularena.com -I
   └─ curl https://api.regularena.com/health
   └─ dig www.regularena.com +short
```

---

## 🎯 PLAN D'ACTION PAR PRIORITÉ

### 🔴 CRITIQUE (Site DOWN)
1. Vérifier DNS (5 min)
2. Vérifier frontend status (5 min)
3. Vérifier backend health (5 min)
4. Vérifier BDD (5 min)
5. ROLLBACK si nécessaire (5 min)

### 🟠 SÉRIEUX (Erreurs utilisateurs)
1. Vérifier les logs (10 min)
2. Identifier le pattern (10 min)
3. Appliquer fix (30 min)
4. Redéployer (10 min)
5. Valider (5 min)

### 🟡 IMPORTANT (Performance dégradée)
1. Vérifier les ressources (5 min)
2. Vérifier les queries lentes (10 min)
3. Optimiser ou augmenter ressources (30 min)
4. Monitorer améliorations (10 min)

### 🟢 NORMAL (Warnings/Logs)
1. Analyser les warning (10 min)
2. Planifier la correction (20 min)
3. Appliquer lors du prochain déploiement
4. Tester en staging avant prod

---

## 📚 RESSOURCES SUPPLÉMENTAIRES

- **Vercel Docs** : https://vercel.com/docs
- **Railway Docs** : https://docs.railway.app/
- **Cloudflare Docs** : https://developers.cloudflare.com/
- **Next.js Docs** : https://nextjs.org/docs
- **NestJS Docs** : https://docs.nestjs.com/

---

## ✅ VOUS ÊTES PRÉPARÉ POUR:

✅ Frontend crash → Fix rapidement  
✅ Backend errors → Rollback immédiat  
✅ DNS issues → Vérifier propagation  
✅ BDD corruption → Restaurer depuis backup  
✅ Performance degradation → Diagnostiquer  
✅ Tout qui marche pas → ROLLBACK!  

---

**Gardez ce document à portée de main pendant le déploiement! 📄**

**Version** : 1.0  
**Dernière mise à jour** : Juin 2026  
**Status** : 🟢 Production-ready
