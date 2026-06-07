// ============================================================
// SECURITY BLOCK — REGUL ARENA — À insérer après les requires
// ============================================================

const rateLimit = require('express-rate-limit');

// ── 1. HELMET — Security Headers complets ───────────────────
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
  hsts: {
    maxAge:            31536000,   // 1 an
    includeSubDomains: true,
    preload:           true,
  },
  frameguard:         { action: 'deny' },
  noSniff:            true,
  referrerPolicy:     { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: false,
}));

// Permissions-Policy (helmet ne le couvre pas encore complètement)
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  next();
});

// ── 2. CORS — Whitelist stricte ─────────────────────────────
const cors = require('cors');
const ALLOWED_ORIGINS = [
  'https://www.regularena.com',
  'https://regularena.com',
  'https://endregularena-production.up.railway.app',
];
app.use(cors({
  origin: (origin, cb) => {
    // Permettre les requêtes sans origin (mobile apps, Postman en dev)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS bloqué: ${origin}`));
  },
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── 3. RATE LIMITING ─────────────────────────────────────────

// Auth : 15 tentatives / 15 min par IP
const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              15,
  standardHeaders:  true,
  legacyHeaders:    false,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  skip: (req) => process.env.NODE_ENV === 'test',
});
app.use('/auth/register', authLimiter);
app.use('/auth/login',    authLimiter);
app.use('/auth/resend',   authLimiter);

// API générale : 200 req / 15 min par IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Trop de requêtes. Ralentissez.' },
});
app.use('/api/', apiLimiter);

// Feedback : 5 / 10 min (anti-spam)
const feedbackLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max:      5,
  message: { error: 'Trop de feedbacks envoyés. Attendez 10 minutes.' },
});
app.use('/api/feedback', feedbackLimiter);

// ── 4. BODY SIZE LIMIT ───────────────────────────────────────
// Bloquer les payloads trop grands (anti-DoS)
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ============================================================
// FIN DU SECURITY BLOCK
// ============================================================
