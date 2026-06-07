#!/bin/bash

#########################################################################
# ✅ SCRIPT DE VALIDATION PRÉ-DÉPLOIEMENT
# Regularena Pro UEMOA → www.regularena.com
#########################################################################

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Variables
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DOMAIN="www.regularena.com"
API_DOMAIN="api.regularena.com"
REPORT_FILE="pre-deployment-check-$(date +%Y%m%d-%H%M%S).txt"

# Score du rapport
TOTAL_CHECKS=0
PASSED_CHECKS=0

# Fonction de logging
log() {
    echo -e "${BLUE}[${TIMESTAMP}]${NC} $1" | tee -a "$REPORT_FILE"
}

pass() {
    ((PASSED_CHECKS++))
    ((TOTAL_CHECKS++))
    echo -e "${GREEN}✅ PASS${NC}: $1" | tee -a "$REPORT_FILE"
}

fail() {
    ((TOTAL_CHECKS++))
    echo -e "${RED}❌ FAIL${NC}: $1" | tee -a "$REPORT_FILE"
}

warn() {
    ((TOTAL_CHECKS++))
    echo -e "${YELLOW}⚠️  WARN${NC}: $1" | tee -a "$REPORT_FILE"
}

section_header() {
    echo "" | tee -a "$REPORT_FILE"
    echo "╔════════════════════════════════════════════════════════════╗" | tee -a "$REPORT_FILE"
    echo "║ $1" | tee -a "$REPORT_FILE"
    echo "╚════════════════════════════════════════════════════════════╝" | tee -a "$REPORT_FILE"
}

#########################################################################
# SECTION 1: VÉRIFICATIONS DE L'INFRASTRUCTURE
#########################################################################

check_infrastructure() {
    section_header "1. VÉRIFICATIONS DE L'INFRASTRUCTURE"

    log "Vérification des outils installés..."

    # Railway CLI
    if command -v railway &> /dev/null; then
        RAILWAY_VERSION=$(railway --version 2>/dev/null)
        pass "Railway CLI: $RAILWAY_VERSION"
    else
        fail "Railway CLI: Non installé (npm install -g railway-cli)"
    fi

    # Vercel CLI
    if command -v vercel &> /dev/null; then
        VERCEL_VERSION=$(vercel --version 2>/dev/null)
        pass "Vercel CLI: $VERCEL_VERSION"
    else
        fail "Vercel CLI: Non installé (npm install -g vercel-cli)"
    fi

    # Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version 2>/dev/null)
        pass "Docker: $DOCKER_VERSION"
    else
        warn "Docker: Non installé (optionnel)"
    fi

    # Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        pass "Node.js: $NODE_VERSION"
    else
        fail "Node.js: Non installé (requis)"
    fi

    # NPM
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        pass "NPM: $NPM_VERSION"
    else
        fail "NPM: Non installé (requis)"
    fi

    # Git
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version)
        pass "Git: $GIT_VERSION"
    else
        fail "Git: Non installé (requis)"
    fi

    # jq
    if command -v jq &> /dev/null; then
        pass "jq: Installé"
    else
        warn "jq: Non installé (pour parsing JSON)"
    fi

    # Curl
    if command -v curl &> /dev/null; then
        pass "curl: Installé"
    else
        fail "curl: Non installé (requis)"
    fi
}

#########################################################################
# SECTION 2: VÉRIFICATIONS DES COMPTES CLOUD
#########################################################################

check_cloud_accounts() {
    section_header "2. VÉRIFICATIONS DES COMPTES CLOUD"

    log "Vérification de la connexion aux services cloud..."

    # Railway
    if railway projects &> /dev/null; then
        pass "Railway: Connecté"
    else
        fail "Railway: Non connecté (railway login)"
    fi

    # Vercel
    if vercel whoami &> /dev/null; then
        VERCEL_USER=$(vercel whoami 2>/dev/null)
        pass "Vercel: Connecté ($VERCEL_USER)"
    else
        fail "Vercel: Non connecté (vercel login)"
    fi

    # Internet
    if curl -s https://api.github.com > /dev/null; then
        pass "Connexion Internet: OK"
    else
        fail "Connexion Internet: Impossible"
    fi

    # DNS
    if nslookup google.com &> /dev/null; then
        pass "DNS: Résolveur DNS fonctionnel"
    else
        warn "DNS: Vérifier la configuration"
    fi
}

#########################################################################
# SECTION 3: VÉRIFICATIONS DU CODE
#########################################################################

check_code() {
    section_header "3. VÉRIFICATIONS DU CODE"

    log "Vérification du code source..."

    # Structure des dossiers
    if [ -d "frontend" ]; then
        pass "Dossier frontend: Trouvé"
    else
        fail "Dossier frontend: Non trouvé"
    fi

    if [ -d "backend" ]; then
        pass "Dossier backend: Trouvé"
    else
        fail "Dossier backend: Non trouvé"
    fi

    # Package.json
    if [ -f "frontend/package.json" ]; then
        pass "Frontend package.json: Trouvé"
    else
        fail "Frontend package.json: Non trouvé"
    fi

    if [ -f "backend/package.json" ]; then
        pass "Backend package.json: Trouvé"
    else
        fail "Backend package.json: Non trouvé"
    fi

    # .env files
    if [ -f "frontend/.env.example" ] || [ -f "frontend/.env.local" ]; then
        pass "Frontend .env: Configuré"
    else
        warn "Frontend .env: À configurer"
    fi

    if [ -f "backend/.env.example" ] || [ -f "backend/.env" ]; then
        pass "Backend .env: Configuré"
    else
        warn "Backend .env: À configurer"
    fi

    # Git
    if [ -d ".git" ]; then
        pass "Git: Repositorium initialisé"
        GIT_REMOTE=$(git config --get remote.origin.url 2>/dev/null || echo "Non configuré")
        log "Git remote: $GIT_REMOTE"
    else
        warn "Git: Non initialisé (git init)"
    fi
}

#########################################################################
# SECTION 4: VÉRIFICATIONS DES DÉPENDANCES
#########################################################################

check_dependencies() {
    section_header "4. VÉRIFICATIONS DES DÉPENDANCES"

    log "Vérification des dépendances npm..."

    # Frontend
    if [ -d "frontend/node_modules" ]; then
        pass "Frontend node_modules: Installé"
    else
        warn "Frontend node_modules: À installer (cd frontend && npm install)"
    fi

    # Backend
    if [ -d "backend/node_modules" ]; then
        pass "Backend node_modules: Installé"
    else
        warn "Backend node_modules: À installer (cd backend && npm install)"
    fi

    # Dépendances critiques (vérifier dans package.json)
    if grep -q "\"next\":" frontend/package.json 2>/dev/null; then
        pass "Frontend: Next.js configuré"
    else
        warn "Frontend: Next.js non trouvé"
    fi

    if grep -q "\"@nestjs/common\":" backend/package.json 2>/dev/null; then
        pass "Backend: NestJS configuré"
    else
        warn "Backend: NestJS non trouvé"
    fi
}

#########################################################################
# SECTION 5: VÉRIFICATIONS DE CONNECTIVITÉ
#########################################################################

check_connectivity() {
    section_header "5. VÉRIFICATIONS DE CONNECTIVITÉ"

    log "Vérification de la connectivité des services..."

    # Domaine existant
    CURRENT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://www.regularena.com" 2>/dev/null || echo "000")
    if [ "$CURRENT_STATUS" = "200" ]; then
        pass "Domaine actuel (www.regularena.com): HTTP $CURRENT_STATUS"
    else
        warn "Domaine actuel: HTTP $CURRENT_STATUS (peut être en maintenance)"
    fi

    # API existante
    API_CURRENT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://api.regularena.com/health" 2>/dev/null || echo "000")
    if [ "$API_CURRENT_STATUS" = "200" ]; then
        pass "API actuelle (api.regularena.com): HTTP $API_CURRENT_STATUS"
    else
        warn "API actuelle: HTTP $API_CURRENT_STATUS"
    fi

    # Vérifier le staging (si déployé)
    STAGING_CHECK=$(curl -s -I "https://regularena-pro.vercel.app" 2>/dev/null | head -1)
    if echo "$STAGING_CHECK" | grep -q "200\|301\|302"; then
        pass "Staging Vercel: Accessible"
    else
        warn "Staging Vercel: Non accessible (à déployer)"
    fi

    # DNS actuel
    DNS_CHECK=$(dig www.regularena.com +short 2>/dev/null | tail -1)
    if [ ! -z "$DNS_CHECK" ]; then
        pass "DNS: www.regularena.com → $DNS_CHECK"
    else
        warn "DNS: Non résolvable (peut être offline)"
    fi

    # API DNS
    API_DNS_CHECK=$(dig api.regularena.com +short 2>/dev/null | tail -1)
    if [ ! -z "$API_DNS_CHECK" ]; then
        pass "DNS: api.regularena.com → $API_DNS_CHECK"
    else
        warn "DNS: api non résolvable"
    fi
}

#########################################################################
# SECTION 6: VÉRIFICATIONS DE SÉCURITÉ
#########################################################################

check_security() {
    section_header "6. VÉRIFICATIONS DE SÉCURITÉ"

    log "Vérification de la configuration de sécurité..."

    # Variables d'env sensibles
    if grep -q "JWT_SECRET" backend/.env 2>/dev/null; then
        pass "JWT_SECRET: Configuré"
    else
        warn "JWT_SECRET: Non configuré (obligatoire en prod)"
    fi

    if grep -q "SENDGRID_API_KEY" backend/.env 2>/dev/null; then
        pass "SENDGRID_API_KEY: Configuré"
    else
        warn "SENDGRID_API_KEY: Non configuré (optionnel)"
    fi

    if grep -q "DATABASE_URL" backend/.env 2>/dev/null; then
        pass "DATABASE_URL: Configuré"
    else
        warn "DATABASE_URL: Non configuré (obligatoire)"
    fi

    # .env dans gitignore
    if grep -q ".env" .gitignore 2>/dev/null; then
        pass ".gitignore: .env ignoré"
    else
        warn ".gitignore: Ajouter .env pour éviter les fuites de secrets"
    fi

    # SSL/TLS (vérifier via curl)
    SSL_CHECK=$(curl -s -I "https://www.regularena.com" 2>/dev/null | grep -i "Strict-Transport-Security" || echo "")
    if [ ! -z "$SSL_CHECK" ]; then
        pass "SSL: HSTS configuré"
    else
        warn "SSL: Vérifier la configuration HSTS"
    fi

    # Secrets en .env (pas en JSON)
    if [ ! -f "secrets.json" ]; then
        pass "Secrets: Pas de fichier secrets.json en root"
    else
        warn "Secrets: secrets.json trouvé (doit être .gitignored)"
    fi
}

#########################################################################
# SECTION 7: VÉRIFICATIONS DE CONFIGURATION
#########################################################################

check_configuration() {
    section_header "7. VÉRIFICATIONS DE CONFIGURATION"

    log "Vérification de la configuration..."

    # Vercel config
    if [ -f "frontend/vercel.json" ]; then
        pass "Frontend: vercel.json existe"
    else
        warn "Frontend: vercel.json manquant"
    fi

    # Railway config
    if [ -f "railway.json" ]; then
        pass "Backend: railway.json existe"
    else
        warn "Backend: railway.json manquant"
    fi

    # Prisma config (pour BDD)
    if [ -f "backend/prisma/schema.prisma" ]; then
        pass "Backend: Prisma schema existe"
    else
        warn "Backend: Prisma schema manquant"
    fi

    # API spec
    if [ -f "REGULARENA_API_SPEC.md" ]; then
        pass "Documentation: API spec trouvée"
    else
        warn "Documentation: API spec manquante"
    fi

    # Architecture doc
    if [ -f "REGULARENA_PRO_UEMOA_ARCHITECTURE.md" ]; then
        pass "Documentation: Architecture doc trouvée"
    else
        warn "Documentation: Architecture doc manquante"
    fi
}

#########################################################################
# SECTION 8: BUILD & TESTS
#########################################################################

check_builds() {
    section_header "8. VÉRIFICATIONS BUILD & TESTS"

    log "Vérification des builds locaux..."

    # Frontend build
    if confirm "Tester le build frontend? (peut prendre 2-3 min)"; then
        cd frontend
        if npm run build &> /dev/null; then
            pass "Frontend build: Succès"
        else
            fail "Frontend build: Échec"
        fi
        cd ..
    else
        warn "Frontend build: Test sauté"
    fi

    # Backend build
    if confirm "Tester le build backend? (peut prendre 1-2 min)"; then
        cd backend
        if npm run build &> /dev/null; then
            pass "Backend build: Succès"
        else
            fail "Backend build: Échec"
        fi
        cd ..
    else
        warn "Backend build: Test sauté"
    fi

    # Tests unitaires
    if [ -f "frontend/jest.config.js" ]; then
        warn "Frontend: Tests unitaires configurés (à exécuter)"
    fi

    if [ -f "backend/jest.config.js" ]; then
        warn "Backend: Tests unitaires configurés (à exécuter)"
    fi
}

#########################################################################
# SECTION 9: CHECKLIST PRÉ-DÉPLOIEMENT
#########################################################################

checklist() {
    section_header "9. CHECKLIST PRÉ-DÉPLOIEMENT"

    items=(
        "Tous les comptes cloud créés (Vercel, Railway, Cloudflare)"
        "Code poussé sur Git (repository primaire)"
        "Variables d'environnement configurées"
        "Base de données migrée et seedée"
        "Tests locaux réussis"
        "Backups complètes effectuées"
        "Plan de rollback validé"
        "Équipe notifiée du déploiement"
        "Fenêtre de déploiement confirmée (heure creuse)"
        "Support client en attente"
    )

    echo "" | tee -a "$REPORT_FILE"
    for item in "${items[@]}"; do
        read -p "✓ $item? (y/n): " -r response
        if [[ $response =~ ^[Yy]$ ]]; then
            ((PASSED_CHECKS++))
            echo -e "${GREEN}✓ $item${NC}" | tee -a "$REPORT_FILE"
        else
            echo -e "${YELLOW}✗ $item${NC}" | tee -a "$REPORT_FILE"
        fi
        ((TOTAL_CHECKS++))
    done
}

#########################################################################
# RÉSUMÉ ET RECOMMANDATIONS
#########################################################################

generate_report() {
    section_header "RÉSUMÉ DU RAPPORT"

    PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

    echo "" | tee -a "$REPORT_FILE"
    echo "Checks réussis: $PASSED_CHECKS/$TOTAL_CHECKS ($PERCENTAGE%)" | tee -a "$REPORT_FILE"
    echo "" | tee -a "$REPORT_FILE"

    if [ $PERCENTAGE -ge 90 ]; then
        echo -e "${GREEN}✅ STATUS: PRÊT POUR DÉPLOIEMENT${NC}" | tee -a "$REPORT_FILE"
    elif [ $PERCENTAGE -ge 70 ]; then
        echo -e "${YELLOW}⚠️  STATUS: PRESQUE PRÊT (résoudre les warnings)${NC}" | tee -a "$REPORT_FILE"
    else
        echo -e "${RED}❌ STATUS: NON PRÊT (corriger les erreurs d'abord)${NC}" | tee -a "$REPORT_FILE"
    fi

    echo "" | tee -a "$REPORT_FILE"
    echo "Rapport sauvegardé: $REPORT_FILE" | tee -a "$REPORT_FILE"
}

#########################################################################
# FONCTION HELPER
#########################################################################

confirm() {
    local prompt="$1"
    local response
    read -p "$(echo -e ${YELLOW}${prompt}${NC}) (y/n): " -r response
    [[ $response =~ ^[Yy]$ ]]
}

#########################################################################
# MAIN
#########################################################################

main() {
    clear
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  ✅ PRE-DEPLOYMENT VALIDATION CHECK                       ║"
    echo "║     Regularena Pro UEMOA → www.regularena.com             ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""

    log "Démarrage du rapport de validation..."
    log "Report: $REPORT_FILE"

    check_infrastructure
    check_cloud_accounts
    check_code
    check_dependencies
    check_connectivity
    check_security
    check_configuration
    check_builds
    checklist
    generate_report

    echo ""
    echo "════════════════════════════════════════════════════════════"
    if [ $PERCENTAGE -ge 90 ]; then
        echo -e "${GREEN}🎉 Vous êtes prêt pour le déploiement!${NC}"
        echo ""
        echo "Prochaines étapes:"
        echo "1. ./migrate.sh"
        echo "2. Configurer Cloudflare DNS"
        echo "3. Basculer le DNS vers la nouvelle infra"
        echo "4. Monitorer pendant 24-48h"
    elif [ $PERCENTAGE -ge 70 ]; then
        echo -e "${YELLOW}⚠️  Résoudre les warnings avant de déployer${NC}"
    else
        echo -e "${RED}❌ Corriger les erreurs avant de déployer${NC}"
    fi
    echo "════════════════════════════════════════════════════════════"
}

# Exécuter
main
