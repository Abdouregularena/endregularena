'use strict';

/* ================================================================
   REGUL ARENA â€” Backend API
   Stack : Express &#183; better-sqlite3 &#183; JWT &#183; Resend &#183; Helmet
   Routes : /auth/* &#183; /feedback &#183; /feedback/notify
================================================================ */

require('dotenv').config();
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const rateLimit    = require('express-rate-limit');
const jwt          = require('jsonwebtoken');
const Database     = require('better-sqlite3');
const { Resend }   = require('resend');
const crypto       = require('crypto');
const path         = require('path');
const { pickQuestions } = require('./packs'); // FIX anti-triche : source serveur pour les questions de duel

/* â”€â”€ CONFIG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const PORT         = process.env.PORT || 3000;
const JWT_SECRET   = process.env.JWT_SECRET || 'changez-moi-en-production';
const RESEND_KEY   = process.env.RESEND_API_KEY || '';
const FROM_EMAIL   = process.env.FROM_EMAIL || 'noreply@regularena.com';
// SOURCE DE VERITE UNIQUE
const BASE_URL = process.env.BASE_URL || 'https://endregularena-production.up.railway.app';
const TOKEN_TTL_H = 24;

const resend = new Resend(RESEND_KEY);

/* â”€â”€ BASE DE DONNÃ‰ES SQLite â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const db = new Database(process.env.DB_PATH || path.join(__dirname, 'regularena.db')); // MODIFIÉ — persistance : DB_PATH → volume Railway (ex: /data/regularena.db)
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    profile       TEXT    NOT NULL DEFAULT 'professionnel',
    country       TEXT    NOT NULL DEFAULT '',
    etablissement TEXT    NOT NULL DEFAULT '',
    email_verified INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS confirm_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT    NOT NULL UNIQUE,
    expires_at TEXT    NOT NULL,
    used       INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS login_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL,
    token      TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used       INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    type       TEXT NOT NULL DEFAULT 'general',
    content    TEXT NOT NULL,
    email      TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notify_list (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_scores (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pack_id   TEXT    NOT NULL,
    score     INTEGER NOT NULL DEFAULT 0,
    total     INTEGER NOT NULL DEFAULT 0,
    played_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS duels (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    code          TEXT    NOT NULL UNIQUE,
    creator_id    INTEGER NOT NULL REFERENCES users(id),
    joiner_id     INTEGER REFERENCES users(id),
    pack_id       TEXT    NOT NULL DEFAULT 'general',
    num_questions INTEGER NOT NULL DEFAULT 10,
    timer_sec     INTEGER NOT NULL DEFAULT 30,
    status        TEXT    NOT NULL DEFAULT 'waiting',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS duel_scores (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    duel_id            INTEGER NOT NULL REFERENCES duels(id) ON DELETE CASCADE,
    user_id            INTEGER NOT NULL REFERENCES users(id),
    score              INTEGER NOT NULL DEFAULT 0,
    questions_answered INTEGER NOT NULL DEFAULT 0,
    finished           INTEGER NOT NULL DEFAULT 0,
    UNIQUE(duel_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS tournaments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    code         TEXT    NOT NULL UNIQUE,
    creator_id   INTEGER NOT NULL REFERENCES users(id),
    name         TEXT    NOT NULL DEFAULT '',
    pack_id      TEXT    NOT NULL DEFAULT 'general',
    max_players  INTEGER NOT NULL DEFAULT 8,
    status       TEXT    NOT NULL DEFAULT 'waiting',
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tournament_participants (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id       INTEGER NOT NULL REFERENCES users(id),
    score         INTEGER NOT NULL DEFAULT 0,
    total         INTEGER NOT NULL DEFAULT 0,
    rank          INTEGER,
    UNIQUE(tournament_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    zone    TEXT    NOT NULL DEFAULT 'general',
    content TEXT    NOT NULL,
    sent_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS dm (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    from_id INTEGER NOT NULL REFERENCES users(id),
    to_id   INTEGER NOT NULL REFERENCES users(id),
    content TEXT    NOT NULL,
    sent_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    type       TEXT    NOT NULL,
    message    TEXT    NOT NULL,
    seen       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

/* ALTER TABLE migrations — colonnes ajoutées après le déploiement initial */
['ALTER TABLE duels ADD COLUMN num_questions INTEGER NOT NULL DEFAULT 10',
 'ALTER TABLE duels ADD COLUMN timer_sec INTEGER NOT NULL DEFAULT 30',
 'ALTER TABLE duel_scores ADD COLUMN questions_answered INTEGER NOT NULL DEFAULT 0',
 'ALTER TABLE duel_scores ADD COLUMN finished INTEGER NOT NULL DEFAULT 0',
 // FIX anti-triche — questions tirées et figées par le serveur au start du duel.
 // Stocke un tableau JSON [{q, choices, correct, source/reference}] identique
 // au format frontend. NULL ou '[]' = duel pas encore démarré côté serveur.
 'ALTER TABLE duels ADD COLUMN questions_json TEXT NOT NULL DEFAULT \'[]\'',
 'ALTER TABLE duels ADD COLUMN started_at TEXT',
 // BUG2 FIX — index de question partagé entre les deux clients : avance dès qu'un joueur répond correctement
 'ALTER TABLE duels ADD COLUMN current_q_index INTEGER NOT NULL DEFAULT 0',
].forEach(sql => { try { db.exec(sql); } catch(_) {} });
try { db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_duel_scores_uq ON duel_scores (duel_id, user_id)'); } catch(_) {}
try { db.exec('CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications (user_id, seen, created_at DESC)'); } catch(_) {}
// FIX performance : index manquants sur messages et dm
try { db.exec('CREATE INDEX IF NOT EXISTS idx_messages_zone ON messages (zone, sent_at)'); } catch(_) {}
try { db.exec('CREATE INDEX IF NOT EXISTS idx_dm_conv ON dm (from_id, to_id, sent_at)'); } catch(_) {}
try { db.exec('CREATE INDEX IF NOT EXISTS idx_dm_to ON dm (to_id, from_id, sent_at)'); } catch(_) {}

try { db.exec('CREATE INDEX IF NOT EXISTS idx_user_scores_user ON user_scores (user_id, played_at)'); } catch(_) {}
try { db.exec('CREATE INDEX IF NOT EXISTS idx_tp_tid_score ON tournament_participants (tournament_id, score)'); } catch(_) {}

// TOURNOI AJOUT — migrations nouvelles colonnes tables existantes
['ALTER TABLE tournaments ADD COLUMN country TEXT NOT NULL DEFAULT ""',   // TOURNOI AJOUT
 'ALTER TABLE tournaments ADD COLUMN zone TEXT NOT NULL DEFAULT "uemoa"', // TOURNOI AJOUT
 'ALTER TABLE tournaments ADD COLUMN start_date TEXT NOT NULL DEFAULT ""',// TOURNOI AJOUT
 'ALTER TABLE tournament_participants ADD COLUMN qualified INTEGER NOT NULL DEFAULT 0', // TOURNOI AJOUT
 // FEATURE 1/2 — invitation bêta + CGU
 'ALTER TABLE users ADD COLUMN cgu_accepted_at TEXT',
 'ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT "user"',
].forEach(sql => { try { db.exec(sql); } catch(_) {} }); // TOURNOI AJOUT

// TOURNOI AJOUT — nouvelles tables module tournoi
db.exec(`
  CREATE TABLE IF NOT EXISTS tournament_matches (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round         INTEGER NOT NULL DEFAULT 1,
    player1_id    INTEGER REFERENCES users(id),
    player2_id    INTEGER REFERENCES users(id),
    winner_id     INTEGER REFERENCES users(id),
    duel_code     TEXT,
    status        TEXT NOT NULL DEFAULT 'pending',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS tournament_match_sheets (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    match_id      INTEGER,
    player_id     INTEGER NOT NULL REFERENCES users(id),
    questions_json TEXT NOT NULL DEFAULT '[]',
    score         INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS tournament_chat (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id       INTEGER NOT NULL REFERENCES users(id),
    content       TEXT NOT NULL,
    sent_at       TEXT NOT NULL DEFAULT (datetime('now'))
  );
`); // TOURNOI AJOUT

/* ── NOTIFICATIONS HELPER ──────────────────────────────────────────── */
function notifyAllExcept(excludeUserId, type, message) {
  const users = db.prepare('SELECT id FROM users WHERE email_verified = 1 AND id != ? ORDER BY RANDOM() LIMIT 50').all(excludeUserId);
  const insert = db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)');
  const tx = db.transaction(() => { users.forEach(u => insert.run(u.id, type, message)); });
  tx();
}

/* â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function genToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function expiresAt(hours = TOKEN_TTL_H) {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

function signJWT(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, profile: user.profile,
      role: user.role || 'user', is_verified: user.email_verified === 1 },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/* Middleware admin — vérifie JWT + claim role === 'admin' dans le token */
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token manquant' });
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    req.user = decoded;
    next();
  } catch { res.status(401).json({ error: 'Token invalide' }); }
}

function ok(res, data = {}) {
  return res.status(200).json({ success: true, ...data });
}

function err(res, status, message) {
  return res.status(status).json({ success: false, error: message });
}

/* â”€â”€ MIDDLEWARE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const app = express();

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      scriptSrc:     ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],   // autorise onclick= et autres event handlers inline
      styleSrc:      ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:       ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://www.regularena.com", "https://regularena.com", "https://endregularena-production.up.railway.app"],
      imgSrc:        ["'self'", "data:"],
      frameAncestors:["'none'"],
    },
  },
}));
app.use((req, res, next) => {
   const allowed = ['https://www.regularena.com','https://regularena.com','https://endregularena-production.up.railway.app'];
  if (allowed.includes(req.headers.origin)) res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
}); // MODIFIÉ — CORS manuel

app.use(express.json());

const _devSkip = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.ip);
const limiterStrict = rateLimit({ windowMs: 5 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false, skip: _devSkip });
const limiterLoose  = rateLimit({ windowMs: 5 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false, skip: _devSkip });

/* â”€â”€ AUTH MIDDLEWARE (routes prot&#233;g&#233;es futures) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return err(res, 401, 'Non authentifi&#233;');
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return err(res, 401, 'Token invalide ou expir&#233;');
  }
}

/* ================================================================
   ROUTES AUTH
================================================================ */

/* POST /auth/register
   Body : { name, email, profile, country, etablissement }
   &#8594; cr&#233;e ou retrouve l'utilisateur, envoie email de confirmation
*/
app.post('/auth/register', limiterStrict, async (req, res) => {
  const { name, email, profile, country, etablissement = '', invite_code, cgu_accepted } = req.body || {};

  // FEATURE 2 — CGU obligatoires
  if (cgu_accepted !== true) return err(res, 400, 'Vous devez accepter les CGU.');

  if (!name || !email) return err(res, 400, 'Nom et email requis');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err(res, 400, 'Email invalide');
  if (name.length < 2 || name.length > 80) return err(res, 400, 'Nom invalide');

  const cleanName  = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  // FEATURE 1 — vérification code invitation (bêta fermée si BETA_CLOSED=true)
  const BETA_CLOSED = process.env.BETA_CLOSED === 'true';
  if (BETA_CLOSED) {
    if (!invite_code) return err(res, 403, 'Inscription sur invitation uniquement.');
    const inv = db.prepare('SELECT * FROM invitations WHERE code = ? AND used = 0').get(invite_code.trim());
    if (!inv) return err(res, 403, "Code d'invitation invalide ou déjà utilisé.");
    if (inv.email && inv.email.toLowerCase() !== cleanEmail) {
      return err(res, 403, 'Ce code d\'invitation est réservé à une autre adresse email.');
    }
    // stocker pour marquer comme utilisé après création réussie
    req._invitation = inv;
  }

  // Upsert user
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

  if (!user) {
    const result = db.prepare(
      "INSERT INTO users (name, email, profile, country, etablissement, cgu_accepted_at) VALUES (?, ?, ?, ?, ?, datetime('now'))"
    ).run(cleanName, cleanEmail, profile || 'professionnel', country || '', etablissement);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  } else {
    db.prepare("UPDATE users SET cgu_accepted_at = datetime('now') WHERE id = ?").run(user.id);
  }

  // G&#233;n&#233;rer token de confirmation
  const token = genToken();
  db.prepare(
    'INSERT INTO confirm_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).run(user.id, token, expiresAt(TOKEN_TTL_H));

  // Envoyer email via Resend
  const confirmUrl = `${BASE_URL}/auth/verify?token=${token}`;
  try {
    const sendResult = await resend.emails.send({
      from: `REGUL ARENA <${FROM_EMAIL}>`,
      to:   cleanEmail,
      subject: 'Confirme ton inscription — REGUL ARENA',
      html: emailConfirmHTML(cleanName, confirmUrl),
      headers: { 'X-Entity-Ref-ID': crypto.randomUUID() },
    });
    if (sendResult.error) {
      console.error('Resend error:', JSON.stringify(sendResult.error));
      return err(res, 500, 'Erreur envoi email — réessaie dans quelques instants');
    }
  } catch (e) {
    console.error('Resend exception:', e.message);
    return err(res, 500, 'Erreur envoi email — réessaie dans quelques instants');
  }

  // FEATURE 1 — marquer l'invitation comme utilisée après succès
  if (req._invitation) {
    db.prepare('UPDATE invitations SET used = 1 WHERE id = ?').run(req._invitation.id);
  }

  return ok(res, { message: 'Email de confirmation envoyé' });
});


/* POST /auth/login
   Body : { email }
   → envoie un magic link de connexion aux utilisateurs déjà vérifiés.
   Réponse identique que le compte existe ou non (anti-énumération).
   curl -X POST /auth/login -d '{"email":"user@banque.sn"}'
*/
app.post('/auth/login', limiterStrict, async (req, res) => {
  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return err(res, 400, 'Email invalide');
  }
  const cleanEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND email_verified = 1').get(cleanEmail);

  // Anti-énumération : toujours répondre la même chose
  if (!user) {
    return ok(res, { message: 'Si cet email est inscrit, vous recevrez un lien de connexion.' });
  }

  const token = genToken();
  db.prepare('INSERT INTO login_tokens (email, token, expires_at) VALUES (?, ?, ?)')
    .run(cleanEmail, token, expiresAt(1)); // expire après 1h

  const loginUrl = `${BASE_URL}/auth/login-verify?login_token=${token}`;
  try {
    await resend.emails.send({
      from: `REGUL ARENA <${FROM_EMAIL}>`,
      to:   cleanEmail,
      subject: 'Votre lien de connexion — REGUL ARENA',
      html: emailConfirmHTML(user.name, loginUrl),
      headers: { 'X-Entity-Ref-ID': crypto.randomUUID() },
    });
  } catch (e) {
    console.error('[/auth/login] email error:', e.message);
    return err(res, 500, 'Erreur envoi email — réessaie dans quelques instants');
  }

  return ok(res, { message: 'Lien de connexion envoyé. Vérifiez votre boîte mail.' });
});

/* POST /auth/resend
   Body : { email }
   &#8594; renvoie le dernier lien de confirmation
*/
app.post('/auth/resend', limiterStrict, async (req, res) => {
  const { email } = req.body || {};
  if (!email) return err(res, 400, 'Email requis');

  const cleanEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  if (!user) return err(res, 404, 'Aucun compte trouv&#233; pour cet email');

  const token = genToken();
  db.prepare(
    'INSERT INTO confirm_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).run(user.id, token, expiresAt(TOKEN_TTL_H));

  const confirmUrl = `${BASE_URL}/auth/verify?token=${token}`;
  try {
    const sendResult = await resend.emails.send({
      from: `REGUL ARENA <${FROM_EMAIL}>`,
      to:   cleanEmail,
      subject: 'Nouveau lien de confirmation — REGUL ARENA',
      html: emailConfirmHTML(user.name, confirmUrl),
      headers: { 'X-Entity-Ref-ID': crypto.randomUUID() },
    });
    if (sendResult.error) {
      console.error('Resend error:', JSON.stringify(sendResult.error));
      return err(res, 500, 'Erreur envoi email');
    }
  } catch (e) {
    console.error('Resend exception:', e.message);
    return err(res, 500, 'Erreur envoi email');
  }

  return ok(res, { message: 'Email renvoyé' });
});


/* POST /auth/resend-verification
   Body : { email }
   → génère un nouveau token et renvoie l'email de confirmation
   Utilisé par le frontend quand le lien est expiré ou déjà utilisé
*/
app.post('/auth/resend-verification', limiterStrict, async (req, res) => {
  const { email } = req.body || {};
  if (!email) return err(res, 400, 'Email requis');

  const cleanEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  if (!user) return err(res, 404, 'Aucun compte trouvé pour cet email');

  const token = genToken();
  db.prepare(
    'INSERT INTO confirm_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).run(user.id, token, expiresAt(TOKEN_TTL_H));

  const confirmUrl = `${BASE_URL}/auth/verify?token=${token}`;
  try {
    const sendResult = await resend.emails.send({
      from: `REGUL ARENA <${FROM_EMAIL}>`,
      to:   cleanEmail,
      subject: 'Nouveau lien de confirmation — REGUL ARENA',
      html: emailConfirmHTML(user.name, confirmUrl),
      headers: { 'X-Entity-Ref-ID': crypto.randomUUID() },
    });
    if (sendResult.error) {
      console.error('Resend error:', JSON.stringify(sendResult.error));
      return err(res, 500, 'Erreur envoi email — réessaie dans quelques instants');
    }
  } catch (e) {
    console.error('Resend exception:', e.message);
    return err(res, 500, 'Erreur envoi email — réessaie dans quelques instants');
  }

  return ok(res, { message: 'Nouveau lien envoyé' });
});


/* GET /auth/verify?token=xxx
   &#8594; v&#233;rifie le token, marque email comme confirm&#233;, retourne JWT + user
*/
app.get('/auth/verify', limiterLoose, (req, res) => {
  const { token } = req.query;
  if (!token) return res.redirect(302, `${BASE_URL}/?confirm_error=missing`);

  // Cherche le token sans filtre used=0 pour détecter les clics doubles
  const row = db.prepare('SELECT * FROM confirm_tokens WHERE token = ?').get(token);

  if (!row) return res.redirect(302, `${BASE_URL}/?confirm_error=invalid`);

  // Si l'utilisateur est déjà vérifié (clic double sur le lien), on le connecte directement
  const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id);
  if (existingUser && existingUser.email_verified === 1) {
    const jwtToken = signJWT(existingUser);
    return res.redirect(302, `${BASE_URL}/?confirmed=true&jwt=${encodeURIComponent(jwtToken)}`);
  }

  if (row.used === 1) return res.redirect(302, `${BASE_URL}/?confirm_error=invalid`);
  if (new Date(row.expires_at) < new Date()) return res.redirect(302, `${BASE_URL}/?confirm_error=expired`);

  db.prepare('UPDATE confirm_tokens SET used = 1 WHERE id = ?').run(row.id);
  db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(row.user_id);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id);
  const jwtToken = signJWT(user);
  return res.redirect(302, `${BASE_URL}/?confirmed=true&jwt=${encodeURIComponent(jwtToken)}`);
});


/* GET /auth/login-verify?login_token=xxx
   &#8594; connexion magique (lien email)
*/
app.get('/auth/login-verify', limiterLoose, (req, res) => {
  const { login_token } = req.query;
  if (!login_token) return err(res, 400, 'Token manquant');

  const row = db.prepare(
    'SELECT * FROM login_tokens WHERE token = ? AND used = 0'
  ).get(login_token);

  if (!row) return err(res, 400, 'Lien invalide ou d&#233;j&#224; utilis&#233;');
  if (new Date(row.expires_at) < new Date()) return err(res, 400, 'Lien expir&#233;');

  db.prepare('UPDATE login_tokens SET used = 1 WHERE id = ?').run(row.id);

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(row.email);
  if (!user) return err(res, 404, 'Compte introuvable');

  const jwtToken = signJWT(user); // MODIFIÉ — redirige vers le frontend au lieu de renvoyer du JSON brut
  return res.redirect(302, `${BASE_URL}/?confirmed=true&jwt=${encodeURIComponent(jwtToken)}`); // MODIFIÉ
});


/* GET /auth/me   Header : Authorization: Bearer <jwt>
   &#8594; valide le JWT, retourne user + is_verified pour restaurer la session
*/
app.get('/auth/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return err(res, 404, 'Compte introuvable');
  return ok(res, { user: { ...publicUser(user), is_verified: user.email_verified === 1 } });
});


/* ================================================================
   ROUTES FEEDBACK
================================================================ */

/* POST /feedback
   Body : { type, message|content, email?, name?, stars? }
*/
app.post('/feedback', limiterLoose, async (req, res) => {
  const { type = 'general', message, content, email = '', name = '', stars = 5 } = req.body || {};
  const text = (message || content || '').trim();
  if (!text || text.length < 2) return err(res, 400, 'Contenu requis');

  db.prepare(
    'INSERT INTO feedback (type, content, email) VALUES (?, ?, ?)'
  ).run(type, text.slice(0, 2000), email.slice(0, 120));

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: 'abdou.ndao@regularena.com', // MODIFIÉ — destinataire feedback
      subject: `[REGUL ARENA] Feedback — ${type} (${stars}★)`,
      html: `<div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:#C9991A">Nouveau feedback REGUL ARENA</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#888;width:120px">Type</td><td><strong>${type}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#888">Note</td><td>${'⭐'.repeat(Math.min(5, Number(stars)||0))}</td></tr>
          ${name ? `<tr><td style="padding:6px 0;color:#888">Nom</td><td>${name}</td></tr>` : ''}
          ${email ? `<tr><td style="padding:6px 0;color:#888">Email</td><td>${email}</td></tr>` : ''}
        </table>
        <hr style="margin:16px 0;border-color:#333">
        <div style="background:#111;padding:16px;border-radius:4px;white-space:pre-wrap;color:#EEF0F5">${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
      </div>`,
    });
  } catch (_) { /* non-bloquant */ }

  return ok(res, { message: 'Feedback enregistre' });
});


/* POST /feedback/notify
   Body : { email }
   &#8594; liste d'attente tournoi 2027
*/
app.post('/feedback/notify', limiterLoose, (req, res) => {
  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err(res, 400, 'Email invalide');

  try {
    db.prepare('INSERT INTO notify_list (email) VALUES (?)').run(email.trim().toLowerCase());
  } catch {
    // email d&#233;j&#224; dans la liste â€” silencieux
  }

  return ok(res, { message: 'Inscrit &#224; la liste d\'alerte' });
});


/* ── HELPERS ────────────────────────────────────────────────────── */
function genCode(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = (n) => Array.from({length:n}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  return `${prefix}-${rand(3)}-${rand(3)}`;
}

/* ── SCORES ─────────────────────────────────────────────────────── */
app.post('/scores', requireAuth, (req, res) => {
  const { pack_id, score, total } = req.body || {};
  if (!pack_id || score == null || total == null) return err(res, 400, 'pack_id, score, total requis');
  db.prepare('INSERT INTO user_scores (user_id, pack_id, score, total) VALUES (?, ?, ?, ?)')
    .run(req.user.id, pack_id, Number(score), Number(total));
  return ok(res, { message: 'Score enregistré' });
});

app.get('/scores/me', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM user_scores WHERE user_id = ? ORDER BY played_at DESC LIMIT 100').all(req.user.id);
  return ok(res, { scores: rows });
});

app.delete('/scores/me', requireAuth, (req, res) => {
  db.prepare('DELETE FROM user_scores WHERE user_id = ?').run(req.user.id);
  return ok(res, { message: 'Historique supprimé' });
});

/* POST /scores/reset — réinitialise tous les scores solo du joueur connecté */
app.post('/scores/reset', requireAuth, (req, res) => {
  db.prepare('DELETE FROM user_scores WHERE user_id = ?').run(req.user.id);
  return ok(res, { message: 'Score réinitialisé avec succès' });
});

app.get('/leaderboard', (req, res) => {
  const { zone, profile } = req.query;
  const UEMOA = ['SN','CI','BF','ML','BJ','NE','TG','GW'];
  const CEMAC  = ['CM','GA','CG','CF','GQ','TD'];
  const conditions = ['u.email_verified = 1'];
  const params = [];
  if (zone === 'uemoa') { conditions.push(`u.country IN (${UEMOA.map(()=>'?').join(',')})`); params.push(...UEMOA); }
  else if (zone === 'cemac') { conditions.push(`u.country IN (${CEMAC.map(()=>'?').join(',')})`); params.push(...CEMAC); }
  if (profile === 'professionnel' || profile === 'etudiant') { conditions.push('u.profile = ?'); params.push(profile); }
  const rows = db.prepare(`
    SELECT u.id, u.name, u.country, u.etablissement, u.profile,
           COUNT(s.id) AS games,
           COALESCE(SUM(s.score), 0) AS total_score
    FROM users u
    LEFT JOIN user_scores s ON s.user_id = u.id
    WHERE ${conditions.join(' AND ')}
    GROUP BY u.id
    HAVING total_score > 0
    ORDER BY total_score DESC
    LIMIT 50
  `).all(...params);
  let myRank = null;
  const hdr = req.headers['authorization'] || '';
  const tok = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (tok) { try { const p = jwt.verify(tok, JWT_SECRET); const idx = rows.findIndex(r => r.id === p.id); if (idx !== -1) myRank = idx + 1; } catch(e) {} }
  return ok(res, { leaderboard: rows, my_rank: myRank });
});

/* ── NOTIFICATIONS ──────────────────────────────────────────────── */
app.get('/notifications', requireAuth, (req, res) => {
  const rows = db.prepare(
    'SELECT id, type, message, seen, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(req.user.id);
  const unread = rows.filter(r => !r.seen).length;
  return ok(res, { notifications: rows, unread });
});

app.patch('/notifications/:id/seen', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET seen = 1 WHERE id = ? AND user_id = ?').run(Number(req.params.id), req.user.id);
  return ok(res, { message: 'Lu' });
});

app.post('/notifications/seen-all', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET seen = 1 WHERE user_id = ?').run(req.user.id);
  return ok(res, { message: 'Tout marqué comme lu' });
});

/* ── DUELS ──────────────────────────────────────────────────────── */
function _duelFull(code) {
  const duel = db.prepare('SELECT * FROM duels WHERE code = ?').get(code);
  if (!duel) return null;
  const creator = db.prepare('SELECT id, name, country FROM users WHERE id = ?').get(duel.creator_id);
  const joiner  = duel.joiner_id ? db.prepare('SELECT id, name, country FROM users WHERE id = ?').get(duel.joiner_id) : null;
  const scores  = db.prepare('SELECT user_id, score, questions_answered, finished FROM duel_scores WHERE duel_id = ?').all(duel.id);
  return { ...duel, creator, joiner, scores };
}

app.post('/duels', requireAuth, (req, res) => {
  const { pack_id, num_questions = 10, timer_sec = 30 } = req.body || {};
  let code;
  for (let i = 0; i < 10; i++) {
    code = genCode('D');
    if (!db.prepare('SELECT id FROM duels WHERE code = ?').get(code)) break;
  }
  db.prepare('INSERT INTO duels (code, creator_id, pack_id, num_questions, timer_sec) VALUES (?, ?, ?, ?, ?)')
    .run(code, req.user.id, pack_id || 'general', Math.min(20, Math.max(5, Number(num_questions))), Math.min(60, Math.max(15, Number(timer_sec))));
  notifyAllExcept(req.user.id, 'duel_created', `🥊 ${req.user.name} vous défie en duel ! Code : ${code}`);
  return ok(res, { code, duel: _duelFull(code) });
});

app.get('/duels/:code', requireAuth, (req, res) => {
  const d = _duelFull(req.params.code);
  if (!d) return err(res, 404, 'Duel introuvable');
  return ok(res, { duel: d });
});

app.post('/duels/:code/join', requireAuth, (req, res) => {
  const duel = db.prepare('SELECT * FROM duels WHERE code = ?').get(req.params.code);
  if (!duel) return err(res, 404, 'Duel introuvable');
  if (duel.status === 'active' || duel.status === 'finished') {
    if (duel.joiner_id === req.user.id || duel.creator_id === req.user.id)
      return ok(res, { message: 'Déjà dans le duel', duel: _duelFull(req.params.code) });
    return err(res, 400, 'Duel déjà commencé');
  }
  if (duel.status !== 'waiting') return err(res, 400, 'Duel terminé');
  if (duel.creator_id === req.user.id) return ok(res, { message: 'Tu es le créateur', duel: _duelFull(req.params.code) });
  db.prepare('UPDATE duels SET joiner_id = ?, status = ? WHERE code = ?').run(req.user.id, 'joined', req.params.code);
  db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)').run(duel.creator_id, 'duel_joined', `⚔️ ${req.user.name} a rejoint votre duel (code : ${req.params.code})`);
  return ok(res, { message: 'Rejoint', duel: _duelFull(req.params.code) });
});

app.post('/duels/:code/start', requireAuth, (req, res) => {
  const duel = db.prepare('SELECT * FROM duels WHERE code = ?').get(req.params.code);
  if (!duel) return err(res, 404, 'Duel introuvable');
  if (duel.creator_id !== req.user.id) return err(res, 403, 'Seul le créateur peut démarrer');
  if (!duel.joiner_id) return err(res, 400, 'Personne n\'a encore rejoint');
  if (duel.status === 'active') return ok(res, { message: 'Déjà actif', duel: _duelFull(req.params.code) });

  // FIX anti-triche — c'est ICI que les questions sont tirées et figées côté
  // serveur. Avant ce point, aucune question n'est exposée — donc impossible
  // de lire le pack à l'avance. Après ce point, le pack est figé pour les deux
  // joueurs (mêmes questions, même ordre).
  const picked = pickQuestions(duel.pack_id, duel.num_questions);
  if (!picked || picked.length === 0) {
    return err(res, 500, 'Pack introuvable ou vide côté serveur');
  }
  const questionsJson = JSON.stringify(picked);
  const startedAt = new Date().toISOString();

  db.prepare('UPDATE duels SET status = ?, questions_json = ?, started_at = ? WHERE code = ?')
    .run('active', questionsJson, startedAt, req.params.code);

  return ok(res, { message: 'Duel lancé', duel: _duelFull(req.params.code) });
});

/* GET /duels/:code/question/:index
   FIX anti-triche — sert UNE question à la fois, sans la bonne réponse.
   Le joueur doit avoir terminé toutes les questions précédentes pour
   accéder à l'index suivant (anti-skip / anti-prefetch).
*/
app.get('/duels/:code/question/:index', requireAuth, (req, res) => {
  const duel = db.prepare('SELECT * FROM duels WHERE code = ?').get(req.params.code);
  if (!duel) return err(res, 404, 'Duel introuvable');
  if (duel.status !== 'active') return err(res, 400, 'Duel non actif');
  if (duel.creator_id !== req.user.id && duel.joiner_id !== req.user.id) {
    return err(res, 403, 'Accès refusé');
  }

  const idx = Number(req.params.index);
  if (!Number.isInteger(idx) || idx < 0 || idx >= duel.num_questions) {
    return err(res, 400, 'Index hors plage');
  }

  // Anti-prefetch : on autorise uniquement l'accès à la question courante
  // (= questions_answered) ou à la précédente (pour relecture éventuelle).
  const score = db.prepare('SELECT questions_answered FROM duel_scores WHERE duel_id = ? AND user_id = ?')
    .get(duel.id, req.user.id);
  const answered = score ? score.questions_answered : 0;
  if (idx > answered) {
    return err(res, 403, 'Question pas encore débloquée');
  }

  let questions;
  try { questions = JSON.parse(duel.questions_json); } catch(_) { questions = []; }
  if (idx >= questions.length) return err(res, 500, 'Question introuvable');

  const q = questions[idx];
  // CRITIQUE : ne jamais renvoyer le champ `correct` au client.
  return ok(res, {
    question: {
      index:   idx,
      q:       q.q,
      choices: q.choices,
      reference: q.source || q.reference || 'BCEAO/CIMA 2026',
    },
    total: duel.num_questions,
  });
});

app.post('/duels/:code/answer', requireAuth, (req, res) => {
  // FIX anti-triche — le client envoie choice_index (index du choix cliqué).
  // Le serveur valide contre questions_json, calcule le score, fait foi.
  // Fallback : si choice_index absent, on accepte le booléen `correct` du client
  // (rétrocompatibilité clients antérieurs au fix). Le score client `score` n'est
  // plus jamais utilisé comme source de vérité.
  const { q_index, choice_index, correct: legacyCorrect, score: legacyScore } = req.body || {};
  if (q_index == null) return err(res, 400, 'q_index requis');

  const duel = db.prepare('SELECT * FROM duels WHERE code = ?').get(req.params.code);
  if (!duel) return err(res, 404, 'Duel introuvable');
  if (duel.status !== 'active') return err(res, 400, 'Duel non actif');
  if (duel.creator_id !== req.user.id && duel.joiner_id !== req.user.id) {
    return err(res, 403, 'Accès refusé');
  }

  // ── VERROU DE QUESTION ────────────────────────────────────────────
  // Si current_q_index a déjà dépassé q_index, l'autre joueur a répondu
  // correctement à cette question en premier.  On renvoie { locked:true }
  // sans accorder de points ni modifier quoi que ce soit en base.
  // curl exemple : POST /duels/D-ABC-123/answer -d '{"q_index":2,"choice_index":1}'
  if (Number(q_index) < duel.current_q_index) {
    const existing = db.prepare('SELECT score FROM duel_scores WHERE duel_id = ? AND user_id = ?')
      .get(duel.id, req.user.id);
    return ok(res, {
      locked:           true,
      correct:          null,
      points_earned:    0,
      my_score:         existing ? existing.score : 0,
      current_q_index:  duel.current_q_index,
    });
  }

  // Lecture des questions stockées
  let questions = [];
  try { questions = JSON.parse(duel.questions_json || '[]'); } catch(_) {}

  // Lecture du score actuel du joueur
  const existing = db.prepare('SELECT * FROM duel_scores WHERE duel_id = ? AND user_id = ?')
    .get(duel.id, req.user.id);
  const prevAnswered = existing ? existing.questions_answered : 0;
  const prevScore    = existing ? existing.score : 0;

  let isCorrect = false;
  let pointsEarned = 0;
  let serverValidated = false;

  if (questions.length > 0 && questions[q_index]) {
    serverValidated = true;
    const expected = questions[q_index].correct;
    // Priorité 1 : choice_index envoyé → validation stricte côté serveur
    // Priorité 2 : choice_index absent → on accepte le booléen `correct` du client
    //              (clients antérieurs qui n'envoient pas encore choice_index)
    if (choice_index !== undefined && choice_index !== null) {
      isCorrect = Number(choice_index) === Number(expected);
    } else {
      isCorrect = !!legacyCorrect;
    }
    if (isCorrect) pointsEarned = 100;
  } else {
    // Fallback : questions_json vide (duel créé avant le fix serveur)
    console.warn(`[duel ${duel.code}] fallback legacy : questions_json vide, accept client correct`);
    isCorrect = !!legacyCorrect;
    pointsEarned = isCorrect ? 100 : 0;
  }

  const newScore = prevScore + pointsEarned;
  const newAnswered = prevAnswered + 1;
  const finished = newAnswered >= duel.num_questions ? 1 : 0;

  // Transaction pour éliminer la race condition (point 4 de l'audit)
  let newQIndex = duel.current_q_index;
  const tx = db.transaction(() => {
    if (!existing) {
      db.prepare('INSERT INTO duel_scores (duel_id, user_id, score, questions_answered, finished) VALUES (?, ?, ?, ?, ?)')
        .run(duel.id, req.user.id, newScore, newAnswered, finished);
    } else {
      db.prepare('UPDATE duel_scores SET score = ?, questions_answered = ?, finished = ? WHERE duel_id = ? AND user_id = ?')
        .run(newScore, newAnswered, finished, duel.id, req.user.id);
    }
    // BUG2 FIX — avance l'index partagé uniquement si bonne réponse ET index pas encore avancé
    if (isCorrect && duel.current_q_index === Number(q_index)) {
      newQIndex = duel.current_q_index + 1;
      db.prepare('UPDATE duels SET current_q_index = ? WHERE id = ?').run(newQIndex, duel.id);
    }
    if (finished) {
      const allDone = db.prepare('SELECT COUNT(*) AS n FROM duel_scores WHERE duel_id = ? AND finished = 1').get(duel.id).n;
      if (allDone >= 2) db.prepare('UPDATE duels SET status = ? WHERE id = ?').run('finished', duel.id);
    }
  });
  tx();

  // Réponse : on indique au client si sa réponse était correcte ET quelle
  // était la bonne réponse (pour affichage feedback). On envoie aussi le
  // score authoritative pour que le client se synchronise.
  const correctIndex = serverValidated ? questions[q_index].correct : null;
  return ok(res, {
    correct:          isCorrect,
    correct_index:    correctIndex,
    points_earned:    pointsEarned,
    my_score:         newScore,
    server_validated: serverValidated,
    current_q_index:  newQIndex,
    live:             _duelFull(req.params.code),
  });
});

app.get('/duels/:code/live', requireAuth, (req, res) => {
  const d = _duelFull(req.params.code);
  if (!d) return err(res, 404, 'Duel introuvable');
  return ok(res, { duel: d });
});

/* ── CHAT DE DUEL ──────────────────────────────────────────────────
   MODIFIÉ — routes manquantes. Le front appelle GET/POST /duels/:code/chat
   (front lignes 1895 & 1917) mais aucune route serveur n'existait → les
   messages tombaient dans le catch-all '*' → jamais enregistrés ni affichés
   (chat vide). On réutilise la table `messages` avec zone = code du duel
   (aucune migration). Le front lit m.id / m.user_id / m.name / m.content. */
app.get('/duels/:code/chat', requireAuth, (req, res) => {
  const duel = db.prepare('SELECT id, creator_id, joiner_id FROM duels WHERE code = ?').get(req.params.code);
  if (!duel) return err(res, 404, 'Duel introuvable');
  if (req.user.id !== duel.creator_id && req.user.id !== duel.joiner_id) return err(res, 403, 'Accès refusé'); // MODIFIÉ : joiner_id peut être null → seul creator passe
  const messages = db.prepare(
    `SELECT m.id, m.user_id, m.content, m.sent_at, u.name, u.country
     FROM messages m JOIN users u ON u.id = m.user_id
     WHERE m.zone = ? ORDER BY m.sent_at ASC, m.id ASC LIMIT 100`
  ).all(req.params.code);
  return ok(res, { messages });
});

app.post('/duels/:code/chat', requireAuth, (req, res) => {
  const duel = db.prepare('SELECT id, creator_id, joiner_id FROM duels WHERE code = ?').get(req.params.code);
  if (!duel) return err(res, 404, 'Duel introuvable');
  if (req.user.id !== duel.creator_id && (duel.joiner_id === null || req.user.id !== duel.joiner_id)) return err(res, 403, 'Accès refusé'); // MODIFIÉ : creator toujours autorisé, joiner si défini
  const { content } = req.body || {};
  if (!content || !content.trim()) return err(res, 400, 'Message vide');
  db.prepare('INSERT INTO messages (user_id, zone, content) VALUES (?, ?, ?)')
    .run(req.user.id, req.params.code, content.trim().slice(0, 300));
  return ok(res, { message: 'Message envoyé' });
});

/* MODIFIÉ — LOBBY : liste des duels ouverts (en attente d'adversaire).
   Chemin volontairement hors de /duels/:code pour éviter toute collision
   de route. Sert le "fil déroulant" de l'Arène ouverte. */
app.get('/lobby/duels', requireAuth, (req, res) => {
  const open = db.prepare(
    `SELECT d.code, d.pack_id, d.num_questions, d.timer_sec, u.name AS creator_name, u.country
     FROM duels d JOIN users u ON u.id = d.creator_id
     WHERE d.status = 'waiting' AND d.creator_id != ?
       AND d.created_at >= datetime('now','-1 day')
     ORDER BY d.id DESC LIMIT 30`
  ).all(req.user.id);
  return ok(res, { open });
});

/* MODIFIÉ — NETTOYAGE AUTO des duels/tournois expirés (anti-codes morts).
   Conservateur : supprime UNIQUEMENT ce qui n'a jamais servi (status 'waiting').
   Les duels/tournois rejoints, en cours ou terminés ne sont JAMAIS touchés. */
function cleanupExpired() {
  try {
    // 1) Duels en attente jamais rejoints, créés il y a plus de 24h
    const oldDuels = db.prepare(
      "SELECT id, code FROM duels WHERE status='waiting' AND created_at < datetime('now','-1 day')"
    ).all();
    if (oldDuels.length) {
      const delDS  = db.prepare('DELETE FROM duel_scores WHERE duel_id = ?');
      const delMsg = db.prepare('DELETE FROM messages WHERE zone = ?');
      const delD   = db.prepare('DELETE FROM duels WHERE id = ?');
      db.transaction(() => oldDuels.forEach(d => { delDS.run(d.id); delMsg.run(d.code); delD.run(d.id); }))();
    }
    // 2) Tournois en attente (jamais lancés) : date de début dépassée >1j OU créés il y a +7j
    const oldTours = db.prepare(
      `SELECT id FROM tournaments
       WHERE status='waiting'
         AND ( created_at < datetime('now','-7 days')
            OR (start_date <> '' AND datetime(start_date) IS NOT NULL AND datetime(start_date) < datetime('now','-1 day')) )`
    ).all();
    if (oldTours.length) {
      db.transaction(() => oldTours.forEach(t => {
        db.prepare('DELETE FROM tournament_participants WHERE tournament_id = ?').run(t.id);
        try { db.prepare('DELETE FROM tournament_chat WHERE tournament_id = ?').run(t.id); } catch(_) {}
        try { db.prepare('DELETE FROM tournament_matches WHERE tournament_id = ?').run(t.id); } catch(_) {}
        try { db.prepare('DELETE FROM tournament_match_sheets WHERE tournament_id = ?').run(t.id); } catch(_) {}
        db.prepare('DELETE FROM tournaments WHERE id = ?').run(t.id);
      }))();
    }
    if (oldDuels.length || oldTours.length) {
      console.log(`[cleanup] supprimés : ${oldDuels.length} duel(s) périmé(s), ${oldTours.length} tournoi(s) périmé(s)`);
    }
  } catch (e) { console.error('[cleanup]', e.message); }
}
cleanupExpired();                              // au démarrage
setInterval(cleanupExpired, 60 * 60 * 1000);   // puis toutes les heures

/* ════════════════════════════════════════════════
   CERTIFICATS DE RÉUSSITE — schéma unique (MODIFIÉ: doublon ancien schéma supprimé)
   Génération PDF côté client ; le serveur enregistre l'émission
   et sert la page publique de vérification (scan QR).
════════════════════════════════════════════════ */
db.exec(`CREATE TABLE IF NOT EXISTS certificates (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  cert_id    TEXT UNIQUE NOT NULL,
  user_id    INTEGER NOT NULL,
  user_name  TEXT,
  theme      TEXT,
  zone       TEXT,
  score      INTEGER,
  total      INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

const CERT_PASS = 0.8; // seuil de réussite : 80 %

app.post('/certificates', requireAuth, (req, res) => {
  const { theme, zone, score, total } = req.body || {};
  const sc = Number(score), tt = Number(total);
  if (!theme || !tt || tt <= 0) return err(res, 400, 'theme et total requis');
  if (sc / tt < CERT_PASS) return err(res, 400, `Score insuffisant (minimum ${Math.round(CERT_PASS*100)}%)`);
  const cleanTheme = String(theme).slice(0, 160);
  // Réutilise un certificat déjà émis pour le même utilisateur + thème (pas de doublon)
  const existing = db.prepare('SELECT cert_id, created_at FROM certificates WHERE user_id = ? AND theme = ? ORDER BY id DESC LIMIT 1').get(req.user.id, cleanTheme);
  if (existing) return ok(res, { certificate_id: existing.cert_id, date: (existing.created_at || '').slice(0, 10) });
  const cid = 'RA-' + new Date().getFullYear() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const u = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
  db.prepare('INSERT INTO certificates (cert_id, user_id, user_name, theme, zone, score, total) VALUES (?,?,?,?,?,?,?)')
    .run(cid, req.user.id, (u && u.name) || '', cleanTheme, String(zone || '').slice(0, 40), sc, tt);
  return ok(res, { certificate_id: cid, date: new Date().toISOString().slice(0, 10) });
});

/* ── TOURNOIS legacy /tournaments/* — désactivées, utiliser /tournament/* ── */
app.post('/tournaments', requireAuth, (req, res) => {
  return err(res, 410, 'Route obsolète — utiliser POST /tournament/create');
});

app.get('/tournaments/:code', requireAuth, (req, res) => {
  const t = db.prepare('SELECT * FROM tournaments WHERE code = ?').get(req.params.code);
  if (!t) return err(res, 404, 'Tournoi introuvable');
  const participants = db.prepare(`
    SELECT u.name, u.country, tp.score, tp.rank
    FROM tournament_participants tp JOIN users u ON u.id = tp.user_id
    WHERE tp.tournament_id = ?
  `).all(t.id);
  return ok(res, { tournament: t, participants });
});

app.post('/tournaments/:code/join', requireAuth, (req, res) => {
  return err(res, 410, 'Route obsolète — utiliser POST /tournament/join');
});

app.post('/tournaments/:code/start', requireAuth, (req, res) => {
  return err(res, 410, 'Route obsolète — utiliser POST /tournament/:code/start-qualif');
});

// SECURITE FIX : route legacy /tournaments/:code/score désactivée — scores acceptés côté client sans validation.
// Utiliser /tournament/qualify à la place (validation serveur).
app.post('/tournaments/:code/score', requireAuth, (req, res) => {
  return err(res, 410, 'Route obsolète — utiliser POST /tournament/qualify');
});

/* ================================================================
   ROUTES TOURNOI AVANCÉ — /tournament/* (TOURNOI AJOUT)
================================================================ */

const UEMOA_PAYS = ['SN','CI','BF','ML','BJ','NE','TG','GW']; // TOURNOI AJOUT
const CEMAC_PAYS = ['CM','GA','CG','CF','GQ','TD']; // TOURNOI AJOUT

function _zoneOf(country) { // TOURNOI AJOUT
  if (UEMOA_PAYS.includes(country)) return 'uemoa'; // TOURNOI AJOUT
  if (CEMAC_PAYS.includes(country)) return 'cemac'; // TOURNOI AJOUT
  return null; // TOURNOI AJOUT
} // TOURNOI AJOUT

function _peutRejoindre(userCountry, tCountry, tZone) { // TOURNOI AJOUT
  if (!userCountry) return false; // TOURNOI AJOUT
  if (tZone === 'uemoa') return UEMOA_PAYS.includes(userCountry); // TOURNOI AJOUT
  if (tZone === 'cemac') return CEMAC_PAYS.includes(userCountry); // TOURNOI AJOUT
  if (tZone === 'inter') return UEMOA_PAYS.includes(userCountry) || CEMAC_PAYS.includes(userCountry); // TOURNOI AJOUT
  if (tZone === 'country') return tCountry === userCountry; // TOURNOI AJOUT
  return false; // TOURNOI AJOUT
} // TOURNOI AJOUT

function _tFull(code) { // TOURNOI AJOUT
  const t = db.prepare('SELECT * FROM tournaments WHERE code = ?').get(code); // TOURNOI AJOUT
  if (!t) return null; // TOURNOI AJOUT
  const participants = db.prepare( // TOURNOI AJOUT
    'SELECT tp.*, u.name, u.country, u.etablissement FROM tournament_participants tp JOIN users u ON u.id = tp.user_id WHERE tp.tournament_id = ? ORDER BY tp.score DESC, COALESCE(tp.rank,9999) ASC' // TOURNOI AJOUT
  ).all(t.id); // TOURNOI AJOUT
  const matches = db.prepare( // TOURNOI AJOUT
    'SELECT tm.*, u1.name AS p1_name, u1.country AS p1_country, u2.name AS p2_name, u2.country AS p2_country, uw.name AS winner_name FROM tournament_matches tm LEFT JOIN users u1 ON u1.id = tm.player1_id LEFT JOIN users u2 ON u2.id = tm.player2_id LEFT JOIN users uw ON uw.id = tm.winner_id WHERE tm.tournament_id = ? ORDER BY tm.round, tm.id' // TOURNOI AJOUT
  ).all(t.id); // TOURNOI AJOUT
  const creator = db.prepare('SELECT id, name, country FROM users WHERE id = ?').get(t.creator_id); // TOURNOI AJOUT
  return { ...t, participants, matches, creator }; // TOURNOI AJOUT
} // TOURNOI AJOUT

/* POST /tournament/create */
app.post('/tournament/create', requireAuth, (req, res) => { // TOURNOI AJOUT
  const { name, zone, pack_id, max_players, start_date } = req.body || {}; // TOURNOI AJOUT
  if (!name || !zone) return err(res, 400, 'name et zone requis'); // TOURNOI AJOUT
  if (!['uemoa','cemac','inter','country'].includes(zone)) return err(res, 400, 'Zone invalide'); // TOURNOI AJOUT
  const mp = Number(max_players); // TOURNOI AJOUT
  if (![4,8,16,32].includes(mp)) return err(res, 400, 'max_players doit être 4, 8, 16 ou 32'); // MODIFIÉ
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id); // TOURNOI AJOUT
  if (!user) return err(res, 401, 'Session expirée, reconnecte-toi'); // MODIFIÉ — anti-crash user undefined
  if (!_peutRejoindre(user.country, user.country, zone)) { // TOURNOI AJOUT
    return err(res, 403, 'Vous ne pouvez pas créer un tournoi hors de votre zone'); // TOURNOI AJOUT
  } // TOURNOI AJOUT
  let code; // TOURNOI AJOUT
  for (let i = 0; i < 10; i++) { // TOURNOI AJOUT
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase(); // TOURNOI AJOUT
    code = 'T-' + rand; // TOURNOI AJOUT
    if (!db.prepare('SELECT id FROM tournaments WHERE code = ?').get(code)) break; // TOURNOI AJOUT
  } // TOURNOI AJOUT
  const result = db.prepare( // TOURNOI AJOUT
    'INSERT INTO tournaments (code, creator_id, name, pack_id, max_players, status, country, zone, start_date) VALUES (?,?,?,?,?,?,?,?,?)' // TOURNOI AJOUT
  ).run(code, req.user.id, name.trim().slice(0,80), pack_id || 'general', mp, 'waiting', user.country || '', zone, start_date || ''); // TOURNOI AJOUT
  db.prepare('INSERT INTO tournament_participants (tournament_id, user_id) VALUES (?,?)').run(result.lastInsertRowid, req.user.id); // TOURNOI AJOUT
  notifyAllExcept(req.user.id, 'tournament_created', '🏆 ' + user.name + ' crée le tournoi "' + name.trim() + '" ! Code : ' + code); // TOURNOI AJOUT
  return ok(res, { code, id: result.lastInsertRowid }); // TOURNOI AJOUT
}); // TOURNOI AJOUT

/* POST /tournament/join */
app.post('/tournament/join', requireAuth, (req, res) => { // TOURNOI AJOUT
  const { code } = req.body || {}; // TOURNOI AJOUT
  if (!code) return err(res, 400, 'code requis'); // TOURNOI AJOUT
  const t = db.prepare('SELECT * FROM tournaments WHERE code = ?').get(code.trim().toUpperCase()); // TOURNOI AJOUT
  if (!t) return err(res, 404, 'Tournoi introuvable'); // TOURNOI AJOUT
  if (!['waiting','qualif'].includes(t.status)) return err(res, 400, 'Inscriptions fermées pour ce tournoi'); // TOURNOI AJOUT
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id); // TOURNOI AJOUT
  if (!_peutRejoindre(user.country, t.country, t.zone)) { // TOURNOI AJOUT
    const z = t.zone === 'country' ? ('pays ' + t.country) : ('zone ' + t.zone.toUpperCase()); // TOURNOI AJOUT
    return err(res, 403, 'Ce tournoi est réservé à la ' + z + '. Votre pays (' + (user.country || '?') + ') n\'est pas éligible.'); // TOURNOI AJOUT
  } // TOURNOI AJOUT
  const already = db.prepare('SELECT id FROM tournament_participants WHERE tournament_id = ? AND user_id = ?').get(t.id, req.user.id); // TOURNOI AJOUT
  if (already) return ok(res, { message: 'Déjà inscrit', tournament: _tFull(t.code) }); // TOURNOI AJOUT
  const count = db.prepare('SELECT COUNT(*) AS n FROM tournament_participants WHERE tournament_id = ?').get(t.id).n; // TOURNOI AJOUT
  if (count >= t.max_players) return err(res, 400, 'Tournoi complet (' + count + '/' + t.max_players + ')'); // TOURNOI AJOUT
  db.prepare('INSERT INTO tournament_participants (tournament_id, user_id) VALUES (?,?)').run(t.id, req.user.id); // TOURNOI AJOUT
  db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?,?,?)').run(t.creator_id, 'tournament_joined', '🏟 ' + user.name + ' a rejoint "' + t.name + '" ! (' + (count+1) + '/' + t.max_players + ')'); // TOURNOI AJOUT
  return ok(res, { message: 'Inscrit au tournoi', tournament: _tFull(t.code) }); // TOURNOI AJOUT
}); // TOURNOI AJOUT

/* GET /tournament/list */
app.get('/tournament/list', requireAuth, (req, res) => { // TOURNOI AJOUT
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id); // TOURNOI AJOUT
  if (!user) return err(res, 401, 'Session expirée, reconnecte-toi'); // MODIFIÉ — anti-crash user undefined
  const uZone = _zoneOf(user.country); // TOURNOI AJOUT
  // SECURITE FIX : utiliser des paramètres SQLite au lieu de l'interpolation de chaîne (anti-injection SQL)
  const BASE_OPEN_SQL = `SELECT t.*, u.name AS creator_name, (SELECT COUNT(*) FROM tournament_participants tp WHERE tp.tournament_id = t.id) AS nb FROM tournaments t JOIN users u ON u.id = t.creator_id WHERE t.status IN ('waiting','qualif','elim') AND (t.start_date = '' OR datetime(t.start_date) IS NULL OR datetime(t.start_date) >= datetime('now','-1 day'))`; // SECURITE FIX // MODIFIÉ — exclut les tournois programmés expirés
  const open = uZone // SECURITE FIX
    ? db.prepare(BASE_OPEN_SQL + ` AND (t.zone = ? OR t.zone = 'inter') ORDER BY t.created_at DESC LIMIT 30`).all(uZone) // SECURITE FIX
    : db.prepare(BASE_OPEN_SQL + ` ORDER BY t.created_at DESC LIMIT 30`).all(); // SECURITE FIX
  const mine = db.prepare( // TOURNOI AJOUT
    'SELECT t.*, u.name AS creator_name, (SELECT COUNT(*) FROM tournament_participants tp WHERE tp.tournament_id = t.id) AS nb FROM tournaments t JOIN users u ON u.id = t.creator_id JOIN tournament_participants tp2 ON tp2.tournament_id = t.id AND tp2.user_id = ? ORDER BY t.created_at DESC LIMIT 20' // TOURNOI AJOUT
  ).all(req.user.id); // TOURNOI AJOUT
  return ok(res, { open, mine }); // TOURNOI AJOUT
}); // TOURNOI AJOUT

/* POST /tournament/qualify */
app.post('/tournament/qualify', requireAuth, (req, res) => { // TOURNOI AJOUT
  const { tournament_id, score, total, questions_json } = req.body || {}; // TOURNOI AJOUT
  if (!tournament_id || score == null || total == null) return err(res, 400, 'tournament_id, score, total requis')
     if (Number(score) < 0 || Number(score) > Number(total)) return err(res, 400, 'Score invalide'); // SECURITE FIX
  if (Number(total) <= 0 || Number(total) > 20) return err(res, 400, 'Total invalide'); // SECURITE FIX
  if (Number(score) > 2000) return err(res, 400, 'Score suspect'); // SECURITE FIX; // TOURNOI AJOUT
  const t = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(Number(tournament_id)); // TOURNOI AJOUT
  if (!t) return err(res, 404, 'Tournoi introuvable'); // TOURNOI AJOUT
  if (!['qualif','waiting'].includes(t.status)) return err(res, 400, 'Phase de qualification non active'); // TOURNOI AJOUT
  const part = db.prepare('SELECT * FROM tournament_participants WHERE tournament_id = ? AND user_id = ?').get(t.id, req.user.id); // TOURNOI AJOUT
  if (!part) return err(res, 403, 'Non inscrit à ce tournoi'); // TOURNOI AJOUT
  if (part.score > 0) return err(res, 400, 'Qualification déjà soumise (score : ' + part.score + ')'); // TOURNOI AJOUT
  db.prepare('UPDATE tournament_participants SET score = ?, total = ? WHERE tournament_id = ? AND user_id = ?') // TOURNOI AJOUT
    .run(Number(score), Number(total), t.id, req.user.id); // TOURNOI AJOUT
  const allPart = db.prepare('SELECT * FROM tournament_participants WHERE tournament_id = ? ORDER BY score DESC').all(t.id); // TOURNOI AJOUT
  const qualifN = Math.floor(t.max_players / 2); // TOURNOI AJOUT
  allPart.forEach((p, i) => { // TOURNOI AJOUT
    db.prepare('UPDATE tournament_participants SET rank = ?, qualified = ? WHERE id = ?').run(i + 1, i < qualifN ? 1 : 0, p.id); // TOURNOI AJOUT
  }); // TOURNOI AJOUT
  try { // TOURNOI AJOUT
    db.prepare('INSERT INTO tournament_match_sheets (tournament_id, match_id, player_id, questions_json, score) VALUES (?,?,?,?,?)') // TOURNOI AJOUT
      .run(t.id, null, req.user.id, JSON.stringify(questions_json || []), Number(score)); // TOURNOI AJOUT
  } catch(_) {} // TOURNOI AJOUT
  const myRank = allPart.findIndex(p => p.user_id === req.user.id) + 1; // TOURNOI AJOUT
  const user = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id); // TOURNOI AJOUT
  if (t.creator_id !== req.user.id) { // TOURNOI AJOUT
    db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?,?,?)') // TOURNOI AJOUT
      .run(t.creator_id, 'tournament_qualified', '⚡ ' + user.name + ' — qualification : ' + score + '/' + total + ' pts (#' + myRank + ')'); // TOURNOI AJOUT
  } // TOURNOI AJOUT
  return ok(res, { message: 'Score de qualification enregistré', rank: myRank }); // TOURNOI AJOUT
}); // TOURNOI AJOUT

/* GET /tournament/match-sheet/:matchId */
app.get('/tournament/match-sheet/:matchId', requireAuth, (req, res) => { // TOURNOI AJOUT
  const midRaw = req.params.matchId; // TOURNOI AJOUT
  let sheets; // TOURNOI AJOUT
  if (midRaw === 'qualify') { // TOURNOI AJOUT
    const tId = Number(req.query.tournament_id); // TOURNOI AJOUT
    sheets = db.prepare('SELECT tms.*, u.name FROM tournament_match_sheets tms JOIN users u ON u.id = tms.player_id WHERE tms.tournament_id = ? AND tms.match_id IS NULL').all(tId); // TOURNOI AJOUT
  } else { // TOURNOI AJOUT
    sheets = db.prepare('SELECT tms.*, u.name FROM tournament_match_sheets tms JOIN users u ON u.id = tms.player_id WHERE tms.match_id = ?').all(Number(midRaw)); // TOURNOI AJOUT
  } // TOURNOI AJOUT
  return ok(res, { sheets }); // TOURNOI AJOUT
}); // TOURNOI AJOUT

/* GET /tournament/:code */
app.get('/tournament/:code', requireAuth, (req, res) => { // TOURNOI AJOUT
  const t = _tFull(req.params.code); // TOURNOI AJOUT
  if (!t) return err(res, 404, 'Tournoi introuvable'); // TOURNOI AJOUT
  const myPart = t.participants.find(p => p.user_id === req.user.id) || null; // TOURNOI AJOUT
  return ok(res, { tournament: t, participants: t.participants, matches: t.matches, creator: t.creator, my_participant: myPart }); // TOURNOI AJOUT
}); // TOURNOI AJOUT

/* GET /tournament/:id/bracket */
app.get('/tournament/:id/bracket', requireAuth, (req, res) => { // TOURNOI AJOUT
  const id = Number(req.params.id); // TOURNOI AJOUT
  if (!id) return err(res, 400, 'id numérique requis'); // TOURNOI AJOUT
  const t = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id); // TOURNOI AJOUT
  if (!t) return err(res, 404, 'Tournoi introuvable'); // TOURNOI AJOUT
  const matches = db.prepare( // TOURNOI AJOUT
    'SELECT tm.*, u1.name AS p1_name, u1.country AS p1_country, u2.name AS p2_name, u2.country AS p2_country, uw.name AS winner_name FROM tournament_matches tm LEFT JOIN users u1 ON u1.id = tm.player1_id LEFT JOIN users u2 ON u2.id = tm.player2_id LEFT JOIN users uw ON uw.id = tm.winner_id WHERE tm.tournament_id = ? ORDER BY tm.round, tm.id' // TOURNOI AJOUT
  ).all(id); // TOURNOI AJOUT
  const participants = db.prepare( // TOURNOI AJOUT
    'SELECT tp.*, u.name, u.country FROM tournament_participants tp JOIN users u ON u.id = tp.user_id WHERE tp.tournament_id = ? ORDER BY COALESCE(tp.rank,9999) ASC, tp.score DESC' // TOURNOI AJOUT
  ).all(id); // TOURNOI AJOUT
  return ok(res, { tournament: t, matches, participants }); // TOURNOI AJOUT
}); // TOURNOI AJOUT

/* POST /tournament/:code/start-qualif */
app.post('/tournament/:code/start-qualif', requireAuth, (req, res) => { // TOURNOI AJOUT
  const t = db.prepare('SELECT * FROM tournaments WHERE code = ?').get(req.params.code); // TOURNOI AJOUT
  if (!t) return err(res, 404, 'Tournoi introuvable'); // TOURNOI AJOUT
  if (t.creator_id !== req.user.id) return err(res, 403, 'Seul le créateur peut lancer les qualifications'); // TOURNOI AJOUT
  if (t.status !== 'waiting') return err(res, 400, 'Statut invalide — attendu: waiting'); // TOURNOI AJOUT
  const parts = db.prepare('SELECT user_id FROM tournament_participants WHERE tournament_id = ?').all(t.id); // MODIFIÉ
  if (parts.length < 4) return err(res, 400, 'Minimum 4 participants requis pour lancer les qualifications (actuellement : ' + parts.length + ')'); // MODIFIÉ
  db.prepare('UPDATE tournaments SET status = ? WHERE code = ?').run('qualif', req.params.code); // TOURNOI AJOUT
  const ins = db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?,?,?)'); // TOURNOI AJOUT
  const tx = db.transaction(() => parts.forEach(p => { // TOURNOI AJOUT
    if (p.user_id !== req.user.id) ins.run(p.user_id, 'tournament_qualif_start', '⚡ Qualifications ouvertes pour "' + t.name + '" ! Code : ' + t.code); // TOURNOI AJOUT
  })); // TOURNOI AJOUT
  tx(); // TOURNOI AJOUT
  return ok(res, { message: 'Phase de qualification lancée' }); // TOURNOI AJOUT
}); // TOURNOI AJOUT

/* POST /tournament/:code/generate-bracket */
app.post('/tournament/:code/generate-bracket', requireAuth, (req, res) => { // TOURNOI AJOUT
  const t = db.prepare('SELECT * FROM tournaments WHERE code = ?').get(req.params.code); // TOURNOI AJOUT
  if (!t) return err(res, 404, 'Tournoi introuvable'); // TOURNOI AJOUT
  if (t.creator_id !== req.user.id) return err(res, 403, 'Seul le créateur peut générer le bracket'); // TOURNOI AJOUT
  if (!['qualif','waiting'].includes(t.status)) return err(res, 400, 'Phase invalide pour générer un bracket'); // TOURNOI AJOUT
  const participants = db.prepare('SELECT * FROM tournament_participants WHERE tournament_id = ? ORDER BY score DESC').all(t.id); // TOURNOI AJOUT
  if (participants.length < 2) return err(res, 400, 'Minimum 2 participants requis'); // TOURNOI AJOUT
  db.prepare('DELETE FROM tournament_matches WHERE tournament_id = ?').run(t.id); // TOURNOI AJOUT
  const mIns = db.prepare('INSERT INTO tournament_matches (tournament_id, round, player1_id, player2_id, duel_code, status) VALUES (?,?,?,?,?,?)'); // TOURNOI AJOUT
  const dIns = db.prepare('INSERT INTO duels (code, creator_id, pack_id, num_questions, timer_sec) VALUES (?,?,?,?,?)'); // TOURNOI AJOUT
  const tx = db.transaction(() => { // TOURNOI AJOUT
    const pairs = Math.floor(participants.length / 2); // TOURNOI AJOUT
    for (let i = 0; i < pairs; i++) { // TOURNOI AJOUT
      const p1 = participants[i * 2]; // TOURNOI AJOUT
      const p2 = participants[i * 2 + 1]; // TOURNOI AJOUT
      let dCode; // TOURNOI AJOUT
      for (let j = 0; j < 10; j++) { // TOURNOI AJOUT
        dCode = genCode('D'); // TOURNOI AJOUT
        if (!db.prepare('SELECT id FROM duels WHERE code = ?').get(dCode)) break; // TOURNOI AJOUT
      } // TOURNOI AJOUT
      dIns.run(dCode, p1.user_id, t.pack_id || 'general', 10, 30); // TOURNOI AJOUT
      mIns.run(t.id, 1, p1.user_id, p2.user_id, dCode, 'pending'); // TOURNOI AJOUT
    } // TOURNOI AJOUT
  }); // TOURNOI AJOUT
  tx(); // TOURNOI AJOUT
  db.prepare('UPDATE tournaments SET status = ? WHERE code = ?').run('elim', req.params.code); // TOURNOI AJOUT
  const allParts = db.prepare('SELECT user_id FROM tournament_participants WHERE tournament_id = ?').all(t.id); // TOURNOI AJOUT
  const nIns = db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?,?,?)'); // TOURNOI AJOUT
  const nTx = db.transaction(() => allParts.forEach(p => nIns.run(p.user_id, 'tournament_bracket', '🏆 Bracket généré pour "' + t.name + '" ! Les matchs d\'élimination débutent.'))); // TOURNOI AJOUT
  nTx(); // TOURNOI AJOUT
  return ok(res, { message: 'Bracket généré', tournament: _tFull(req.params.code) }); // TOURNOI AJOUT
}); // TOURNOI AJOUT

/* DELETE /tournaments/:code/leave — participant quitte un tournoi en attente */ // MODIFIÉ
app.delete('/tournaments/:code/leave', requireAuth, (req, res) => { // MODIFIÉ
  const t = db.prepare('SELECT * FROM tournaments WHERE code = ?').get(req.params.code); // MODIFIÉ
  if (!t) return err(res, 404, 'Tournoi introuvable'); // MODIFIÉ
  if (t.status !== 'waiting') return err(res, 400, 'Impossible de quitter un tournoi déjà lancé'); // MODIFIÉ
  if (t.creator_id === req.user.id) return err(res, 400, 'Le créateur ne peut pas quitter son propre tournoi'); // MODIFIÉ
  db.prepare('DELETE FROM tournament_participants WHERE tournament_id = ? AND user_id = ?').run(t.id, req.user.id); // MODIFIÉ
  return ok(res, { message: 'Tournoi quitté' }); // MODIFIÉ
}); // MODIFIÉ

/* POST /tournament/match/:matchId/record */
app.post('/tournament/match/:matchId/record', requireAuth, (req, res) => { // TOURNOI AJOUT
  const matchId = Number(req.params.matchId); // TOURNOI AJOUT
  const { winner_id, duel_code } = req.body || {}; // TOURNOI AJOUT
  if (!winner_id) return err(res, 400, 'winner_id requis'); // TOURNOI AJOUT
  const match = db.prepare('SELECT * FROM tournament_matches WHERE id = ?').get(matchId); // TOURNOI AJOUT
  if (!match) return err(res, 404, 'Match introuvable'); // TOURNOI AJOUT
  const wId = Number(winner_id); // TOURNOI AJOUT
  if (wId !== req.user.id) return err(res, 403, 'Tu ne peux déclarer que ta propre victoire');
  if (match.player1_id !== wId && match.player2_id !== wId) return err(res, 400, 'winner_id invalide');
 if (!match.duel_code) return err(res, 400, 'Duel non associé à ce match'); // SECURITE FIX
  const duel = db.prepare('SELECT status FROM duels WHERE code = ?').get(match.duel_code);
  if (!duel || duel.status !== 'finished') return err(res, 400, 'Duel pas encore terminé');
  db.prepare('UPDATE tournament_matches SET winner_id = ?, status = ? WHERE id = ?').run(wId, 'done', matchId); // TOURNOI AJOUT
  return ok(res, { message: 'Résultat enregistré' }); // TOURNOI AJOUT
}); // TOURNOI AJOUT

/* GET /tournament-chat/:tournamentId */
app.get('/tournament-chat/:tournamentId', requireAuth, (req, res) => { // TOURNOI AJOUT
  const tId = Number(req.params.tournamentId); // TOURNOI AJOUT
  if (!tId) return err(res, 400, 'tournamentId invalide'); // TOURNOI AJOUT
  // SECURITE FIX : lecture du chat réservée aux participants du tournoi
  const isParticipant = db.prepare('SELECT id FROM tournament_participants WHERE tournament_id = ? AND user_id = ?').get(tId, req.user.id); // SECURITE FIX
  if (!isParticipant) return err(res, 403, 'Accès réservé aux participants du tournoi'); // SECURITE FIX
  const msgs = db.prepare( // TOURNOI AJOUT
    'SELECT tc.id, tc.content, tc.sent_at, u.name, u.country FROM tournament_chat tc JOIN users u ON u.id = tc.user_id WHERE tc.tournament_id = ? ORDER BY tc.sent_at DESC LIMIT 60' // TOURNOI AJOUT
  ).all(tId).reverse(); // TOURNOI AJOUT
  return ok(res, { messages: msgs }); // TOURNOI AJOUT
}); // TOURNOI AJOUT

/* POST /tournament-chat/:tournamentId */
app.post('/tournament-chat/:tournamentId', requireAuth, (req, res) => { // TOURNOI AJOUT
  const tId = Number(req.params.tournamentId); // TOURNOI AJOUT
  if (!tId) return err(res, 400, 'tournamentId invalide'); // TOURNOI AJOUT
  const { content } = req.body || {}; // TOURNOI AJOUT
  if (!content || !content.trim()) return err(res, 400, 'Message vide'); // TOURNOI AJOUT
  const t = db.prepare('SELECT id FROM tournaments WHERE id = ?').get(tId); // TOURNOI AJOUT
  if (!t) return err(res, 404, 'Tournoi introuvable'); // TOURNOI AJOUT
  // SECURITE FIX : écriture du chat réservée aux participants du tournoi
  const isParticipant = db.prepare('SELECT id FROM tournament_participants WHERE tournament_id = ? AND user_id = ?').get(tId, req.user.id); // SECURITE FIX
  if (!isParticipant) return err(res, 403, 'Accès réservé aux participants du tournoi'); // SECURITE FIX
  db.prepare('INSERT INTO tournament_chat (tournament_id, user_id, content) VALUES (?,?,?)') // TOURNOI AJOUT
    .run(tId, req.user.id, content.trim().slice(0, 500)); // TOURNOI AJOUT
  return ok(res, { message: 'Message envoyé' }); // TOURNOI AJOUT
}); // TOURNOI AJOUT

/* ================================================================
   TABLES FEATURES — invitation bêta, feedback question, organisations
================================================================ */
db.exec(`
  CREATE TABLE IF NOT EXISTS invitations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    code       TEXT    NOT NULL UNIQUE,
    email      TEXT,
    used       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS question_feedback (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id TEXT,
    pack_id     TEXT,
    user_id     INTEGER REFERENCES users(id),
    type        TEXT    NOT NULL DEFAULT 'erreur',
    message     TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS organisations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    admin_user_id INTEGER NOT NULL REFERENCES users(id),
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS org_members (
    org_id    INTEGER NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    user_id   INTEGER NOT NULL REFERENCES users(id),
    role      TEXT    NOT NULL DEFAULT 'member',
    joined_at TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(org_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS org_invitations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    org_id     INTEGER NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    email      TEXT    NOT NULL,
    code       TEXT    NOT NULL UNIQUE,
    used       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

/* ================================================================
   COUMBA ARENA — Jeu de cartes UNO éducatif 2 joueurs
================================================================ */

db.exec(`
  CREATE TABLE IF NOT EXISTS coumba_games (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    code       TEXT    NOT NULL UNIQUE,
    player1_id INTEGER NOT NULL REFERENCES users(id),
    player2_id INTEGER REFERENCES users(id),
    state_json TEXT    NOT NULL DEFAULT '{}',
    status     TEXT    NOT NULL DEFAULT 'waiting',
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

const COUMBA_VF = [
  {q:"Le ratio de solvabilité minimum exigé par la BCEAO pour les banques est de 8%.", a:true},
  {q:"La BCEAO est l'autorité monétaire commune aux 8 pays membres de l'UEMOA.", a:true},
  {q:"Les banques de la zone UEMOA doivent respecter un ratio de liquidité minimum de 75%.", a:true},
  {q:"La COBAC est l'organe de supervision bancaire des établissements de crédit de la zone CEMAC.", a:true},
  {q:"Un établissement de monnaie électronique peut recevoir des dépôts du public comme une banque classique.", a:false},
  {q:"Le capital social minimum pour créer une banque en zone UEMOA est de 10 milliards de FCFA.", a:true},
  {q:"Les banques de la zone CEMAC sont directement contrôlées par la BEAC.", a:false},
  {q:"Le ratio Cooke mesure les fonds propres par rapport aux risques pondérés.", a:true},
  {q:"La BCEAO peut prendre des participations directes dans le capital des banques commerciales.", a:false},
  {q:"La loi bancaire de l'UEMOA exige un agrément préalable pour exercer l'activité bancaire.", a:true},
  {q:"Les SFD (Systèmes Financiers Décentralisés) en UEMOA sont régis par une loi spécifique.", a:true},
  {q:"Le secret bancaire s'applique même vis-à-vis des autorités judiciaires en toutes circonstances.", a:false},
  {q:"La BCEAO peut retirer l'agrément d'un établissement de crédit en cas de manquements graves.", a:true},
  {q:"Dans la zone UEMOA, les fonds propres nets d'un établissement doivent être positifs en permanence.", a:true},
  {q:"Le ratio de division des risques plafonne les engagements sur un même bénéficiaire à 75% des fonds propres.", a:true},
  {q:"Les banques en zone UEMOA peuvent librement convertir le FCFA en devises sans autorisation de la BCEAO.", a:false},
  {q:"La COBAC délivre les agréments aux établissements de crédit de la zone CEMAC.", a:true},
  {q:"La BCEAO a son siège social à Dakar, au Sénégal.", a:true},
  {q:"Les établissements de monnaie électronique sont soumis au dispositif anti-blanchiment.", a:true},
  {q:"Les banques islamiques sont totalement exemptées des ratios prudentiels classiques.", a:false},
  {q:"La BEAC est la banque centrale commune aux six États membres de la CEMAC.", a:true},
  {q:"Un établissement de crédit peut opérer une transformation en SFD sans agrément préalable.", a:false},
  {q:"Les comptes de correspondants bancaires sont soumis à la vigilance anti-blanchiment.", a:true},
  {q:"Le taux directeur de la BCEAO influence directement les taux des crédits accordés par les banques.", a:true},
  {q:"Les dépôts des clients sont garantis à 100% par l'État en cas de faillite bancaire en zone UEMOA.", a:false},
  {q:"La réglementation prudentielle UEMOA s'inspire des accords de Bâle III.", a:true},
  {q:"Les dirigeants d'établissements de crédit condamnés pour fraude restent éligibles à leurs fonctions.", a:false},
  {q:"Le plan comptable bancaire de l'UEMOA est harmonisé entre tous les pays membres.", a:true},
  {q:"La surveillance macro-prudentielle relève de la compétence de la BCEAO en zone UEMOA.", a:true},
  {q:"Les établissements financiers à caractère bancaire peuvent accepter des dépôts à vue du public.", a:false},
];

function coumbaNewDeck() {
  const deck = [];
  for (const c of ['r','b','g','o']) {
    for (let n = 1; n <= 9; n++) deck.push({c, v: String(n)});
    deck.push({c, v:'+2'});
    deck.push({c, v:'sk'});
  }
  for (let i = 0; i < 3; i++) deck.push({c:'w', v:'w'});
  for (let i = 0; i < 3; i++) deck.push({c:'w', v:'+4'});
  return coumbaShuffle(deck);
}

function coumbaShuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function coumbaCanPlay(card, top) {
  if (card.v==='w'||card.v==='+4') return true;
  return card.c===top.c || card.v===top.v;
}

function coumbaGetState(code) {
  const g = db.prepare('SELECT * FROM coumba_games WHERE code = ?').get(code);
  if (!g) return null;
  const p1 = db.prepare('SELECT id,name,country FROM users WHERE id = ?').get(g.player1_id);
  const p2 = g.player2_id ? db.prepare('SELECT id,name,country FROM users WHERE id = ?').get(g.player2_id) : null;
  let state = {};
  try { state = JSON.parse(g.state_json); } catch(_) {}
  return {...g, player1: p1, player2: p2, state};
}

/* POST /coumba — créer une partie */
app.post('/coumba', requireAuth, (req, res) => {
  let code;
  for (let i = 0; i < 10; i++) {
    code = genCode('C');
    if (!db.prepare('SELECT id FROM coumba_games WHERE code = ?').get(code)) break;
  }
  db.prepare('INSERT INTO coumba_games (code, player1_id) VALUES (?,?)').run(code, req.user.id);
  return ok(res, {code, game: coumbaGetState(code)});
});

/* POST /coumba/:code/join */
app.post('/coumba/:code/join', requireAuth, (req, res) => {
  const g = db.prepare('SELECT * FROM coumba_games WHERE code = ?').get(req.params.code);
  if (!g) return err(res, 404, 'Partie introuvable');
  if (g.player1_id === req.user.id) return ok(res, {message:'Tu es le créateur', game: coumbaGetState(req.params.code)});
  if (g.status !== 'waiting') return err(res, 400, 'Partie déjà commencée');
  if (g.player2_id) return err(res, 400, 'Partie complète');
  db.prepare('UPDATE coumba_games SET player2_id=?, status=? WHERE code=?').run(req.user.id, 'joined', req.params.code);
  db.prepare('INSERT INTO notifications (user_id,type,message) VALUES (?,?,?)').run(g.player1_id, 'coumba_joined', `🃏 ${req.user.name} a rejoint ta partie Coumba ! Code : ${req.params.code}`);
  return ok(res, {message:'Rejoint', game: coumbaGetState(req.params.code)});
});

/* POST /coumba/:code/start */
app.post('/coumba/:code/start', requireAuth, (req, res) => {
  const g = db.prepare('SELECT * FROM coumba_games WHERE code = ?').get(req.params.code);
  if (!g) return err(res, 404, 'Partie introuvable');
  if (g.player1_id !== req.user.id) return err(res, 403, 'Seul le créateur peut démarrer');
  if (!g.player2_id) return err(res, 400, "En attente d'un adversaire");
  if (g.status === 'active') return ok(res, {message:'Déjà active', game: coumbaGetState(req.params.code)});
  const deck = coumbaNewDeck();
  const hand1 = deck.splice(0, 7);
  const hand2 = deck.splice(0, 7);
  let firstIdx = deck.findIndex(c => c.v !== '+4' && c.v !== 'w');
  if (firstIdx < 0) firstIdx = 0;
  const [topCard] = deck.splice(firstIdx, 1);
  const state = {deck, discard:[topCard], hand1, hand2, cur:1, pending:null, winner_id:null, msg:'La partie commence !'};
  db.prepare('UPDATE coumba_games SET status=?, state_json=? WHERE code=?').run('active', JSON.stringify(state), req.params.code);
  return ok(res, {game: coumbaGetState(req.params.code)});
});

/* GET /coumba/:code/state */
app.get('/coumba/:code/state', requireAuth, (req, res) => {
  const g = coumbaGetState(req.params.code);
  if (!g) return err(res, 404, 'Partie introuvable');
  if (g.player1_id !== req.user.id && g.player2_id !== req.user.id) return err(res, 403, 'Accès refusé');
  const isP1 = g.player1_id === req.user.id;
  const myHand = isP1 ? (g.state.hand1||[]) : (g.state.hand2||[]);
  const oppCount = isP1 ? (g.state.hand2||[]).length : (g.state.hand1||[]).length;
  const top = g.state.discard ? g.state.discard[g.state.discard.length-1] : null;
  const myNum = isP1 ? 1 : 2;
  let pendingForMe = null;
  if (g.state.pending && g.state.pending.target === myNum) {
    pendingForMe = {q: g.state.pending.q, effect: g.state.pending.effect};
  }
  return ok(res, {
    status: g.status, code: g.code,
    player1: g.player1, player2: g.player2,
    my_hand: myHand, opp_count: oppCount,
    top_card: top, deck_count: (g.state.deck||[]).length,
    is_my_turn: g.state.cur === myNum,
    pending: pendingForMe,
    winner_id: g.state.winner_id||null,
    msg: g.state.msg||'',
    my_player: myNum, cur: g.state.cur,
  });
});

/* POST /coumba/:code/play */
app.post('/coumba/:code/play', requireAuth, (req, res) => {
  const {card_index, chosen_color} = req.body || {};
  const g = db.prepare('SELECT * FROM coumba_games WHERE code = ?').get(req.params.code);
  if (!g) return err(res, 404, 'Partie introuvable');
  if (g.status !== 'active') return err(res, 400, 'Partie non active');
  if (g.player1_id !== req.user.id && g.player2_id !== req.user.id) return err(res, 403, 'Accès refusé');
  let state; try { state = JSON.parse(g.state_json); } catch(_) { return err(res, 500, 'État corrompu'); }
  const isP1 = g.player1_id === req.user.id;
  const myNum = isP1 ? 1 : 2;
  if (state.cur !== myNum) return err(res, 400, "Ce n'est pas ton tour");
  if (state.pending) return err(res, 400, 'Réponds à la question en attente');
  const myHand = isP1 ? state.hand1 : state.hand2;
  const idx = Number(card_index);
  if (!Number.isInteger(idx)||idx<0||idx>=myHand.length) return err(res, 400, 'Index invalide');
  const card = myHand[idx];
  const top = state.discard[state.discard.length-1];
  if (!coumbaCanPlay(card, top)) return err(res, 400, 'Carte non jouable');
  if ((card.v==='w'||card.v==='+4') && !['r','b','g','o'].includes(chosen_color)) return err(res, 400, 'Couleur requise');
  myHand.splice(idx, 1);
  if (isP1) state.hand1 = myHand; else state.hand2 = myHand;
  const played = (card.v==='w'||card.v==='+4') ? {...card, c:chosen_color} : card;
  state.discard.push(played);
  if (myHand.length === 0) {
    state.winner_id = req.user.id;
    state.msg = `🏆 Victoire !`;
    db.prepare('UPDATE coumba_games SET status=?, state_json=? WHERE code=?').run('finished', JSON.stringify(state), g.code);
    db.prepare('INSERT INTO user_scores (user_id, pack_id, score, total) VALUES (?,?,?,?)').run(req.user.id,'coumba',100,100);
    return ok(res, {win:true});
  }
  const oppNum = myNum===1?2:1;
  if (card.v==='+2'||card.v==='+4'||card.v==='sk') {
    const vf = COUMBA_VF[Math.floor(Math.random()*COUMBA_VF.length)];
    state.pending = {q:vf.q, a:vf.a, target:oppNum, effect:card.v};
    state.cur = oppNum;
    state.msg = `⚠️ Question pour le joueur ${oppNum} !`;
  } else {
    state.cur = oppNum;
    state.msg = `Tour du joueur ${oppNum}`;
  }
  db.prepare('UPDATE coumba_games SET state_json=? WHERE code=?').run(JSON.stringify(state), g.code);
  return ok(res, {ok:true});
});

/* POST /coumba/:code/draw */
app.post('/coumba/:code/draw', requireAuth, (req, res) => {
  const g = db.prepare('SELECT * FROM coumba_games WHERE code = ?').get(req.params.code);
  if (!g) return err(res, 404, 'Partie introuvable');
  if (g.status !== 'active') return err(res, 400, 'Partie non active');
  if (g.player1_id !== req.user.id && g.player2_id !== req.user.id) return err(res, 403, 'Accès refusé');
  let state; try { state = JSON.parse(g.state_json); } catch(_) { return err(res, 500, 'État corrompu'); }
  const isP1 = g.player1_id === req.user.id;
  const myNum = isP1 ? 1 : 2;
  if (state.cur !== myNum) return err(res, 400, "Ce n'est pas ton tour");
  if (state.pending) return err(res, 400, 'Réponds à la question en attente');
  if (state.deck.length === 0) {
    const top = state.discard.pop();
    state.deck = coumbaShuffle(state.discard);
    state.discard = [top];
  }
  const drawn = state.deck.length > 0 ? state.deck.splice(0,1) : [];
  if (isP1) state.hand1.push(...drawn); else state.hand2.push(...drawn);
  const oppNum = myNum===1?2:1;
  state.cur = oppNum;
  state.msg = `Joueur ${myNum} pioche. Tour du joueur ${oppNum}.`;
  db.prepare('UPDATE coumba_games SET state_json=? WHERE code=?').run(JSON.stringify(state), g.code);
  return ok(res, {drawn, ok:true});
});

/* POST /coumba/:code/answer */
app.post('/coumba/:code/answer', requireAuth, (req, res) => {
  const {answer} = req.body || {};
  const g = db.prepare('SELECT * FROM coumba_games WHERE code = ?').get(req.params.code);
  if (!g) return err(res, 404, 'Partie introuvable');
  if (g.status !== 'active') return err(res, 400, 'Partie non active');
  if (g.player1_id !== req.user.id && g.player2_id !== req.user.id) return err(res, 403, 'Accès refusé');
  let state; try { state = JSON.parse(g.state_json); } catch(_) { return err(res, 500, 'État corrompu'); }
  if (!state.pending) return err(res, 400, 'Aucune question en attente');
  const isP1 = g.player1_id === req.user.id;
  const myNum = isP1 ? 1 : 2;
  if (state.pending.target !== myNum) return err(res, 400, 'Cette question ne te concerne pas');
  const userAnswer = answer===true||answer==='true';
  const correct = userAnswer === state.pending.a;
  const effect = state.pending.effect;
  const oppNum = myNum===1?2:1;
  const myHand = isP1 ? state.hand1 : state.hand2;
  if (!correct) {
    let drawN = effect==='+2'?2:effect==='+4'?4:0;
    for (let i = 0; i < drawN; i++) {
      if (state.deck.length===0){const top=state.discard.pop();state.deck=coumbaShuffle(state.discard);state.discard=[top];}
      if (state.deck.length>0) myHand.push(state.deck.splice(0,1)[0]);
    }
    if (isP1) state.hand1=myHand; else state.hand2=myHand;
    state.cur = oppNum;
    state.msg = `❌ Mauvaise réponse — ${effect==='sk'?'tour passé':drawN+' cartes piochées'}. Tour du joueur ${oppNum}.`;
  } else {
    state.cur = myNum;
    state.msg = `✅ Bonne réponse — pénalité annulée ! Tour du joueur ${myNum}.`;
  }
  const correctAnswer = state.pending.a;
  state.pending = null;
  db.prepare('UPDATE coumba_games SET state_json=? WHERE code=?').run(JSON.stringify(state), g.code);
  return ok(res, {correct, correct_answer:correctAnswer, ok:true});
});

/* ── CHAT ────────────────────────────────────────────────────────── */
const VALID_ZONES = ['uemoa', 'cemac', 'general'];

app.get('/chat/:zone', requireAuth, (req, res) => {
  const zone = req.params.zone;
  if (!VALID_ZONES.includes(zone)) return err(res, 400, 'Zone invalide');
  const msgs = db.prepare(`
    SELECT m.id, m.content, m.sent_at, u.name, u.country
    FROM messages m JOIN users u ON u.id = m.user_id
    WHERE m.zone = ? ORDER BY m.sent_at DESC LIMIT 50
  `).all(zone).reverse();
  return ok(res, { messages: msgs });
});

app.post('/chat/:zone', requireAuth, (req, res) => {
  const zone = req.params.zone;
  if (!VALID_ZONES.includes(zone)) return err(res, 400, 'Zone invalide');
  const { content } = req.body || {};
  if (!content || !content.trim()) return err(res, 400, 'Message vide');
  const clean = content.trim().slice(0, 500);
  db.prepare('INSERT INTO messages (user_id, zone, content) VALUES (?, ?, ?)').run(req.user.id, zone, clean);
  return ok(res, { message: 'Message envoyé' });
});

/* ── DM ──────────────────────────────────────────────────────────── */
app.get('/dm/:userId', requireAuth, (req, res) => {
  const otherId = Number(req.params.userId);
  if (!otherId || otherId === req.user.id) return err(res, 400, 'userId invalide');
  // FIX : colonnes from_id/to_id (table dm) — sender_id/receiver_id n'existent pas
  const msgs = db.prepare(`
    SELECT d.id, d.content, d.sent_at, u.name,
           CASE WHEN d.from_id = ? THEN 1 ELSE 0 END AS is_mine
    FROM dm d JOIN users u ON u.id = d.from_id
    WHERE (d.from_id = ? AND d.to_id = ?) OR (d.from_id = ? AND d.to_id = ?)
    ORDER BY d.sent_at ASC LIMIT 100
  `).all(req.user.id, req.user.id, otherId, otherId, req.user.id);
  return ok(res, { messages: msgs });
});

app.post('/dm/:userId', requireAuth, (req, res) => {
  const receiverId = Number(req.params.userId);
  if (!receiverId || receiverId === req.user.id) return err(res, 400, 'userId invalide');
  const { content } = req.body || {};
  if (!content || !content.trim()) return err(res, 400, 'Message vide');
  const receiver = db.prepare('SELECT id FROM users WHERE id = ?').get(receiverId);
  if (!receiver) return err(res, 404, 'Destinataire introuvable');
  // FIX : colonnes from_id/to_id (table dm) — sender_id/receiver_id n'existent pas
  db.prepare('INSERT INTO dm (from_id, to_id, content) VALUES (?, ?, ?)').run(req.user.id, receiverId, content.trim().slice(0, 500));
  return ok(res, { message: 'Message envoyé' });
});

/* â”€â”€ STATIC + HEALTH CHECK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/* ================================================================
   ROUTES QUIZ UEMOA OFFICIELS
================================================================ */
const QUIZ_UEMOA = require('./data/quiz_uemoa.json');

/* GET /api/quiz/uemoa — tous les packs */
app.get('/api/quiz/uemoa', (req, res) => {
  return ok(res, { quiz: QUIZ_UEMOA });
});

/* GET /api/quiz/uemoa/mode/:mode — questions filtrées par mode de jeu
   Déclaré AVANT /api/quiz/uemoa/:packId pour éviter le conflit de routing */
app.get('/api/quiz/uemoa/mode/:mode', (req, res) => {
  const mode = req.params.mode.toLowerCase();
  if (!['solo', 'duel', 'tournoi'].includes(mode)) return err(res, 400, 'Mode invalide — valeurs : solo, duel, tournoi');
  const questions = [];
  QUIZ_UEMOA.packs.forEach(pack => {
    pack.questions
      .filter(q => q.modes.includes(mode))
      .forEach(q => questions.push({ ...q, pack_id: pack.id, pack_label: pack.label, pack_color: pack.color }));
  });
  return ok(res, { mode, questions, total: questions.length });
});

/* GET /api/quiz/uemoa/:packId — un pack spécifique (P1 à P5) */
app.get('/api/quiz/uemoa/:packId', (req, res) => {
  const pack = QUIZ_UEMOA.packs.find(p => p.id === req.params.packId.toUpperCase());
  if (!pack) return err(res, 404, 'Pack introuvable — valeurs : P1, P2, P3, P4, P5');
  return ok(res, { pack });
});

/* GET /revision/uemoa — page de révision officielle BCEAO */
app.get('/revision/uemoa', (req, res) => {
  res.sendFile(path.join(__dirname, 'regul_arena_quiz_uemoa_officiel.html'));
});

/* ── PWA / TWA ─────────────────────────────────────────────────────── */
/* Sert le dossier .well-known (dotfiles bloqués par Express par défaut) */
app.use('/.well-known', express.static(path.join(__dirname, 'public', '.well-known'), {
  dotfiles: 'allow'
}));

/* Forcer le bon Content-Type pour manifest.json et sw.js */
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});
/* ─────────────────────────────────────────────────────────────────── */

/* ================================================================
   FEATURE 1 — INVITATION BÊTA
================================================================ */

function isAdmin(user) {
  const list = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  return list.includes((user.email || '').toLowerCase());
}

/* POST /auth/invite — admin uniquement
   curl -X POST /auth/invite -H 'Authorization: Bearer JWT' -d '{"email":"alice@bank.com"}'
*/
app.post('/auth/invite', requireAuth, (req, res) => {
  if (!isAdmin(req.user)) return err(res, 403, 'Accès réservé aux administrateurs.');
  const { email } = req.body || {};
  const cleanEmail = email ? email.trim().toLowerCase() : null;
  const code = crypto.randomUUID();
  db.prepare('INSERT INTO invitations (code, email) VALUES (?, ?)').run(code, cleanEmail || null);
  const link = `${BASE_URL}/register?invite=${code}`;
  return ok(res, { code, link, email: cleanEmail });
});

/* GET /auth/check-invite?code=xxx — public
   curl '/auth/check-invite?code=UUID'
*/
app.get('/auth/check-invite', limiterLoose, (req, res) => {
  const { code } = req.query;
  if (!code) return ok(res, { valid: false });
  const inv = db.prepare('SELECT * FROM invitations WHERE code = ? AND used = 0').get(code.trim());
  if (!inv) return ok(res, { valid: false });
  return ok(res, { valid: true, email: inv.email || null });
});

/* ================================================================
   FEATURE 6 — FEEDBACK PAR QUESTION
================================================================ */

/* POST /feedback/question — JWT optionnel
   curl -X POST /feedback/question -d '{"question_id":"q1","pack_id":"bceao-supervision","type":"erreur","message":"La réponse B est incorrecte"}'
*/
app.post('/feedback/question', limiterLoose, (req, res) => {
  const { question_id, pack_id, type, message } = req.body || {};
  if (!message || typeof message !== 'string' || message.trim().length < 5) {
    return err(res, 400, 'Message trop court (minimum 5 caractères)');
  }
  if (message.trim().length > 300) return err(res, 400, 'Message trop long (maximum 300 caractères)');
  const allowedTypes = ['erreur', 'suggestion', 'autre'];
  const cleanType = allowedTypes.includes(type) ? type : 'autre';

  let userId = null;
  const hdr = req.headers['authorization'] || '';
  const tok = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (tok) { try { const p = jwt.verify(tok, JWT_SECRET); userId = p.id; } catch(_) {} }

  db.prepare(
    'INSERT INTO question_feedback (question_id, pack_id, user_id, type, message) VALUES (?, ?, ?, ?, ?)'
  ).run(question_id || null, pack_id || null, userId, cleanType, message.trim());

  return ok(res, { message: 'Merci, votre retour a été transmis.' });
});

/* ================================================================
   FEATURE 5 — RÉFÉRENCES RÉGLEMENTAIRES PAR PACK
================================================================ */

const REGULATORY_REFS = {
  'bceao-politique-monetaire': [
    { code: 'Statuts BCEAO', titre: "Statuts de la Banque Centrale des États de l'Afrique de l'Ouest", url: null },
    { code: 'Traité UMOA révisé', titre: 'Traité de l\'Union Monétaire Ouest Africaine', url: null },
    { code: 'Circulaire BCEAO n°003-03-2024', titre: 'Taux directeur de la BCEAO', url: null },
  ],
  'bceao-supervision': [
    { code: 'Instruction BCEAO 026-11-2016', titre: 'Supervision bancaire dans l\'UEMOA', url: null },
    { code: 'Loi bancaire UEMOA', titre: 'Loi portant réglementation bancaire dans l\'UEMOA', url: null },
    { code: 'Traité UMOA Art. 50', titre: 'Commission Bancaire de l\'UMOA — attributions', url: null },
  ],
  'bceao-change': [
    { code: 'Règlement 06/2024/CM/UEMOA', titre: 'Réglementation des changes dans l\'UEMOA', url: null },
    { code: 'Instruction BCEAO 94-05', titre: 'Comptes en devises dans l\'UEMOA', url: null },
  ],
  'bceao-microfinance': [
    { code: 'Règlement 15/2002/CM/UEMOA', titre: 'Réglementation des Systèmes Financiers Décentralisés', url: null },
    { code: 'Instruction BCEAO 016-12-2010', titre: 'Instructions aux SFD de l\'UEMOA', url: null },
  ],
  'bceao-lcbft': [
    { code: 'Directive UEMOA 2015/05', titre: 'Lutte contre le blanchiment de capitaux et le financement du terrorisme', url: null },
    { code: 'Instruction BCEAO 2018-01', titre: 'Identification des clients — dispositif LCB-FT', url: null },
  ],
  'general': [
    { code: 'Traité UMOA révisé', titre: 'Union Monétaire Ouest Africaine', url: null },
    { code: 'Convention COBAC 1990', titre: 'Supervision bancaire en zone CEMAC', url: null },
    { code: 'Accords de Bâle III', titre: 'Cadre prudentiel international — BRI', url: null },
  ],
};

/* GET /packs/:id/refs — public
   curl '/packs/bceao-supervision/refs'
*/
app.get('/packs/:id/refs', (req, res) => {
  const refs = REGULATORY_REFS[req.params.id] || [];
  return ok(res, { pack_id: req.params.id, regulatory_refs: refs });
});

/* ================================================================
   FEATURE 4 — FLOW INVITATION ORGANISATION
================================================================ */

/* POST /org/invite — JWT requis, user doit être admin de l'org
   curl -X POST /org/invite -H 'Authorization: Bearer JWT' -d '{"org_id":1,"email":"bob@bank.com"}'
*/
app.post('/org/invite', requireAuth, async (req, res) => {
  const { org_id, email } = req.body || {};
  if (!org_id || !email) return err(res, 400, 'org_id et email requis');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err(res, 400, 'Email invalide');

  const org = db.prepare('SELECT * FROM organisations WHERE id = ?').get(Number(org_id));
  if (!org) return err(res, 404, 'Organisation introuvable');
  if (org.admin_user_id !== req.user.id) return err(res, 403, "Seul l'administrateur de l'organisation peut inviter des membres");

  const cleanEmail = email.trim().toLowerCase();
  const code = crypto.randomUUID();
  db.prepare('INSERT INTO org_invitations (org_id, email, code) VALUES (?, ?, ?)').run(org.id, cleanEmail, code);

  const link = `${BASE_URL}/join-org?code=${code}`;

  if (process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: `REGUL ARENA <${FROM_EMAIL}>`,
        to: cleanEmail,
        subject: `Invitation à rejoindre ${org.name} sur REGUL ARENA`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#080C14;color:#EEF0F5;border:1px solid rgba(201,153,26,.2);border-radius:4px;padding:40px">
          <div style="font-size:22px;font-weight:900;letter-spacing:6px;color:#C9991A;margin-bottom:8px">REGUL ARENA</div>
          <p style="color:#7A8499">Vous avez été invité(e) à rejoindre <strong style="color:#EEF0F5">${escEmail(org.name)}</strong> sur REGUL ARENA.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#C9991A,#E8B520);color:#03050A;font-size:14px;font-weight:800;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:2px">Rejoindre l'organisation →</a>
          </div>
          <p style="color:#4a5568;font-size:12px">Ce lien est à usage unique. Si vous n'êtes pas concerné(e), ignorez cet email.</p>
        </div>`,
        headers: { 'X-Entity-Ref-ID': crypto.randomUUID() },
      });
    } catch(e) { console.error('[org/invite] email error:', e.message); }
  }

  return ok(res, { code, link, email: cleanEmail, org_name: org.name });
});

/* GET /org/join?code=xxx — public
   curl '/org/join?code=UUID'
*/
app.get('/org/join', limiterLoose, (req, res) => {
  const { code } = req.query;
  if (!code) return ok(res, { valid: false });
  const inv = db.prepare('SELECT oi.*, o.name AS org_name FROM org_invitations oi JOIN organisations o ON o.id = oi.org_id WHERE oi.code = ? AND oi.used = 0').get(code.trim());
  if (!inv) return ok(res, { valid: false });
  return ok(res, { valid: true, org_name: inv.org_name, email: inv.email });
});

/* POST /org/join — JWT requis
   curl -X POST /org/join -H 'Authorization: Bearer JWT' -d '{"code":"UUID"}'
*/
app.post('/org/join', requireAuth, (req, res) => {
  const { code } = req.body || {};
  if (!code) return err(res, 400, 'code requis');
  const inv = db.prepare('SELECT oi.*, o.name AS org_name FROM org_invitations oi JOIN organisations o ON o.id = oi.org_id WHERE oi.code = ? AND oi.used = 0').get(code.trim());
  if (!inv) return err(res, 400, "Code d'invitation invalide ou déjà utilisé.");

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (inv.email && inv.email.toLowerCase() !== (user.email || '').toLowerCase()) {
    return err(res, 403, 'Ce code est réservé à une autre adresse email.');
  }

  try {
    db.prepare('INSERT INTO org_members (org_id, user_id, role) VALUES (?, ?, ?)').run(inv.org_id, req.user.id, 'member');
  } catch(e) {
    if (e.message?.includes('UNIQUE')) return err(res, 409, 'Vous êtes déjà membre de cette organisation.');
    throw e;
  }
  db.prepare('UPDATE org_invitations SET used = 1 WHERE id = ?').run(inv.id);
  return ok(res, { message: `Vous avez rejoint ${inv.org_name} avec succès !`, org_name: inv.org_name });
});

/* GET /org/members?org_id=xxx — JWT requis
   curl -H 'Authorization: Bearer JWT' '/org/members?org_id=1'
*/
app.get('/org/members', requireAuth, (req, res) => {
  const orgId = Number(req.query.org_id);
  if (!orgId) return err(res, 400, 'org_id requis');
  const org = db.prepare('SELECT * FROM organisations WHERE id = ?').get(orgId);
  if (!org) return err(res, 404, 'Organisation introuvable');
  const isMember = db.prepare('SELECT id FROM org_members WHERE org_id = ? AND user_id = ?').get(orgId, req.user.id);
  if (!isMember && org.admin_user_id !== req.user.id) return err(res, 403, "Accès réservé aux membres de l'organisation");
  const members = db.prepare(
    'SELECT om.role, om.joined_at, u.id, u.name, u.email, u.country FROM org_members om JOIN users u ON u.id = om.user_id WHERE om.org_id = ? ORDER BY om.joined_at ASC'
  ).all(orgId);
  return ok(res, { org: { id: org.id, name: org.name }, members });
});

/* ================================================================
   ADMIN — routes protégées par requireAdmin (JWT role=admin)
   curl -H 'Authorization: Bearer <admin_jwt>' /admin/stats
================================================================ */

// GET /admin/stats — tableau de bord global
app.get('/admin/stats', requireAdmin, (req, res) => {
  try {
    const totalUsers    = db.prepare(`SELECT COUNT(*) as n FROM users`).get();
    const verifiedUsers = db.prepare(`SELECT COUNT(*) as n FROM users WHERE email_verified=1`).get();
    const newUsers7d    = db.prepare(`SELECT COUNT(*) as n FROM users WHERE created_at >= datetime('now','-7 days')`).get();
    const byProfile     = db.prepare(`SELECT profile, COUNT(*) as n FROM users GROUP BY profile`).all();
    const byCountry     = db.prepare(`SELECT country, COUNT(*) as n FROM users GROUP BY country ORDER BY n DESC LIMIT 10`).all();
    const totalScores   = db.prepare(`SELECT COUNT(*) as n FROM user_scores`).get();
    const totalDuels    = db.prepare(`SELECT COUNT(*) as n FROM duels`).get();
    const activeDuels   = db.prepare(`SELECT COUNT(*) as n FROM duels WHERE status='active'`).get();
    const finishedDuels = db.prepare(`SELECT COUNT(*) as n FROM duels WHERE status='finished'`).get();
    const totalTournois = db.prepare(`SELECT COUNT(*) as n FROM tournaments`).get();
    const feedbacks     = db.prepare(`SELECT COUNT(*) as n FROM feedback`).get();
    const notifyList    = db.prepare(`SELECT COUNT(*) as n FROM notify_list`).get();
    res.json({
      utilisateurs: { total: totalUsers.n, verifies: verifiedUsers.n, nouveaux_7j: newUsers7d.n, par_profil: byProfile, par_pays: byCountry },
      scores:   { total: totalScores.n },
      duels:    { total: totalDuels.n, actifs: activeDuels.n, termines: finishedDuels.n },
      tournois: { total: totalTournois.n },
      feedback: { total: feedbacks.n },
      tournoi_2027: { inscrits_notif: notifyList.n },
      genere_le: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[admin/stats]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /setup-admin-x7k2 — promotion one-shot de l'email admin (route secrète)
app.get('/setup-admin-x7k2', (req, res) => {
  db.prepare("UPDATE users SET role='admin' WHERE email='abdou.ndao@regularena.com'").run();
  const user = db.prepare("SELECT id,email,role FROM users WHERE email=?").get('abdou.ndao@regularena.com');
  res.json(user);
});

// GET /admin/users — liste des 200 derniers inscrits
app.get('/admin/users', requireAdmin, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, profile, country, etablissement,
             email_verified, role, created_at
      FROM users ORDER BY created_at DESC LIMIT 200
    `).all();
    res.json({ users, total: users.length });
  } catch (e) {
    console.error('[admin/users]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// MODIFIÉ — Module "L'Arène des Débats" : on passe requireAuth (et NON authMiddleware)
app.use('/api/debats', require('./debats')(db, requireAuth));

app.use(express.static(path.join(__dirname, 'public')));
app.get('/api', (req, res) => res.json({ status: 'ok', message: 'API REGUL ARENA en ligne' }));

/* MODIFIÉ — Page publique de vérification d'un certificat (scan QR) */
app.get('/verify/:id', (req, res) => {
  const esc = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const c = db.prepare('SELECT cert_id, user_name, theme, zone, created_at FROM certificates WHERE cert_id = ?').get(req.params.id);
  res.set('Content-Type', 'text/html; charset=utf-8');
  if (!c) {
    return res.status(404).send('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Certificat introuvable</title><body style="font-family:system-ui,-apple-system,sans-serif;background:#F5F3EE;color:#002B5C;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:24px;text-align:center"><div><div style="font-size:48px">❌</div><h1 style="color:#b91c1c;font-size:20px">Certificat introuvable</h1><p style="color:#555">Aucun certificat ne correspond à cet identifiant.</p></div></body>');
  }
  return res.send('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Certificat authentique — REGUL ARENA</title><body style="font-family:system-ui,-apple-system,sans-serif;background:#F5F3EE;color:#002B5C;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:24px"><div style="max-width:520px;width:100%;background:#fff;border:1px solid rgba(201,153,26,.4);border-radius:16px;padding:32px;box-shadow:0 8px 30px rgba(0,0,0,.08);text-align:center"><div style="font-size:13px;letter-spacing:2px;color:#C9991A;font-weight:700">REGUL ARENA</div><div style="font-size:48px;margin:8px 0">✅</div><h1 style="font-size:20px;margin:0 0 4px">Certificat authentique</h1><p style="color:#555;font-size:14px;margin:0 0 20px">Ce certificat a bien été délivré par REGUL ARENA.</p><div style="text-align:left;background:#F5F3EE;border-radius:10px;padding:16px;font-size:14px;line-height:1.9"><div><strong>Délivré à :</strong> ' + esc(c.user_name) + '</div><div><strong>Thème :</strong> ' + esc(c.theme) + '</div><div><strong>Zone :</strong> ' + esc(c.zone) + '</div><div><strong>Date :</strong> ' + esc((c.created_at||'').slice(0,10)) + '</div><div><strong>N° d\'authentification :</strong> ' + esc(c.cert_id) + '</div></div></div></body>');
});
// SPA catch-all : renvoie index.html pour les routes frontend uniquement.
// Les chemins d'API sont déjà gérés par leurs handlers ; cette exclusion explicite
// évite qu'un mauvais ordre de déclaration future ne renvoie du HTML à la place de JSON.
app.get('*', (req, res, next) => {
  const p = req.path;
  if (p.startsWith('/auth/') || p.startsWith('/api/') || p.startsWith('/org/') ||
      p.startsWith('/feedback/') || p.startsWith('/packs/') || p.startsWith('/scores/') ||
      p.startsWith('/duels/') || p.startsWith('/tournament') || p.startsWith('/leaderboard') ||
      p.startsWith('/chat/') || p.startsWith('/dm/') || p.startsWith('/notifications')) {
    return next(); // laisse Express renvoyer 404 JSON plutôt qu'index.html
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


/* ================================================================
   TEMPLATES EMAIL
================================================================ */
function emailConfirmHTML(name, url) {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Confirme ton inscription</title></head>
<body style="margin:0;padding:0;background:#03050A;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:48px 20px">
<table width="560" cellpadding="0" cellspacing="0" style="background:#080C14;border:1px solid rgba(201,153,26,.2);border-radius:4px;overflow:hidden">
  <tr><td style="background:linear-gradient(135deg,#002B5C,#001a3a);padding:32px 40px;text-align:center">
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:26px;font-weight:900;letter-spacing:6px;color:#C9991A">REGUL ARENA</div>
    <div style="font-size:11px;letter-spacing:3px;color:rgba(201,153,26,.6);margin-top:4px">MA&#206;TRISE R&#201;GLEMENTAIRE BANCAIRE</div>
  </td></tr>
  <tr><td style="padding:40px 40px 24px">
    <p style="color:#EEF0F5;font-size:16px;margin:0 0 12px">Bonjour <strong style="color:#C9991A">${escEmail(name)}</strong>,</p>
    <p style="color:#7A8499;font-size:14px;line-height:1.7;margin:0 0 32px">Ton compte REGUL ARENA est pr&#234;t. Clique sur le bouton ci-dessous pour confirmer ton adresse email et acc&#233;der &#224; la plateforme.</p>
    <div style="text-align:center;margin-bottom:32px">
      <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#C9991A,#E8B520);color:#03050A;font-size:14px;font-weight:800;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:2px">Confirmer mon compte &#8594;</a>
    </div>
    <p style="color:#4a5568;font-size:12px;line-height:1.6;margin:0">Ce lien est valable 24 heures. Si tu n'es pas &#224; l'origine de cette demande, ignore cet email.</p>
  </td></tr>
  <tr><td style="border-top:1px solid rgba(255,255,255,.06);padding:20px 40px;text-align:center">
    <p style="color:#4a5568;font-size:11px;letter-spacing:1px;margin:0">&#169; 2026 REGUL ARENA &#183; Initiative priv&#233;e &#183; Abdou NDAO &#183; Dakar, S&#233;n&#233;gal</p>
  </td></tr>
</table></td></tr></table>
</body></html>`;
}

function escEmail(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, profile: u.profile, country: u.country, etablissement: u.etablissement };
}


/* â”€â”€ START â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
app.listen(PORT, () => {
  console.log(`âœ… REGUL ARENA API â€” port ${PORT}`);
  console.log(`   DB : regularena.db`);
  console.log(`   JWT_SECRET : ${JWT_SECRET === 'changez-moi-en-production' ? 'âš  PAR DÃ‰FAUT â€” &#224; changer' : 'âœ“ configur&#233;'}`);
  console.log(`   RESEND_KEY : ${RESEND_KEY ? 'âœ“ configur&#233;' : 'âš  manquant â€” emails d&#233;sactiv&#233;s'}`);
});
