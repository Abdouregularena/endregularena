#!/bin/bash
# ─────────────────────────────────────────────
# install-security.sh — REGUL ARENA Security Patch
# Exécuter à la racine du projet : bash install-security.sh
# ─────────────────────────────────────────────
set -e

echo "🔐 Installation des dépendances sécurité..."
npm install helmet express-rate-limit cors --save

echo ""
echo "✅ Packages installés :"
echo "   - helmet         (security headers)"
echo "   - express-rate-limit  (brute-force protection)"
echo "   - cors           (whitelist origins)"
echo ""
echo "📋 Vérification dans package.json :"
node -e "const p=require('./package.json'); ['helmet','express-rate-limit','cors'].forEach(d => console.log('  '+d+':', p.dependencies[d] || '❌ ABSENT'))"
echo ""
echo "➡️  Étape suivante : insérer le contenu de security-block.js dans index.js"
echo "    (voir instructions ci-dessous)"
