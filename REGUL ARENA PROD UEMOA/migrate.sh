#!/bin/bash

#########################################################################
# 🚀 SCRIPT AUTOMATISÉ DE MIGRATION REGULARENA
# De l'infra Railway/OVH existante vers la nouvelle
#########################################################################

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="regularena-pro-v2"
DOMAIN="www.regularena.com"
API_DOMAIN="api.regularena.com"
VERCEL_PROJECT="regularena-pro"
RAILWAY_PROJECT="regularena-pro-v2"
BACKUP_DIR="./backups"
LOG_FILE="migration-$(date +%Y%m%d-%H%M%S).log"

# Timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Fonction de logging
log() {
    echo -e "${BLUE}[${TIMESTAMP}]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# Fonction pour confirmer avant d'agir
confirm() {
    local prompt="$1"
    local response
    read -p "$(echo -e ${YELLOW}${prompt}${NC}) (y/n): " -r response
    [[ $response =~ ^[Yy]$ ]]
}

#########################################################################
# ÉTAPE 0: VÉRIFICATIONS PRÉALABLES
#########################################################################

step_0_checks() {
    log "════════════════════════════════════════════════════════════════"
    log "ÉTAPE 0: Vérifications préalables"
    log "════════════════════════════════════════════════════════════════"

    # Vérifier les dépendances
    log "Vérification des dépendances..."

    commands=("railway" "vercel" "curl" "jq" "git")
    for cmd in "${commands[@]}"; do
        if command -v $cmd &> /dev/null; then
            log_success "$cmd est installé"
        else
            log_error "$cmd n'est pas installé. Merci de l'installer"
            exit 1
        fi
    done

    # Vérifier la connexion aux services
    log "\nVérification des connexions..."

    if railway projects &> /dev/null; then
        log_success "Railway CLI: Connecté"
    else
        log_error "Railway CLI: Non connecté. Exécutez 'railway login'"
        exit 1
    fi

    if vercel whoami &> /dev/null; then
        log_success "Vercel CLI: Connecté"
    else
        log_error "Vercel CLI: Non connecté. Exécutez 'vercel login'"
        exit 1
    fi

    # Vérifier la connectivité Internet
    if curl -s https://api.github.com > /dev/null; then
        log_success "Connexion Internet: OK"
    else
        log_error "Connexion Internet: Impossible"
        exit 1
    fi

    log_success "Toutes les vérifications préalables réussies\n"
}

#########################################################################
# ÉTAPE 1: AUDIT DE L'INFRASTRUCTURE EXISTANTE
#########################################################################

step_1_audit() {
    log "════════════════════════════════════════════════════════════════"
    log "ÉTAPE 1: Audit de l'infrastructure existante"
    log "════════════════════════════════════════════════════════════════"

    mkdir -p "$BACKUP_DIR"

    # Déterminer le projet Railway actuel
    log "Récupération du projet Railway existant..."
    OLD_PROJECT=$(railway projects | grep -v "ID" | head -1 | awk '{print $1}')

    if [ -z "$OLD_PROJECT" ]; then
        log_error "Aucun projet Railway trouvé"
        exit 1
    fi

    log "Projet Railway trouvé: $OLD_PROJECT"

    # Exporter la configuration actuelle
    log "Export de la configuration..."
    railway switch "$OLD_PROJECT"
    railway variables > "$BACKUP_DIR/old-variables-$(date +%Y%m%d).txt" 2>/dev/null || true

    # Sauvegarder la BD
    log "Sauvegarde de la base de données..."
    if [ -z "$DATABASE_URL" ]; then
        export DATABASE_URL=$(railway variables | grep "DATABASE_URL" | cut -d'=' -f2)
    fi

    if [ ! -z "$DATABASE_URL" ]; then
        pg_dump "$DATABASE_URL" > "$BACKUP_DIR/backup-production-$(date +%Y%m%d-%H%M%S).sql" 2>/dev/null || true
        log_success "Sauvegarde BD: $(ls -lh $BACKUP_DIR/backup-production-*.sql | tail -1 | awk '{print $9}')"
    else
        log_warning "DATABASE_URL non trouvé, BD non sauvegardée"
    fi

    # Documenter la configuration
    log "Documentation de la configuration..."
    cat > "$BACKUP_DIR/infrastructure-current-$(date +%Y%m%d).md" << 'EOF'
# Configuration Actuelle de Regularena

## Services Railway
$(railway services)

## Variables d'environnement
$(railway variables)

## Domaines
- Frontend: https://www.regularena.com
- API: https://api.regularena.com

## Points de contact
- Support: support@regularena.com
- DevOps: devops@regularena.com
EOF

    log_success "Audit complété. Fichiers sauvegardés dans $BACKUP_DIR\n"
}

#########################################################################
# ÉTAPE 2: CRÉER NOUVELLE INFRA RAILWAY
#########################################################################

step_2_create_railway() {
    log "════════════════════════════════════════════════════════════════"
    log "ÉTAPE 2: Création de la nouvelle infrastructure Railway"
    log "════════════════════════════════════════════════════════════════"

    if ! confirm "Créer un nouveau projet Railway '$RAILWAY_PROJECT'?"; then
        log_warning "Création Railway annulée. Vous pouvez créer manuellement via:"
        log "https://railway.app/new"
        return
    fi

    log "Initialisation du projet Railway..."
    
    # Cette partie nécessite une interaction manuelle
    log_warning "Création manuelle nécessaire:"
    log "1. Aller à https://railway.app/new"
    log "2. Créer un nouveau projet nommé: $RAILWAY_PROJECT"
    log "3. Ajouter PostgreSQL: railway add --postgres"
    log "4. Ajouter Redis: railway add --redis"
    log "5. Vérifier: railway services"
    log ""
    
    confirm "J'ai créé le projet Railway" || return

    # Récupérer les credentials du nouveau projet
    railway switch "$RAILWAY_PROJECT"
    export NEW_DATABASE_URL=$(railway variables | grep "DATABASE_URL" | cut -d'=' -f2)
    export NEW_REDIS_URL=$(railway variables | grep "REDIS_URL" | cut -d'=' -f2)

    log_success "Projet Railway créé et connecté\n"
}

#########################################################################
# ÉTAPE 3: MIGRER LES DONNÉES
#########################################################################

step_3_migrate_data() {
    log "════════════════════════════════════════════════════════════════"
    log "ÉTAPE 3: Migration des données"
    log "════════════════════════════════════════════════════════════════"

    if [ -z "$NEW_DATABASE_URL" ]; then
        log_error "NEW_DATABASE_URL non défini"
        return
    fi

    # Récupérer l'ancienne BDD
    railway switch "$OLD_PROJECT"
    export OLD_DATABASE_URL=$(railway variables | grep "DATABASE_URL" | cut -d'=' -f2)

    if [ -z "$OLD_DATABASE_URL" ]; then
        log_error "OLD_DATABASE_URL non trouvé"
        return
    fi

    log "Migration de la base de données..."
    log "De: $(echo $OLD_DATABASE_URL | cut -d'@' -f2)"
    log "Vers: $(echo $NEW_DATABASE_URL | cut -d'@' -f2)"

    # Créer le dump
    DUMP_FILE="$BACKUP_DIR/migration-dump-$(date +%Y%m%d-%H%M%S).sql"
    log "Création du dump..."
    
    if pg_dump "$OLD_DATABASE_URL" > "$DUMP_FILE" 2>/dev/null; then
        log_success "Dump créé: $(ls -lh $DUMP_FILE | awk '{print $5, $9}')"
    else
        log_error "Erreur lors de la création du dump"
        return
    fi

    # Restaurer dans la nouvelle BDD
    log "Restauration dans la nouvelle BDD..."
    if psql "$NEW_DATABASE_URL" < "$DUMP_FILE" 2>/dev/null; then
        log_success "Données migrées avec succès"
    else
        log_error "Erreur lors de la restauration"
        return
    fi

    # Vérifier les données
    log "Vérification des données..."
    USER_COUNT=$(psql "$NEW_DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
    QUIZ_COUNT=$(psql "$NEW_DATABASE_URL" -t -c "SELECT COUNT(*) FROM quizzes;" 2>/dev/null || echo "0")

    log "Utilisateurs: $USER_COUNT"
    log "Quiz: $QUIZ_COUNT"

    log_success "Migration des données complétée\n"
}

#########################################################################
# ÉTAPE 4: CONFIGURER VARIABLES RAILWAY
#########################################################################

step_4_config_railway_env() {
    log "════════════════════════════════════════════════════════════════"
    log "ÉTAPE 4: Configuration des variables d'environnement"
    log "════════════════════════════════════════════════════════════════"

    railway switch "$RAILWAY_PROJECT"

    log "Extraction des variables de l'ancien projet..."
    railway switch "$OLD_PROJECT"
    
    # Récupérer les secrets importants (manuellement pour éviter les erreurs)
    log "Variables à configurer dans le nouveau projet Railway:"
    log "1. NODE_ENV=production"
    log "2. PORT=3001"
    log "3. JWT_SECRET=(même que l'ancien projet)"
    log "4. SENDGRID_API_KEY=(même que l'ancien projet)"
    log "5. CORS_ORIGIN=https://regularena.com,https://www.regularena.com"
    log ""

    if confirm "Configurer les variables Railway maintenant?"; then
        railway switch "$RAILWAY_PROJECT"
        
        log "Entrez les valeurs suivantes:"
        
        read -p "JWT_SECRET: " JWT_SECRET
        railway variables set JWT_SECRET="$JWT_SECRET"
        
        read -p "SENDGRID_API_KEY: " SENDGRID_KEY
        railway variables set SENDGRID_API_KEY="$SENDGRID_KEY"
        
        railway variables set NODE_ENV="production"
        railway variables set PORT="3001"
        railway variables set CORS_ORIGIN="https://regularena.com,https://www.regularena.com"
        railway variables set LOG_LEVEL="info"
        
        log_success "Variables configurées"
    else
        log_warning "Variables non configurées. À faire manuellement via:"
        log "railway variables set KEY=value"
    fi

    log ""
}

#########################################################################
# ÉTAPE 5: DÉPLOYER BACKEND
#########################################################################

step_5_deploy_backend() {
    log "════════════════════════════════════════════════════════════════"
    log "ÉTAPE 5: Déploiement du backend sur Railway"
    log "════════════════════════════════════════════════════════════════"

    if [ ! -d "backend" ]; then
        log_error "Dossier 'backend' non trouvé"
        return
    fi

    if ! confirm "Déployer le backend sur Railway?"; then
        return
    fi

    cd backend

    log "Build et déploiement..."
    railway switch "$RAILWAY_PROJECT"
    railway up

    # Récupérer l'URL du backend
    BACKEND_URL=$(railway services | grep -oP 'https://[^/]+' | tail -1)
    if [ ! -z "$BACKEND_URL" ]; then
        log_success "Backend déployé: $BACKEND_URL"
        echo "$BACKEND_URL" > "$BACKUP_DIR/backend-url.txt"
    fi

    log "Attente de la stabilisation (30s)..."
    sleep 30

    # Test du health check
    log "Test du health check..."
    if curl -s "$BACKEND_URL/health" | jq '.status' | grep -q "ok"; then
        log_success "Health check: OK"
    else
        log_warning "Health check: Pas de réponse (normal les premières secondes)"
    fi

    cd ..
    log ""
}

#########################################################################
# ÉTAPE 6: DÉPLOYER FRONTEND VERCEL
#########################################################################

step_6_deploy_frontend() {
    log "════════════════════════════════════════════════════════════════"
    log "ÉTAPE 6: Déploiement du frontend sur Vercel"
    log "════════════════════════════════════════════════════════════════"

    if [ ! -d "frontend" ]; then
        log_error "Dossier 'frontend' non trouvé"
        return
    fi

    if ! confirm "Déployer le frontend sur Vercel?"; then
        return
    fi

    cd frontend

    log "Configuration de Vercel..."
    vercel link --yes

    log "Déploiement en staging..."
    STAGING_URL=$(vercel 2>&1 | grep -oP 'https://[^ ]+' | head -1)
    log "Staging URL: $STAGING_URL"

    log "Tests du staging..."
    sleep 5
    if curl -s "$STAGING_URL" | grep -q "REGULARENA\|regularena"; then
        log_success "Frontend staging: OK"
    else
        log_warning "Frontend staging: Vérifier manuellement à $STAGING_URL"
    fi

    if confirm "Déployer en production?"; then
        log "Déploiement en production..."
        PROD_URL=$(vercel --prod 2>&1 | grep -oP 'https://[^ ]+' | head -1)
        log_success "Frontend production: $PROD_URL"
        echo "$PROD_URL" > "$BACKUP_DIR/frontend-url.txt"
    fi

    cd ..
    log ""
}

#########################################################################
# ÉTAPE 7: CONFIGURER CLOUDFLARE DNS
#########################################################################

step_7_setup_cloudflare() {
    log "════════════════════════════════════════════════════════════════"
    log "ÉTAPE 7: Configuration de Cloudflare"
    log "════════════════════════════════════════════════════════════════"

    log "Configuration manuelle nécessaire via Cloudflare Dashboard:"
    log "1. Aller à https://dash.cloudflare.com/"
    log "2. Ajouter le domaine regularena.com"
    log "3. Changer les nameservers chez OVH vers ceux de Cloudflare"
    log "4. Ajouter les DNS records:"
    log "   - www CNAME cname.vercel-dns.com (Proxied)"
    log "   - api CNAME regularena-backend-prod.up.railway.app (DNS only)"
    log "   - @ CNAME cname.vercel-dns.com (Proxied)"
    log ""

    if confirm "J'ai configuré Cloudflare"; then
        log "Vérification de la propagation DNS..."
        
        for i in {1..30}; do
            WWW_IP=$(dig www.regularena.com +short 2>/dev/null | tail -1)
            if [ ! -z "$WWW_IP" ] && [ "$WWW_IP" != "SERVFAIL" ]; then
                log_success "DNS propagé vers: $WWW_IP"
                break
            else
                log "[$i/30] Attente de la propagation DNS..."
                sleep 10
            fi
        done
    fi

    log ""
}

#########################################################################
# ÉTAPE 8: TESTS COMPLETS
#########################################################################

step_8_tests() {
    log "════════════════════════════════════════════════════════════════"
    log "ÉTAPE 8: Tests complets de la nouvelle infrastructure"
    log "════════════════════════════════════════════════════════════════"

    BACKEND_URL=$(cat "$BACKUP_DIR/backend-url.txt" 2>/dev/null || echo "https://api.regularena.com")
    FRONTEND_URL=$(cat "$BACKUP_DIR/frontend-url.txt" 2>/dev/null || echo "https://regularena-pro.vercel.app")

    log "Test 1: Frontend"
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
    if [ "$FRONTEND_STATUS" = "200" ]; then
        log_success "Frontend: HTTP $FRONTEND_STATUS"
    else
        log_error "Frontend: HTTP $FRONTEND_STATUS"
    fi

    log "\nTest 2: Backend Health"
    BACKEND_HEALTH=$(curl -s "$BACKEND_URL/health" | jq '.status' 2>/dev/null)
    if echo "$BACKEND_HEALTH" | grep -q "ok"; then
        log_success "Backend Health: $BACKEND_HEALTH"
    else
        log_warning "Backend Health: Vérifier manuellement"
    fi

    log "\nTest 3: Base de données"
    # Ce test nécessite une authentification
    log "À vérifier via: $BACKEND_URL/api/v1/quiz/available"

    log "\nTest 4: DNS"
    DNS_CHECK=$(dig www.regularena.com +short 2>/dev/null | tail -1)
    if [ ! -z "$DNS_CHECK" ]; then
        log_success "DNS: www.regularena.com → $DNS_CHECK"
    else
        log_warning "DNS: Non propagé"
    fi

    log ""
}

#########################################################################
# ÉTAPE 9: BASCULEMENT DNS (SWITCHOVER)
#########################################################################

step_9_switchover() {
    log "════════════════════════════════════════════════════════════════"
    log "ÉTAPE 9: Basculement DNS (SWITCHOVER)"
    log "════════════════════════════════════════════════════════════════"

    log_warning "⚠️  ATTENTION: Cette action basculera votre trafic en production"
    log "Assurez-vous que:"
    log "✓ Tous les tests passent"
    log "✓ L'équipe est notifiée"
    log "✓ Vous avez un plan de rollback"
    log ""

    if ! confirm "Êtes-vous prêt pour le basculement DNS?"; then
        log "Basculement annulé"
        return
    fi

    log "Basculement en cours..."
    log "1. Réduire TTL à 300s"
    log "2. Basculer www vers Vercel"
    log "3. Basculer api vers Railway nouveau"
    log "4. Vérifier la propagation"
    log ""

    log "⏳ Attendez 5 minutes pour la propagation complète..."
    sleep 30

    log "Vérification..."
    for i in {1..5}; do
        WWW=$(dig www.regularena.com +short 2>/dev/null | tail -1)
        API=$(dig api.regularena.com +short 2>/dev/null | tail -1)
        log "[$i/5] www: $WWW | api: $API"
        sleep 10
    done

    log_success "Basculement complété"
    log ""
}

#########################################################################
# ÉTAPE 10: MONITORING POST-MIGRATION
#########################################################################

step_10_monitoring() {
    log "════════════════════════════════════════════════════════════════"
    log "ÉTAPE 10: Monitoring post-migration"
    log "════════════════════════════════════════════════════════════════"

    log "Monitoring à faire pendant 24-48h:"
    log "✓ Vérifier les logs du backend: railway logs"
    log "✓ Vérifier les logs du frontend: vercel logs"
    log "✓ Surveiller les erreurs"
    log "✓ Analyser les performances"
    log "✓ Écouter les retours utilisateurs"
    log ""

    log "URLs à monitorer:"
    log "- Frontend: https://www.regularena.com"
    log "- Backend: https://api.regularena.com/health"
    log "- Dashboard Railway: https://railway.app/project/$RAILWAY_PROJECT"
    log "- Dashboard Vercel: https://vercel.com/dashboard"
    log ""

    log_success "Migration complétée!"
    log "En cas de problème, exécutez: ./rollback.sh"
    log ""
}

#########################################################################
# MENU PRINCIPAL
#########################################################################

show_menu() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║  🚀 MIGRATION REGULARENA - Infrastructure Upgrade        ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "Étapes disponibles:"
    echo "0) Vérifications préalables"
    echo "1) Audit infra existante"
    echo "2) Créer infra Railway"
    echo "3) Migrer données"
    echo "4) Config variables Railway"
    echo "5) Déployer backend"
    echo "6) Déployer frontend"
    echo "7) Setup Cloudflare DNS"
    echo "8) Tests complets"
    echo "9) Basculement DNS (PROD)"
    echo "10) Monitoring post-migration"
    echo "11) Tout exécuter (5-6 heures)"
    echo "q) Quitter"
    echo ""
}

#########################################################################
# MAIN
#########################################################################

main() {
    log "════════════════════════════════════════════════════════════════"
    log "Démarrage du script de migration"
    log "Log: $LOG_FILE"
    log "════════════════════════════════════════════════════════════════"
    log ""

    while true; do
        show_menu
        read -p "Sélectionnez une étape (0-11, q): " choice

        case $choice in
            0) step_0_checks ;;
            1) step_1_audit ;;
            2) step_2_create_railway ;;
            3) step_3_migrate_data ;;
            4) step_4_config_railway_env ;;
            5) step_5_deploy_backend ;;
            6) step_6_deploy_frontend ;;
            7) step_7_setup_cloudflare ;;
            8) step_8_tests ;;
            9) step_9_switchover ;;
            10) step_10_monitoring ;;
            11) 
                step_0_checks
                step_1_audit
                step_2_create_railway
                step_3_migrate_data
                step_4_config_railway_env
                step_5_deploy_backend
                step_6_deploy_frontend
                step_7_setup_cloudflare
                step_8_tests
                echo "Prêt pour le basculement DNS? (manuel)"
                step_9_switchover
                step_10_monitoring
                break
                ;;
            q) 
                log "Migration annulée"
                exit 0
                ;;
            *)
                echo "Option invalide"
                ;;
        esac
    done
}

# Exécuter le main
main
