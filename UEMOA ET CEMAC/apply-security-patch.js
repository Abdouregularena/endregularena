#!/usr/bin/env node
// ─────────────────────────────────────────────────────────
// apply-security-patch.js
// Exécuter : node apply-security-patch.js
// ─────────────────────────────────────────────────────────
// Ce script lit index.js, insère le bloc sécurité juste APRÈS
// la ligne "app.use(express.json())" ou "const app = express()"
// puis écrit index.js.patched (sans toucher l'original).
// ─────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');

const TARGET = path.join(__dirname, 'index.js');
const BACKUP = path.join(__dirname, 'index.js.bak');
const OUTPUT = path.join(__dirname, 'index.js.patched');

if (!fs.existsSync(TARGET)) {
  console.error('❌ index.js introuvable dans ce dossier.');
  process.exit(1);
}

const src = fs.readFileSync(TARGET, 'utf8');

// Vérifier si le patch est déjà appliqué
if (src.includes('SECURITY BLOCK — REGUL ARENA')) {
  console.log('⚠️  Patch déjà appliqué. Rien à faire.');
  process.exit(0);
}

// ── Bloc sécurité à injecter ─────────────────────────────
const SECURITY_BLOCK = `
// ============================================================
// SECURITY BLOCK — REGUL ARENA — auto-patch
// ============================================================

const rateLimit = require('express-rate-limit');

// 1. HELMET — Security Headers
app.use(require('helmet')({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc:       ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:        ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc:         ["'self'", "data:", "https:"],
      connectSrc:     ["'self'",
                       "https://endregularena-production.up.railway.app",
                       "wss://endregularena-production.up.railway.app",
                       "wss://www.regularena.com"],
      frameSrc:       ["'none'"],
      objectSrc:      ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  noSniff:    true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: false,
}));

app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  next();
});

// 2. CORS — whitelist stricte
const _cors = require('cors');
const ALLOWED_ORIGINS = [
  'https://www.regularena.com',
  'https://regularena.com',
  'https://endregularena-production.up.railway.app',
];
app.use(_cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('CORS bloqué: ' + origin));
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));

// 3. RATE LIMITING
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 15, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
});
app.use('/auth/register', authLimiter);
app.use('/auth/login',    authLimiter);
app.use('/auth/resend',   authLimiter);

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false,
}));
app.use('/api/feedback', rateLimit({
  windowMs: 10 * 60 * 1000, max: 5,
  message: { error: 'Trop de feedbacks. Attendez 10 minutes.' },
}));

// ============================================================
// FIN SECURITY BLOCK
// ============================================================
`;

// ── Trouver le point d'injection ──────────────────────────
// Cherche la première ligne "app.use(express.json" ou "app.use(express.urlencoded"
// Si non trouvé, injecte juste après "const app = express()"

const lines = src.split('\n');
let insertIdx = -1;

// Priorité 1 : après express.json() / urlencoded()
for (let i = 0; i < lines.length; i++) {
  if (/app\.use\(express\.(json|urlencoded)/.test(lines[i])) {
    insertIdx = i + 1;
    break;
  }
}

// Priorité 2 : après "const app = express()"
if (insertIdx === -1) {
  for (let i = 0; i < lines.length; i++) {
    if (/const app\s*=\s*express\(\)/.test(lines[i])) {
      insertIdx = i + 1;
      break;
    }
  }
}

if (insertIdx === -1) {
  console.error('❌ Impossible de trouver le point d\'injection dans index.js.');
  console.error('   Insérez manuellement le contenu de security-block.js.');
  process.exit(1);
}

// ── Écrire ───────────────────────────────────────────────
// Backup original
fs.copyFileSync(TARGET, BACKUP);
console.log('✅ Backup créé : index.js.bak');

// Injecter
lines.splice(insertIdx, 0, SECURITY_BLOCK);
const patched = lines.join('\n');

fs.writeFileSync(OUTPUT, patched, 'utf8');
console.log('✅ Patch écrit dans : index.js.patched');
console.log('');
console.log('📋 Vérification manuelle recommandée avant de remplacer index.js :');
console.log('   diff index.js index.js.patched');
console.log('');
console.log('🚀 Pour déployer :');
console.log('   cp index.js.patched index.js');
console.log('   git add index.js package.json package-lock.json');
console.log('   git commit -m "security: helmet + rate-limit + CORS whitelist"');
console.log('   git push origin master');
console.log('   → Railway redéploie automatiquement');
