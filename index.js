'use strict';

/* ================================================================
   REGUL ARENA — Backend API
   Stack : Express · better-sqlite3 · JWT · Resend · Helmet
   Routes : /auth/* · /feedback · /feedback/notify
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
const { pickQuestions, getPack } = require('./packs');

/* ── CONFIG ──────────────────────────────────────────────────────── */
const PORT       = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'changez-moi-en-production';
const RESEND_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@regularena.com';
const BASE_URL   = process.env.BASE_URL || 'https://endregularena-production.up.railway.app';
const TOKEN_TTL_H = 24;

const resend = new Resend(RESEND_KEY);

/* ── BASE DE DONNÉES SQLite ──────────────────────────────────────── */
const db = new Database(process.env.DB_PATH || path.join(__dirname, 'regularena.db'));
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

/* ── Migrations ──────────────────────────────────────────────────── */
[
  'ALTER TABLE duels ADD COLUMN num_questions INTEGER NOT NULL DEFAULT 10',
  'ALTER TABLE duels ADD COLUMN timer_sec INTEGER NOT NULL DEFAULT 30',
  'ALTER TABLE duel_scores ADD COLUMN questions_answered INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE duel_scores ADD COLUMN finished INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE duels ADD COLUMN questions_json TEXT NOT NULL DEFAULT \'[]\'',
  'ALTER TABLE duels ADD COLUMN started_at TEXT',
  'ALTER TABLE duels ADD COLUMN packs_ids TEXT',
  'ALTER TABLE tournaments ADD COLUMN country TEXT NOT NULL DEFAULT ""',
  'ALTER TABLE tournaments ADD COLUMN zone TEXT NOT NULL DEFAULT "uemoa"',
  'ALTER TABLE tournaments ADD COLUMN start_date TEXT NOT NULL DEFAULT ""',
  'ALTER TABLE tournament_participants ADD COLUMN qualified INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE tournaments ADD COLUMN youtube_live_url TEXT',
  'ALTER TABLE tournaments ADD COLUMN packs_ids TEXT',
  'ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT \'user\'',
].forEach(sql => { try { db.exec(sql); } catch(_) {} });

try { db.exec("UPDATE duels SET packs_ids = '[\"' || pack_id || '\"]' WHERE pack_id IS NOT NULL AND pack_id != '' AND (packs_ids IS NULL OR packs_ids = '')"); } catch(_) {}
try { db.exec("UPDATE tournaments SET packs_ids = '[\"' || pack_id || '\"]' WHERE pack_id IS NOT NULL AND pack_id != '' AND (packs_ids IS NULL OR packs_ids = '')"); } catch(_) {}
try { db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_duel_scores_uq ON duel_scores (duel_id, user_id)'); } catch(_) {}
try { db.exec('CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications (user_id, seen, created_at DESC)'); } catch(_) {}
try { db.exec('CREATE INDEX IF NOT EXISTS idx_messages_zone ON messages (zone, sent_at)'); } catch(_) {}
try { db.exec('CREATE INDEX IF NOT EXISTS idx_dm_conv ON dm (from_id, to_id, sent_at)'); } catch(_) {}
try { db.exec('CREATE INDEX IF NOT EXISTS idx_dm_to ON dm (to_id, from_id, sent_at)'); } catch(_) {}
try { db.exec('CREATE INDEX IF NOT EXISTS idx_user_scores_user ON user_scores (user_id, played_at)'); } catch(_) {}
try { db.exec('CREATE INDEX IF NOT EXISTS idx_tp_tid_score ON tournament_participants (tournament_id, score)'); } catch(_) {}

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
  CREATE TABLE IF NOT EXISTS tournament_supports (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    user_id       INTEGER,
    pseudo        TEXT,
    emoji         TEXT NOT NULL,
    created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
  );
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

try { db.exec('CREATE INDEX IF NOT EXISTS idx_supports_tournament ON tournament_supports(tournament_id, created_at)'); } catch(_) {}
try { db.exec('CREATE INDEX IF NOT EXISTS idx_tournament_chat_tid ON tournament_chat(tournament_id, id)'); } catch(_) {}

/* ── HELPERS ─────────────────────────────────────────────────────── */
function notifyAllExcept(excludeUserId, type, message) {
  const users = db.prepare('SELECT id FROM users WHERE email_verified = 1 AND id != ? ORDER BY RANDOM() LIMIT 50').all(excludeUserId);
  const insert = db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)');
  const tx = db.transaction(() => { users.forEach(u => insert.run(u.id, type, message)); });
  tx();
}

function genToken(bytes = 32) { return crypto.randomBytes(bytes).toString('hex'); }

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

function ok(res, data = {}) { return res.status(200).json({ success: true, ...data }); }
function err(res, status, message) { return res.status(status).json({ success: false, error: message }); }

function genCode(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = (n) => Array.from({length:n}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  return `${prefix}-${rand(3)}-${rand(3)}`;
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, profile: u.profile, country: u.country, etablissement: u.etablissement };
}

function escEmail(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── MIDDLEWARE ──────────────────────────────────────────────────── */
const app = express();

app.use((req, res, next) => {
  if (req.path.startsWith('/duels') || req.path.startsWith('/notifications')) {
    res.set('Cache-Control', 'no-store');
  }
  next();
});

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      scriptSrc:     ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc:      ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:       ["'self'", "https://fonts.gstatic.com"],
      connectSrc:    ["'self'", "https://www.regularena.com", "https://regularena.com", "https://endregularena-production.up.railway.app"],
      imgSrc:        ["'self'", "data:"],
      frameAncestors:["'none'"],
    },
  },
}));

app.use((req, res, next) => {
  const allowed = ['https://www.regularena.com','https://regularena.com','https://endregularena-production.up.railway.app'];
  if (allowed.includes(req.headers.origin)) res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PATCH,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

app.use(express.json());

const limiterStrict = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
const limiterLoose  = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });

function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return err(res, 401, 'Non authentifié');
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return err(res, 401, 'Token invalide ou expiré');
  }
}

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

/* ================================================================
   ROUTES AUTH
================================================================ */

app.post('/auth/register', limiterStrict, async (req, res) => {
  const { name, email, profile, country, etablissement = '' } = req.body || {};
  if (!name || !email) return err(res, 400, 'Nom et email requis');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err(res, 400, 'Email invalide');
  if (name.length < 2 || name.length > 80) return err(res, 400, 'Nom invalide');

  const cleanName  = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  if (!user) {
    const result = db.prepare(
      'INSERT INTO users (name, email, profile, country, etablissement) VALUES (?, ?, ?, ?, ?)'
    ).run(cleanName, cleanEmail, profile || 'professionnel', country || '', etablissement);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  }

  const token = genToken();
  db.prepare('INSERT INTO confirm_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expiresAt(TOKEN_TTL_H));

  db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(user.id);
  user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);

  const confirmUrl = `${BASE_URL}/auth/verify?token=${token}`;
  try {
    await resend.emails.send({
      from: `REGUL ARENA <${FROM_EMAIL}>`,
      to:   cleanEmail,
      subject: 'Bienvenue sur REGUL ARENA',
      html: emailConfirmHTML(cleanName, confirmUrl),
      headers: { 'X-Entity-Ref-ID': crypto.randomUUID() },
    });
  } catch (e) {
    console.warn('[register] email non envoyé (non bloquant):', e && e.message);
  }

  return ok(res, { token: signJWT(user), user: publicUser(user), message: 'Compte créé' });
});

app.post('/auth/login-direct', limiterStrict, (req, res) => {
  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err(res, 400, 'Email invalide');
  const cleanEmail = email.trim().toLowerCase();
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  if (!user) return err(res, 404, "Aucun compte avec cet email. Inscris-toi d'abord.");
  if (user.email_verified !== 1) {
    db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(user.id);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  }
  return ok(res, { token: signJWT(user), user: publicUser(user), message: 'Connecté' });
});

app.post('/auth/resend', limiterStrict, async (req, res) => {
  const { email } = req.body || {};
  if (!email) return err(res, 400, 'Email requis');
  const cleanEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  if (!user) return err(res, 404, 'Aucun compte trouvé pour cet email');
  const token = genToken();
  db.prepare('INSERT INTO confirm_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expiresAt(TOKEN_TTL_H));
  const confirmUrl = `${BASE_URL}/auth/verify?token=${token}`;
  try {
    const sendResult = await resend.emails.send({
      from: `REGUL ARENA <${FROM_EMAIL}>`,
      to:   cleanEmail,
      subject: 'Nouveau lien de confirmation — REGUL ARENA',
      html: emailConfirmHTML(user.name, confirmUrl),
      headers: { 'X-Entity-Ref-ID': crypto.randomUUID() },
    });
    if (sendResult.error) { console.error('Resend error:', JSON.stringify(sendResult.error)); return err(res, 500, 'Erreur envoi email'); }
  } catch (e) { console.error('Resend exception:', e.message); return err(res, 500, 'Erreur envoi email'); }
  return ok(res, { message: 'Email renvoyé' });
});

app.post('/auth/resend-verification', limiterStrict, async (req, res) => {
  const { email } = req.body || {};
  if (!email) return err(res, 400, 'Email requis');
  const cleanEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  if (!user) return err(res, 404, 'Aucun compte trouvé pour cet email');
  const token = genToken();
  db.prepare('INSERT INTO confirm_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expiresAt(TOKEN_TTL_H));
  const confirmUrl = `${BASE_URL}/auth/verify?token=${token}`;
  try {
    const sendResult = await resend.emails.send({
      from: `REGUL ARENA <${FROM_EMAIL}>`,
      to:   cleanEmail,
      subject: 'Nouveau lien de confirmation — REGUL ARENA',
      html: emailConfirmHTML(user.name, confirmUrl),
      headers: { 'X-Entity-Ref-ID': crypto.randomUUID() },
    });
    if (sendResult.error) return err(res, 500, 'Erreur envoi email — réessaie dans quelques instants');
  } catch (e) { return err(res, 500, 'Erreur envoi email — réessaie dans quelques instants'); }
  return ok(res, { message: 'Nouveau lien envoyé' });
});

app.get('/auth/verify', limiterLoose, (req, res) => {
  const { token } = req.query;
  if (!token) return res.redirect(302, `${BASE_URL}/?confirm_error=missing`);
  const row = db.prepare('SELECT * FROM confirm_tokens WHERE token = ?').get(token);
  if (!row) return res.redirect(302, `${BASE_URL}/?confirm_error=invalid`);
  const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id);
  if (existingUser && existingUser.email_verified === 1) {
    return res.redirect(302, `${BASE_URL}/?confirmed=true&jwt=${encodeURIComponent(signJWT(existingUser))}`);
  }
  if (row.used === 1) return res.redirect(302, `${BASE_URL}/?confirm_error=invalid`);
  if (new Date(row.expires_at) < new Date()) return res.redirect(302, `${BASE_URL}/?confirm_error=expired`);
  db.prepare('UPDATE confirm_tokens SET used = 1 WHERE id = ?').run(row.id);
  db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(row.user_id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id);
  return res.redirect(302, `${BASE_URL}/?confirmed=true&jwt=${encodeURIComponent(signJWT(user))}`);
});

app.get('/auth/login-verify', limiterLoose, (req, res) => {
  const { login_token } = req.query;
  if (!login_token) return err(res, 400, 'Token manquant');
  const row = db.prepare('SELECT * FROM login_tokens WHERE token = ? AND used = 0').get(login_token);
  if (!row) return err(res, 400, 'Lien invalide ou déjà utilisé');
  if (new Date(row.expires_at) < new Date()) return err(res, 400, 'Lien expiré');
  db.prepare('UPDATE login_tokens SET used = 1 WHERE id = ?').run(row.id);
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(row.email);
  if (!user) return err(res, 404, 'Compte introuvable');
  return ok(res, { token: signJWT(user), user: publicUser(user) });
});

app.get('/auth/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return err(res, 404, 'Compte introuvable');
  return ok(res, { user: { ...publicUser(user), is_verified: user.email_verified === 1 } });
});

/* ================================================================
   ROUTES FEEDBACK
================================================================ */

app.post('/feedback', limiterLoose, async (req, res) => {
  const { type = 'general', message, content, email = '', name = '', stars = 5 } = req.body || {};
  const text = (message || content || '').trim();
  if (!text || text.length < 2) return err(res, 400, 'Contenu requis');
  db.prepare('INSERT INTO feedback (type, content, email) VALUES (?, ?, ?)').run(type, text.slice(0, 2000), email.slice(0, 120));
  const esc  = (s) => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const when = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' }) + ' (Dakar)';
  const ip   = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().split(',')[0].trim();
  const ua   = (req.headers['user-agent'] || '').toString();
  const html = `<div style="font-family:sans-serif;max-width:600px">
    <h2 style="color:#C9991A">Nouveau feedback REGUL ARENA</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:6px 0;color:#888;width:130px">Categorie</td><td><strong>${esc(type)}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#888">Note</td><td>${'⭐'.repeat(Math.min(5, Number(stars)||0))} (${Number(stars)||0}/5)</td></tr>
      <tr><td style="padding:6px 0;color:#888">Nom</td><td>${name ? esc(name) : '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#888">Email</td><td>${email ? esc(email) : '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#888">Date / heure</td><td>${esc(when)}</td></tr>
      <tr><td style="padding:6px 0;color:#888">IP</td><td>${esc(ip) || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#888">Navigateur</td><td style="font-size:11px;color:#666">${esc(ua) || '—'}</td></tr>
    </table>
    <hr style="margin:16px 0;border-color:#333">
    <div style="background:#111;padding:16px;border-radius:4px;white-space:pre-wrap;color:#EEF0F5">${esc(text)}</div>
  </div>`;
  const subject = `[REGUL ARENA] Feedback — ${type} (${Number(stars)||0}★)`;
  let emailSent = false;
  try {
    const payload = { from: FROM_EMAIL, to: 'abdou.ndao@regularena.com', cc: 'contact@regularena.com', subject, html };
    if (email) payload.reply_to = email;
    await resend.emails.send(payload);
    emailSent = true;
  } catch (e1) {
    try {
      const fb = { from: FROM_EMAIL, to: 'abddou200485@gmail.com', subject: '[FALLBACK] ' + subject, html };
      if (email) fb.reply_to = email;
      await resend.emails.send(fb);
      emailSent = true;
    } catch (e2) { console.error('[feedback] fallback échoué:', e2 && e2.message); }
  }
  if (!emailSent) return err(res, 502, "Feedback enregistré, mais l'email n'a pas pu être envoyé.");
  return ok(res, { message: 'Feedback envoyé', emailSent: true });
});

app.post('/feedback/notify', limiterLoose, (req, res) => {
  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err(res, 400, 'Email invalide');
  try { db.prepare('INSERT INTO notify_list (email) VALUES (?)').run(email.trim().toLowerCase()); } catch {}
  return ok(res, { message: "Inscrit à la liste d'alerte" });
});

/* ================================================================
   SCORES
================================================================ */

app.post('/scores', requireAuth, (req, res) => {
  const { pack_id, score, total } = req.body || {};
  if (!pack_id || score == null || total == null) return err(res, 400, 'pack_id, score, total requis');
  db.prepare('INSERT INTO user_scores (user_id, pack_id, score, total) VALUES (?, ?, ?, ?)').run(req.user.id, pack_id, Number(score), Number(total));
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

/* ================================================================
   NOTIFICATIONS
================================================================ */

app.get('/notifications', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT id, type, message, seen, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
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

/* ================================================================
   DUELS
================================================================ */

function _duelFull(code) {
  const duel = db.prepare('SELECT * FROM duels WHERE code = ?').get(code);
  if (!duel) return null;
  const creator = db.prepare('SELECT id, name, country FROM users WHERE id = ?').get(duel.creator_id) || null;
  const joiner  = duel.joiner_id ? (db.prepare('SELECT id, name, country FROM users WHERE id = ?').get(duel.joiner_id) || null) : null;
  const scores  = db.prepare('SELECT user_id, score, questions_answered, finished FROM duel_scores WHERE duel_id = ?').all(duel.id) || [];
  let packsIdsArr = null;
  try { if (duel.packs_ids) packsIdsArr = JSON.parse(duel.packs_ids); } catch(_) {}
  if (!Array.isArray(packsIdsArr) || !packsIdsArr.length) packsIdsArr = duel.pack_id ? [duel.pack_id] : ['general'];
  let questionsSafe = null;
  if (duel.status === 'active' && duel.questions_json) {
    try { questionsSafe = JSON.parse(duel.questions_json); } catch(_) { questionsSafe = null; }
  }
  return {
    id: duel.id, code: duel.code,
    creator_id: duel.creator_id, joiner_id: duel.joiner_id || null,
    pack_id: duel.pack_id || 'general', packs_ids: packsIdsArr,
    num_questions: duel.num_questions, timer_sec: duel.timer_sec,
    status: duel.status, created_at: duel.created_at, started_at: duel.started_at || null,
    questions_json: duel.questions_json || '[]', questions_safe: questionsSafe,
    creator, joiner, scores
  };
}

function _pickQuestionsMulti(packsIds, count) {
  if (!Array.isArray(packsIds) || !packsIds.length) return null;
  let pool = [];
  for (const id of packsIds) {
    const p = getPack(id);
    if (p && Array.isArray(p.questions)) pool = pool.concat(p.questions);
  }
  if (!pool.length) return null;
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const out = [];
  for (let i = 0; i < count; i++) out.push(pool[i % pool.length]);
  return out;
}

app.post('/duels', requireAuth, (req, res) => {
  const { pack_id, packs_ids, num_questions = 10, timer_sec = 30 } = req.body || {};
  let finalPacks;
  if (Array.isArray(packs_ids) && packs_ids.length >= 1 && packs_ids.length <= 5 && packs_ids.every(p => typeof p === 'string' && p.trim().length > 0)) {
    finalPacks = packs_ids.map(p => p.trim());
  } else if (pack_id && typeof pack_id === 'string') {
    finalPacks = [pack_id.trim()];
  } else {
    finalPacks = ['general'];
  }
  let code;
  for (let i = 0; i < 10; i++) { code = genCode('D'); if (!db.prepare('SELECT id FROM duels WHERE code = ?').get(code)) break; }
  db.prepare('INSERT INTO duels (code, creator_id, pack_id, packs_ids, num_questions, timer_sec) VALUES (?, ?, ?, ?, ?, ?)')
    .run(code, req.user.id, finalPacks[0], JSON.stringify(finalPacks), Math.min(20, Math.max(5, Number(num_questions))), Math.min(60, Math.max(15, Number(timer_sec))));
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
  if (!duel.joiner_id) return err(res, 400, "Personne n'a encore rejoint");
  if (duel.status === 'active') return ok(res, { message: 'Déjà actif', duel: _duelFull(req.params.code) });
  let packsForDuel = null;
  try { if (duel.packs_ids) packsForDuel = JSON.parse(duel.packs_ids); } catch(_) {}
  if (!Array.isArray(packsForDuel) || !packsForDuel.length) packsForDuel = [duel.pack_id || 'general'];
  const picked = packsForDuel.length > 1 ? _pickQuestionsMulti(packsForDuel, duel.num_questions) : pickQuestions(packsForDuel[0], duel.num_questions);
  if (!picked || picked.length === 0) return err(res, 500, 'Pack(s) introuvable(s) ou vide(s) côté serveur');
  db.prepare('UPDATE duels SET status = ?, questions_json = ?, started_at = ? WHERE code = ?').run('active', JSON.stringify(picked), new Date().toISOString(), req.params.code);
  return ok(res, { message: 'Duel lancé', duel: _duelFull(req.params.code) });
});

app.get('/duels/:code/question/:index', requireAuth, (req, res) => {
  const duel = db.prepare('SELECT * FROM duels WHERE code = ?').get(req.params.code);
  if (!duel) return err(res, 404, 'Duel introuvable');
  if (duel.status !== 'active') return err(res, 400, 'Duel non actif');
  if (duel.creator_id !== req.user.id && duel.joiner_id !== req.user.id) return err(res, 403, 'Accès refusé');
  const idx = Number(req.params.index);
  if (!Number.isInteger(idx) || idx < 0 || idx >= duel.num_questions) return err(res, 400, 'Index hors plage');
  const score = db.prepare('SELECT questions_answered FROM duel_scores WHERE duel_id = ? AND user_id = ?').get(duel.id, req.user.id);
  const answered = score ? score.questions_answered : 0;
  if (idx > answered) return err(res, 403, 'Question pas encore débloquée');
  let questions;
  try { questions = JSON.parse(duel.questions_json); } catch(_) { questions = []; }
  if (idx >= questions.length) return err(res, 500, 'Question introuvable');
  const q = questions[idx];
  return ok(res, { question: { index: idx, q: q.q, choices: q.choices, reference: q.source || q.reference || 'BCEAO/CIMA 2026' }, total: duel.num_questions });
});

app.post('/duels/:code/answer', requireAuth, (req, res) => {
  const { q_index, choice_index, correct: legacyCorrect, score: legacyScore } = req.body || {};
  if (q_index == null) return err(res, 400, 'q_index requis');
  const duel = db.prepare('SELECT * FROM duels WHERE code = ?').get(req.params.code);
  if (!duel) return err(res, 404, 'Duel introuvable');
  if (duel.status !== 'active') return err(res, 400, 'Duel non actif');
  if (duel.creator_id !== req.user.id && duel.joiner_id !== req.user.id) return err(res, 403, 'Accès refusé');
  let questions = [];
  try { questions = JSON.parse(duel.questions_json || '[]'); } catch(_) {}
  const existing = db.prepare('SELECT * FROM duel_scores WHERE duel_id = ? AND user_id = ?').get(duel.id, req.user.id);
  const prevAnswered = existing ? existing.questions_answered : 0;
  const prevScore    = existing ? existing.score : 0;
  let isCorrect = false, pointsEarned = 0, serverValidated = false;
  if (questions.length > 0 && questions[q_index]) {
    serverValidated = true;
    isCorrect = Number(choice_index) === Number(questions[q_index].correct);
    if (isCorrect) pointsEarned = 100;
  } else {
    console.warn(`[duel ${duel.code}] fallback legacy`);
    isCorrect = !!legacyCorrect;
    pointsEarned = Math.max(0, (Number(legacyScore) || 0) - prevScore);
  }
  const newScore = prevScore + pointsEarned;
  const newAnswered = prevAnswered + 1;
  const finished = newAnswered >= duel.num_questions ? 1 : 0;
  const tx = db.transaction(() => {
    if (!existing) {
      db.prepare('INSERT INTO duel_scores (duel_id, user_id, score, questions_answered, finished) VALUES (?, ?, ?, ?, ?)').run(duel.id, req.user.id, newScore, newAnswered, finished);
    } else {
      db.prepare('UPDATE duel_scores SET score = ?, questions_answered = ?, finished = ? WHERE duel_id = ? AND user_id = ?').run(newScore, newAnswered, finished, duel.id, req.user.id);
    }
    if (finished) {
      const allDone = db.prepare('SELECT COUNT(*) AS n FROM duel_scores WHERE duel_id = ? AND finished = 1').get(duel.id).n;
      if (allDone >= 2) db.prepare('UPDATE duels SET status = ? WHERE id = ?').run('finished', duel.id);
    }
  });
  tx();
  return ok(res, { correct: isCorrect, correct_index: serverValidated ? questions[q_index].correct : null, points_earned: pointsEarned, my_score: newScore, server_validated: serverValidated, live: _duelFull(req.params.code) });
});

app.get('/duels/:code/live', requireAuth, (req, res) => {
  const d = _duelFull(req.params.code);
  if (!d) return err(res, 404, 'Duel introuvable');
  return ok(res, { duel: d });
});

/* ── Routes legacy tournois ──────────────────────────────────────── */
app.post('/tournaments', requireAuth, (req, res) => err(res, 410, 'Route obsolète — utiliser POST /tournament/create'));
app.get('/tournaments/:code', requireAuth, (req, res) => {
  const t = db.prepare('SELECT * FROM tournaments WHERE code = ?').get(req.params.code);
  if (!t) return err(res, 404, 'Tournoi introuvable');
  const participants = db.prepare('SELECT u.name, u.country, tp.score, tp.rank FROM tournament_participants tp JOIN users u ON u.id = tp.user_id WHERE tp.tournament_id = ?').all(t.id);
  return ok(res, { tournament: t, participants });
});
app.post('/tournaments/:code/join',  requireAuth, (req, res) => err(res, 410, 'Route obsolète — utiliser POST /tournament/join'));
app.post('/tournaments/:code/start', requireAuth, (req, res) => err(res, 410, 'Route obsolète — utiliser POST /tournament/:code/start-qualif'));
app.post('/tournaments/:code/score', requireAuth, (req, res) => err(res, 410, 'Route obsolète — utiliser POST /tournament/qualify'));

/* ================================================================
   TOURNOI AVANCÉ — /tournament/*
================================================================ */

const UEMOA_PAYS = ['SN','CI','BF','ML','BJ','NE','TG','GW'];
const CEMAC_PAYS = ['CM','GA','CG','CF','GQ','TD'];
const _KNOWN_PACK_IDS = ['general','umoa-bale','rfe-uemoa','cima-assurance','syscohada','rfe-cemac','pcb-umoa'];

function _zoneOf(country) {
  if (UEMOA_PAYS.includes(country)) return 'uemoa';
  if (CEMAC_PAYS.includes(country)) return 'cemac';
  return null;
}

function _peutRejoindre(userCountry, tCountry, tZone) {
  if (!userCountry) return false;
  if (tZone === 'uemoa') return UEMOA_PAYS.includes(userCountry);
  if (tZone === 'cemac') return CEMAC_PAYS.includes(userCountry);
  if (tZone === 'inter') return UEMOA_PAYS.includes(userCountry) || CEMAC_PAYS.includes(userCountry);
  if (tZone === 'country') return tCountry === userCountry;
  return false;
}

function _validPacksIds(arr) {
  if (!Array.isArray(arr) || arr.length < 1 || arr.length > 5) return false;
  return arr.every(p => typeof p === 'string' && p.trim() && _KNOWN_PACK_IDS.includes(p.trim()));
}

function _validStartDate(s) {
  if (!s) return true;
  if (typeof s !== 'string') return false;
  const d = new Date(s);
  if (isNaN(d.getTime())) return false;
  return d.getTime() >= Date.now() - 60 * 60 * 1000;
}

function _tFull(code) {
  const t = db.prepare('SELECT * FROM tournaments WHERE code = ?').get(code);
  if (!t) return null;
  const participants = db.prepare('SELECT tp.*, u.name, u.country, u.etablissement FROM tournament_participants tp JOIN users u ON u.id = tp.user_id WHERE tp.tournament_id = ? ORDER BY tp.score DESC, COALESCE(tp.rank,9999) ASC').all(t.id);
  const matches = db.prepare('SELECT tm.*, u1.name AS p1_name, u1.country AS p1_country, u2.name AS p2_name, u2.country AS p2_country, uw.name AS winner_name FROM tournament_matches tm LEFT JOIN users u1 ON u1.id = tm.player1_id LEFT JOIN users u2 ON u2.id = tm.player2_id LEFT JOIN users uw ON uw.id = tm.winner_id WHERE tm.tournament_id = ? ORDER BY tm.round, tm.id').all(t.id);
  const creator = db.prepare('SELECT id, name, country FROM users WHERE id = ?').get(t.creator_id);
  return { ...t, participants, matches, creator };
}

app.post('/tournament/create', requireAuth, (req, res) => {
  const { name, zone, pack_id, packs_ids, max_players, start_date } = req.body || {};
  if (!name || !zone) return err(res, 400, 'name et zone requis');
  const trimmedName = String(name).trim();
  if (trimmedName.length < 3 || trimmedName.length > 80) return err(res, 400, 'Nom du tournoi : 3 à 80 caractères');
  if (!['uemoa','cemac','inter','country'].includes(zone)) return err(res, 400, 'Zone invalide');
  const mp = Number(max_players);
  if (![8,16,32].includes(mp)) return err(res, 400, 'max_players doit être 8, 16 ou 32');
  let finalPacks;
  if (Array.isArray(packs_ids) && packs_ids.length) {
    if (!_validPacksIds(packs_ids)) return err(res, 400, 'Sélectionne 1 à 5 packs valides');
    finalPacks = packs_ids;
  } else if (pack_id && _KNOWN_PACK_IDS.includes(pack_id)) {
    finalPacks = [pack_id];
  } else {
    finalPacks = ['general'];
  }
  if (start_date && !_validStartDate(start_date)) return err(res, 400, 'Date de début invalide ou trop ancienne');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return err(res, 401, 'Session expirée, reconnecte-toi');
  if (!_peutRejoindre(user.country, user.country, zone)) return err(res, 403, 'Vous ne pouvez pas créer un tournoi hors de votre zone');
  let code;
  for (let i = 0; i < 10; i++) { const rand = crypto.randomBytes(2).toString('hex').toUpperCase(); code = 'T-' + rand; if (!db.prepare('SELECT id FROM tournaments WHERE code = ?').get(code)) break; }
  const result = db.prepare('INSERT INTO tournaments (code, creator_id, name, pack_id, packs_ids, max_players, status, country, zone, start_date) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(code, req.user.id, trimmedName.slice(0,80), finalPacks[0], JSON.stringify(finalPacks), mp, 'waiting', user.country || '', zone, start_date || '');
  db.prepare('INSERT INTO tournament_participants (tournament_id, user_id) VALUES (?,?)').run(result.lastInsertRowid, req.user.id);
  notifyAllExcept(req.user.id, 'tournament_created', '🏆 ' + user.name + ' crée le tournoi "' + trimmedName + '" ! Code : ' + code);
  return ok(res, { code, id: result.lastInsertRowid });
});

app.post('/tournament/join', requireAuth, (req, res) => {
  const { code } = req.body || {};
  if (!code) return err(res, 400, 'code requis');
  const t = db.prepare('SELECT * FROM tournaments WHERE code = ?').get(code.trim().toUpperCase());
  if (!t) return err(res, 404, 'Tournoi introuvable');
  if (!['waiting','qualif'].includes(t.status)) return err(res, 400, 'Inscriptions fermées pour ce tournoi');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!_peutRejoindre(user.country, t.country, t.zone)) return err(res, 403, 'Ce tournoi est réservé à la zone ' + t.zone.toUpperCase() + '. Votre pays (' + (user.country || '?') + ') n\'est pas éligible.');
  const already = db.prepare('SELECT id FROM tournament_participants WHERE tournament_id = ? AND user_id = ?').get(t.id, req.user.id);
  if (already) return ok(res, { message: 'Déjà inscrit', tournament: _tFull(t.code) });
  const count = db.prepare('SELECT COUNT(*) AS n FROM tournament_participants WHERE tournament_id = ?').get(t.id).n;
  if (count >= t.max_players) return err(res, 400, 'Tournoi complet (' + count + '/' + t.max_players + ')');
  db.prepare('INSERT INTO tournament_participants (tournament_id, user_id) VALUES (?,?)').run(t.id, req.user.id);
  db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?,?,?)').run(t.creator_id, 'tournament_joined', '🏟 ' + user.name + ' a rejoint "' + t.name + '" ! (' + (count+1) + '/' + t.max_players + ')');
  return ok(res, { message: 'Inscrit au tournoi', tournament: _tFull(t.code) });
});

app.get('/tournament/list', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return err(res, 401, 'Session expirée, reconnecte-toi');
  const uZone = _zoneOf(user.country);
  const BASE_SQL = `SELECT t.*, u.name AS creator_name, (SELECT COUNT(*) FROM tournament_participants tp WHERE tp.tournament_id = t.id) AS nb FROM tournaments t JOIN users u ON u.id = t.creator_id WHERE t.status IN ('waiting','qualif','elim')`;
  const open = uZone
    ? db.prepare(BASE_SQL + ` AND (t.zone = ? OR t.zone = 'inter') ORDER BY t.created_at DESC LIMIT 30`).all(uZone)
    : db.prepare(BASE_SQL + ` ORDER BY t.created_at DESC LIMIT 30`).all();
  const mine = db.prepare('SELECT t.*, u.name AS creator_name, (SELECT COUNT(*) FROM tournament_participants tp WHERE tp.tournament_id = t.id) AS nb FROM tournaments t JOIN users u ON u.id = t.creator_id JOIN tournament_participants tp2 ON tp2.tournament_id = t.id AND tp2.user_id = ? ORDER BY t.created_at DESC LIMIT 20').all(req.user.id);
  return ok(res, { open, mine });
});

app.post('/tournament/qualify', requireAuth, (req, res) => {
  const { tournament_id, score, total, questions_json } = req.body || {};
  if (!tournament_id || score == null || total == null) return err(res, 400, 'tournament_id, score, total requis');
  if (Number(score) < 0 || Number(score) > Number(total)) return err(res, 400, 'Score invalide');
  if (Number(total) <= 0 || Number(total) > 20) return err(res, 400, 'Total invalide');
  if (Number(score) > 2000) return err(res, 400, 'Score suspect');
  const t = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(Number(tournament_id));
  if (!t) return err(res, 404, 'Tournoi introuvable');
  if (!['qualif','waiting'].includes(t.status)) return err(res, 400, 'Phase de qualification non active');
  const part = db.prepare('SELECT * FROM tournament_participants WHERE tournament_id = ? AND user_id = ?').get(t.id, req.user.id);
  if (!part) return err(res, 403, 'Non inscrit à ce tournoi');
  if (part.score > 0) return err(res, 400, 'Qualification déjà soumise (score : ' + part.score + ')');
  db.prepare('UPDATE tournament_participants SET score = ?, total = ? WHERE tournament_id = ? AND user_id = ?').run(Number(score), Number(total), t.id, req.user.id);
  const allPart = db.prepare('SELECT * FROM tournament_participants WHERE tournament_id = ? ORDER BY score DESC').all(t.id);
  const qualifN = Math.floor(t.max_players / 2);
  allPart.forEach((p, i) => { db.prepare('UPDATE tournament_participants SET rank = ?, qualified = ? WHERE id = ?').run(i + 1, i < qualifN ? 1 : 0, p.id); });
  try { db.prepare('INSERT INTO tournament_match_sheets (tournament_id, match_id, player_id, questions_json, score) VALUES (?,?,?,?,?)').run(t.id, null, req.user.id, JSON.stringify(questions_json || []), Number(score)); } catch(_) {}
  const myRank = allPart.findIndex(p => p.user_id === req.user.id) + 1;
  const user = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
  if (t.creator_id !== req.user.id) db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?,?,?)').run(t.creator_id, 'tournament_qualified', '⚡ ' + user.name + ' — qualification : ' + score + '/' + total + ' pts (#' + myRank + ')');
  return ok(res, { message: 'Score de qualification enregistré', rank: myRank });
});

app.get('/tournament/match-sheet/:matchId', requireAuth, (req, res) => {
  const midRaw = req.params.matchId;
  let sheets;
  if (midRaw === 'qualify') {
    sheets = db.prepare('SELECT tms.*, u.name FROM tournament_match_sheets tms JOIN users u ON u.id = tms.player_id WHERE tms.tournament_id = ? AND tms.match_id IS NULL').all(Number(req.query.tournament_id));
  } else {
    sheets = db.prepare('SELECT tms.*, u.name FROM tournament_match_sheets tms JOIN users u ON u.id = tms.player_id WHERE tms.match_id = ?').all(Number(midRaw));
  }
  return ok(res, { sheets });
});

app.get('/tournament/:code', requireAuth, (req, res) => {
  const t = _tFull(req.params.code);
  if (!t) return err(res, 404, 'Tournoi introuvable');
  const myPart = t.participants.find(p => p.user_id === req.user.id) || null;
  return ok(res, { tournament: t, participants: t.participants, matches: t.matches, creator: t.creator, my_participant: myPart });
});

app.get('/tournament/:id/bracket', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!id) return err(res, 400, 'id numérique requis');
  const t = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
  if (!t) return err(res, 404, 'Tournoi introuvable');
  const matches = db.prepare('SELECT tm.*, u1.name AS p1_name, u1.country AS p1_country, u2.name AS p2_name, u2.country AS p2_country, uw.name AS winner_name FROM tournament_matches tm LEFT JOIN users u1 ON u1.id = tm.player1_id LEFT JOIN users u2 ON u2.id = tm.player2_id LEFT JOIN users uw ON uw.id = tm.winner_id WHERE tm.tournament_id = ? ORDER BY tm.round, tm.id').all(id);
  const participants = db.prepare('SELECT tp.*, u.name, u.country FROM tournament_participants tp JOIN users u ON u.id = tp.user_id WHERE tp.tournament_id = ? ORDER BY COALESCE(tp.rank,9999) ASC, tp.score DESC').all(id);
  return ok(res, { tournament: t, matches, participants });
});

app.post('/tournament/:code/start-qualif', requireAuth, (req, res) => {
  const t = db.prepare('SELECT * FROM tournaments WHERE code = ?').get(req.params.code);
  if (!t) return err(res, 404, 'Tournoi introuvable');
  if (t.creator_id !== req.user.id) return err(res, 403, 'Seul le créateur peut lancer les qualifications');
  if (t.status !== 'waiting') return err(res, 400, 'Statut invalide — attendu: waiting');
  db.prepare('UPDATE tournaments SET status = ? WHERE code = ?').run('qualif', req.params.code);
  const parts = db.prepare('SELECT user_id FROM tournament_participants WHERE tournament_id = ?').all(t.id);
  const ins = db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?,?,?)');
  const tx = db.transaction(() => parts.forEach(p => { if (p.user_id !== req.user.id) ins.run(p.user_id, 'tournament_qualif_start', '⚡ Qualifications ouvertes pour "' + t.name + '" ! Code : ' + t.code); }));
  tx();
  return ok(res, { message: 'Phase de qualification lancée' });
});

app.post('/tournament/:code/generate-bracket', requireAuth, (req, res) => {
  const t = db.prepare('SELECT * FROM tournaments WHERE code = ?').get(req.params.code);
  if (!t) return err(res, 404, 'Tournoi introuvable');
  if (t.creator_id !== req.user.id) return err(res, 403, 'Seul le créateur peut générer le bracket');
  if (!['qualif','waiting'].includes(t.status)) return err(res, 400, 'Phase invalide pour générer un bracket');
  const participants = db.prepare('SELECT * FROM tournament_participants WHERE tournament_id = ? ORDER BY score DESC').all(t.id);
  if (participants.length < 2) return err(res, 400, 'Minimum 2 participants requis');
  let packsList;
  try { packsList = t.packs_ids ? JSON.parse(t.packs_ids) : null; } catch(_) { packsList = null; }
  if (!Array.isArray(packsList) || !packsList.length) packsList = [t.pack_id || 'general'];
  db.prepare('DELETE FROM tournament_matches WHERE tournament_id = ?').run(t.id);
  const mIns = db.prepare('INSERT INTO tournament_matches (tournament_id, round, player1_id, player2_id, duel_code, status) VALUES (?,?,?,?,?,?)');
  const dIns = db.prepare('INSERT INTO duels (code, creator_id, pack_id, num_questions, timer_sec) VALUES (?,?,?,?,?)');
  const tx = db.transaction(() => {
    const pairs = Math.floor(participants.length / 2);
    for (let i = 0; i < pairs; i++) {
      const p1 = participants[i * 2], p2 = participants[i * 2 + 1];
      let dCode;
      for (let j = 0; j < 10; j++) { dCode = genCode('D'); if (!db.prepare('SELECT id FROM duels WHERE code = ?').get(dCode)) break; }
      const packForMatch = packsList[i % packsList.length];
      dIns.run(dCode, p1.user_id, packForMatch, 10, 30);
      mIns.run(t.id, 1, p1.user_id, p2.user_id, dCode, 'pending');
    }
  });
  tx();
  db.prepare('UPDATE tournaments SET status = ? WHERE code = ?').run('elim', req.params.code);
  const allParts = db.prepare('SELECT user_id FROM tournament_participants WHERE tournament_id = ?').all(t.id);
  const nIns = db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?,?,?)');
  const nTx = db.transaction(() => allParts.forEach(p => nIns.run(p.user_id, 'tournament_bracket', '🏆 Bracket généré pour "' + t.name + '" ! Les matchs d\'élimination débutent.')));
  nTx();
  return ok(res, { message: 'Bracket généré', tournament: _tFull(req.params.code) });
});

app.post('/tournament/match/:matchId/record', requireAuth, (req, res) => {
  const matchId = Number(req.params.matchId);
  const { winner_id } = req.body || {};
  if (!winner_id) return err(res, 400, 'winner_id requis');
  const match = db.prepare('SELECT * FROM tournament_matches WHERE id = ?').get(matchId);
  if (!match) return err(res, 404, 'Match introuvable');
  const wId = Number(winner_id);
  if (wId !== req.user.id) return err(res, 403, 'Tu ne peux déclarer que ta propre victoire');
  if (match.player1_id !== wId && match.player2_id !== wId) return err(res, 400, 'winner_id invalide');
  if (!match.duel_code) return err(res, 400, 'Duel non associé à ce match');
  const duel = db.prepare('SELECT status FROM duels WHERE code = ?').get(match.duel_code);
  if (!duel || duel.status !== 'finished') return err(res, 400, 'Duel pas encore terminé');
  db.prepare('UPDATE tournament_matches SET winner_id = ?, status = ? WHERE id = ?').run(wId, 'done', matchId);
  return ok(res, { message: 'Résultat enregistré' });
});

/* ── Tournament chat (participants) ─────────────────────────────── */
app.get('/tournament-chat/:tournamentId', requireAuth, (req, res) => {
  const tId = Number(req.params.tournamentId);
  if (!tId) return err(res, 400, 'tournamentId invalide');
  const isParticipant = db.prepare('SELECT id FROM tournament_participants WHERE tournament_id = ? AND user_id = ?').get(tId, req.user.id);
  if (!isParticipant) return err(res, 403, 'Accès réservé aux participants du tournoi');
  const msgs = db.prepare('SELECT tc.id, tc.content, tc.sent_at, u.name, u.country FROM tournament_chat tc JOIN users u ON u.id = tc.user_id WHERE tc.tournament_id = ? ORDER BY tc.sent_at DESC LIMIT 60').all(tId).reverse();
  return ok(res, { messages: msgs });
});

app.post('/tournament-chat/:tournamentId', requireAuth, (req, res) => {
  const tId = Number(req.params.tournamentId);
  if (!tId) return err(res, 400, 'tournamentId invalide');
  const { content } = req.body || {};
  if (!content || !content.trim()) return err(res, 400, 'Message vide');
  const t = db.prepare('SELECT id FROM tournaments WHERE id = ?').get(tId);
  if (!t) return err(res, 404, 'Tournoi introuvable');
  const isParticipant = db.prepare('SELECT id FROM tournament_participants WHERE tournament_id = ? AND user_id = ?').get(tId, req.user.id);
  if (!isParticipant) return err(res, 403, 'Accès réservé aux participants du tournoi');
  db.prepare('INSERT INTO tournament_chat (tournament_id, user_id, content) VALUES (?,?,?)').run(tId, req.user.id, content.trim().slice(0, 500));
  return ok(res, { message: 'Message envoyé' });
});

/* ── Broadcast (live + spectateur) ──────────────────────────────── */
const _BROADCAST_BANNED = ['putain','connard','connasse','salope','salaud','enculé','encule','enculer','merde','fdp','ntm'];
function _broadcastClean(msg) {
  if (typeof msg !== 'string') return '';
  const trimmed = msg.trim().slice(0, 200);
  if (!trimmed) return '';
  const lc = trimmed.toLowerCase();
  if (_BROADCAST_BANNED.some(w => lc.includes(w))) return null;
  if (/https?:\/\/|www\./i.test(trimmed)) return null;
  return trimmed;
}
function _broadcastValidEmoji(e) { return ['⚡','🔥','👏','❤️'].includes(e); }
function _broadcastValidYouTube(url) {
  if (!url) return true;
  if (typeof url !== 'string') return false;
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|live\/)|youtu\.be\/)[A-Za-z0-9_-]{11}/.test(url.trim());
}

app.get('/tournaments/:code/live', (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const t = db.prepare('SELECT id, code, name, status, max_players, pack_id, country, zone, start_date, youtube_live_url, creator_id FROM tournaments WHERE code = ?').get(code);
  if (!t) return err(res, 404, 'Tournoi introuvable');
  const leaderboard = db.prepare('SELECT u.id, u.name, u.country, tp.score, tp.rank FROM tournament_participants tp JOIN users u ON u.id = tp.user_id WHERE tp.tournament_id = ? ORDER BY tp.score DESC, COALESCE(tp.rank, 9999) ASC LIMIT 10').all(t.id);
  const currentMatch = db.prepare('SELECT tm.id, tm.round, tm.status, tm.duel_code, u1.name AS p1_name, u1.country AS p1_country, u2.name AS p2_name, u2.country AS p2_country FROM tournament_matches tm LEFT JOIN users u1 ON u1.id = tm.player1_id LEFT JOIN users u2 ON u2.id = tm.player2_id WHERE tm.tournament_id = ? AND tm.status = \'active\' ORDER BY tm.round DESC, tm.id ASC LIMIT 1').get(t.id);
  let currentQuestion = null;
  if (currentMatch && currentMatch.duel_code) {
    try {
      const duel = db.prepare('SELECT questions_json, started_at, timer_sec, num_questions FROM duels WHERE code = ?').get(currentMatch.duel_code);
      if (duel && duel.questions_json) {
        const qs = JSON.parse(duel.questions_json);
        if (Array.isArray(qs) && qs.length) {
          const elapsed = duel.started_at ? Math.max(0, Math.floor((Date.now() - new Date(duel.started_at + 'Z').getTime()) / 1000)) : 0;
          const idx = Math.min(qs.length - 1, Math.floor(elapsed / Math.max(10, duel.timer_sec || 30)));
          const q = qs[idx];
          if (q) currentQuestion = { index: idx, total: duel.num_questions || qs.length, q: q.q, choices: q.choices, source: q.source || q.reference || '' };
        }
      }
    } catch(_) {}
  }
  const recent_chat = db.prepare('SELECT tc.id, tc.content, tc.sent_at, u.name AS pseudo FROM tournament_chat tc JOIN users u ON u.id = tc.user_id WHERE tc.tournament_id = ? ORDER BY tc.id DESC LIMIT 10').all(t.id).reverse();
  const recent_supports = db.prepare("SELECT id, emoji, pseudo, created_at FROM tournament_supports WHERE tournament_id = ? AND created_at >= datetime('now', '-60 seconds') ORDER BY id DESC LIMIT 20").all(t.id);
  return ok(res, { tournament: { id: t.id, code: t.code, name: t.name, status: t.status, max_players: t.max_players, pack_id: t.pack_id, country: t.country, zone: t.zone, start_date: t.start_date, youtube_live_url: t.youtube_live_url || '', creator_id: t.creator_id }, leaderboard_top10: leaderboard, current_match: currentMatch || null, current_question: currentQuestion, status: t.status, youtube_live_url: t.youtube_live_url || '', recent_chat, recent_supports });
});

app.get('/tournaments/:code/chat', (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const t = db.prepare('SELECT id FROM tournaments WHERE code = ?').get(code);
  if (!t) return err(res, 404, 'Tournoi introuvable');
  const since = Number(req.query.since) || 0;
  const rows = db.prepare('SELECT tc.id, tc.content AS message, tc.sent_at AS created_at, u.name AS pseudo, u.id AS user_id FROM tournament_chat tc JOIN users u ON u.id = tc.user_id WHERE tc.tournament_id = ? AND tc.id > ? ORDER BY tc.id ASC LIMIT 100').all(t.id, since);
  return ok(res, { messages: rows, last_id: rows.length ? rows[rows.length-1].id : since });
});

app.post('/tournaments/:code/chat', requireAuth, (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const t = db.prepare('SELECT id FROM tournaments WHERE code = ?').get(code);
  if (!t) return err(res, 404, 'Tournoi introuvable');
  const raw = (req.body && req.body.message) || (req.body && req.body.content) || '';
  const clean = _broadcastClean(raw);
  if (clean === null) return err(res, 400, 'Message rejeté (URL ou contenu inapproprié)');
  if (!clean) return err(res, 400, 'Message vide ou trop long (200 caractères max)');
  const info = db.prepare('INSERT INTO tournament_chat (tournament_id, user_id, content) VALUES (?,?,?)').run(t.id, req.user.id, clean);
  const u = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id) || {};
  return ok(res, { id: info.lastInsertRowid, pseudo: u.name || 'Anonyme', message: clean });
});

app.get('/tournaments/:code/support', (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const t = db.prepare('SELECT id FROM tournaments WHERE code = ?').get(code);
  if (!t) return err(res, 404, 'Tournoi introuvable');
  const sinceId = Number(req.query.since) || 0;
  const rows = db.prepare("SELECT id, emoji, pseudo, created_at FROM tournament_supports WHERE tournament_id = ? AND id > ? AND created_at >= datetime('now', '-60 seconds') ORDER BY id ASC LIMIT 50").all(t.id, sinceId);
  return ok(res, { supports: rows, last_id: rows.length ? rows[rows.length-1].id : sinceId });
});

app.post('/tournaments/:code/support', requireAuth, (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const t = db.prepare('SELECT id FROM tournaments WHERE code = ?').get(code);
  if (!t) return err(res, 404, 'Tournoi introuvable');
  const emoji = (req.body && req.body.emoji) || '';
  if (!_broadcastValidEmoji(emoji)) return err(res, 400, 'Emoji invalide (autorisés : ⚡ 🔥 👏 ❤️)');
  const u = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id) || {};
  const info = db.prepare('INSERT INTO tournament_supports (tournament_id, user_id, pseudo, emoji) VALUES (?,?,?,?)').run(t.id, req.user.id, u.name || '', emoji);
  try { db.prepare("DELETE FROM tournament_supports WHERE tournament_id = ? AND created_at < datetime('now', '-5 minutes')").run(t.id); } catch(_) {}
  return ok(res, { id: info.lastInsertRowid, emoji });
});

app.patch('/tournaments/:code/config', requireAuth, (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const t = db.prepare('SELECT id, creator_id, status FROM tournaments WHERE code = ?').get(code);
  if (!t) return err(res, 404, 'Tournoi introuvable');
  if (t.creator_id !== req.user.id) return err(res, 403, 'Réservé au créateur du tournoi');
  const body = req.body || {};
  const updates = [], params = [];
  if (Object.prototype.hasOwnProperty.call(body, 'youtube_live_url')) {
    const url = body.youtube_live_url || '';
    if (!_broadcastValidYouTube(url)) return err(res, 400, 'URL YouTube invalide');
    updates.push('youtube_live_url = ?'); params.push(url.trim());
  }
  const hasStructural = ['name', 'start_date', 'packs_ids'].some(k => Object.prototype.hasOwnProperty.call(body, k));
  if (hasStructural && t.status !== 'waiting') return err(res, 400, 'Impossible de modifier un tournoi déjà démarré');
  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    const n = String(body.name || '').trim();
    if (n.length < 3 || n.length > 80) return err(res, 400, 'Nom du tournoi : 3 à 80 caractères');
    updates.push('name = ?'); params.push(n);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'start_date')) {
    if (!_validStartDate(body.start_date)) return err(res, 400, 'Date de début invalide ou trop ancienne');
    updates.push('start_date = ?'); params.push(String(body.start_date || '').trim());
  }
  if (Object.prototype.hasOwnProperty.call(body, 'packs_ids')) {
    if (!_validPacksIds(body.packs_ids)) return err(res, 400, 'Sélectionne 1 à 5 packs valides');
    updates.push('packs_ids = ?'); params.push(JSON.stringify(body.packs_ids));
    updates.push('pack_id = ?'); params.push(body.packs_ids[0]);
  }
  if (!updates.length) return err(res, 400, 'Aucun champ à mettre à jour');
  params.push(t.id);
  db.prepare('UPDATE tournaments SET ' + updates.join(', ') + ' WHERE id = ?').run(...params);
  return ok(res, { updated: updates.length, tournament: _tFull(code) });
});

app.delete('/tournaments/:code', requireAuth, (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const t = db.prepare('SELECT id, creator_id, name, status FROM tournaments WHERE code = ?').get(code);
  if (!t) return err(res, 404, 'Tournoi introuvable');
  if (t.creator_id !== req.user.id) return err(res, 403, 'Réservé au créateur du tournoi');
  const tx = db.transaction(() => {
    try { db.prepare('DELETE FROM tournament_chat WHERE tournament_id = ?').run(t.id); } catch(_) {}
    try { db.prepare('DELETE FROM tournament_supports WHERE tournament_id = ?').run(t.id); } catch(_) {}
    try { db.prepare('DELETE FROM tournament_match_sheets WHERE tournament_id = ?').run(t.id); } catch(_) {}
    try { db.prepare('DELETE FROM tournament_matches WHERE tournament_id = ?').run(t.id); } catch(_) {}
    try { db.prepare('DELETE FROM tournament_participants WHERE tournament_id = ?').run(t.id); } catch(_) {}
    db.prepare('DELETE FROM tournaments WHERE id = ?').run(t.id);
  });
  try { tx(); return ok(res, { deleted_code: code }); }
  catch(e) { console.error('[tournament DELETE] échec', e); return err(res, 500, 'Suppression échouée'); }
});

/* ================================================================
   COUMBA ARENA
================================================================ */

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
    deck.push({c, v:'+2'}); deck.push({c, v:'sk'});
  }
  for (let i = 0; i < 3; i++) deck.push({c:'w', v:'w'});
  for (let i = 0; i < 3; i++) deck.push({c:'w', v:'+4'});
  return coumbaShuffle(deck);
}

function coumbaShuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; }
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

app.post('/coumba', requireAuth, (req, res) => {
  let code;
  for (let i = 0; i < 10; i++) { code = genCode('C'); if (!db.prepare('SELECT id FROM coumba_games WHERE code = ?').get(code)) break; }
  db.prepare('INSERT INTO coumba_games (code, player1_id) VALUES (?,?)').run(code, req.user.id);
  return ok(res, {code, game: coumbaGetState(code)});
});

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

app.post('/coumba/:code/start', requireAuth, (req, res) => {
  const g = db.prepare('SELECT * FROM coumba_games WHERE code = ?').get(req.params.code);
  if (!g) return err(res, 404, 'Partie introuvable');
  if (g.player1_id !== req.user.id) return err(res, 403, 'Seul le créateur peut démarrer');
  if (!g.player2_id) return err(res, 400, "En attente d'un adversaire");
  if (g.status === 'active') return ok(res, {message:'Déjà active', game: coumbaGetState(req.params.code)});
  const deck = coumbaNewDeck();
  const hand1 = deck.splice(0, 7), hand2 = deck.splice(0, 7);
  let firstIdx = deck.findIndex(c => c.v !== '+4' && c.v !== 'w');
  if (firstIdx < 0) firstIdx = 0;
  const [topCard] = deck.splice(firstIdx, 1);
  const state = {deck, discard:[topCard], hand1, hand2, cur:1, pending:null, winner_id:null, msg:'La partie commence !'};
  db.prepare('UPDATE coumba_games SET status=?, state_json=? WHERE code=?').run('active', JSON.stringify(state), req.params.code);
  return ok(res, {game: coumbaGetState(req.params.code)});
});

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
  if (g.state.pending && g.state.pending.target === myNum) pendingForMe = {q: g.state.pending.q, effect: g.state.pending.effect};
  return ok(res, { status: g.status, code: g.code, player1: g.player1, player2: g.player2, my_hand: myHand, opp_count: oppCount, top_card: top, deck_count: (g.state.deck||[]).length, is_my_turn: g.state.cur === myNum, pending: pendingForMe, winner_id: g.state.winner_id||null, msg: g.state.msg||'', my_player: myNum, cur: g.state.cur });
});

app.post('/coumba/:code/play', requireAuth, (req, res) => {
  const {card_index, chosen_color} = req.body || {};
  const g = db.prepare('SELECT * FROM coumba_games WHERE code = ?').get(req.params.code);
  if (!g) return err(res, 404, 'Partie introuvable');
  if (g.status !== 'active') return err(res, 400, 'Partie non active');
  if (g.player1_id !== req.user.id && g.player2_id !== req.user.id) return err(res, 403, 'Accès refusé');
  let state; try { state = JSON.parse(g.state_json); } catch(_) { return err(res, 500, 'État corrompu'); }
  const isP1 = g.player1_id === req.user.id, myNum = isP1 ? 1 : 2;
  if (state.cur !== myNum) return err(res, 400, "Ce n'est pas ton tour");
  if (state.pending) return err(res, 400, 'Réponds à la question en attente');
  const myHand = isP1 ? state.hand1 : state.hand2;
  const idx = Number(card_index);
  if (!Number.isInteger(idx)||idx<0||idx>=myHand.length) return err(res, 400, 'Index invalide');
  const card = myHand[idx], top = state.discard[state.discard.length-1];
  if (!coumbaCanPlay(card, top)) return err(res, 400, 'Carte non jouable');
  if ((card.v==='w'||card.v==='+4') && !['r','b','g','o'].includes(chosen_color)) return err(res, 400, 'Couleur requise');
  myHand.splice(idx, 1);
  if (isP1) state.hand1 = myHand; else state.hand2 = myHand;
  const played = (card.v==='w'||card.v==='+4') ? {...card, c:chosen_color} : card;
  state.discard.push(played);
  if (myHand.length === 0) {
    state.winner_id = req.user.id; state.msg = '🏆 Victoire !';
    db.prepare('UPDATE coumba_games SET status=?, state_json=? WHERE code=?').run('finished', JSON.stringify(state), g.code);
    db.prepare('INSERT INTO user_scores (user_id, pack_id, score, total) VALUES (?,?,?,?)').run(req.user.id,'coumba',100,100);
    return ok(res, {win:true});
  }
  const oppNum = myNum===1?2:1;
  if (card.v==='+2'||card.v==='+4'||card.v==='sk') {
    const vf = COUMBA_VF[Math.floor(Math.random()*COUMBA_VF.length)];
    state.pending = {q:vf.q, a:vf.a, target:oppNum, effect:card.v};
    state.cur = oppNum; state.msg = `⚠️ Question pour le joueur ${oppNum} !`;
  } else {
    state.cur = oppNum; state.msg = `Tour du joueur ${oppNum}`;
  }
  db.prepare('UPDATE coumba_games SET state_json=? WHERE code=?').run(JSON.stringify(state), g.code);
  return ok(res, {ok:true});
});

app.post('/coumba/:code/draw', requireAuth, (req, res) => {
  const g = db.prepare('SELECT * FROM coumba_games WHERE code = ?').get(req.params.code);
  if (!g) return err(res, 404, 'Partie introuvable');
  if (g.status !== 'active') return err(res, 400, 'Partie non active');
  if (g.player1_id !== req.user.id && g.player2_id !== req.user.id) return err(res, 403, 'Accès refusé');
  let state; try { state = JSON.parse(g.state_json); } catch(_) { return err(res, 500, 'État corrompu'); }
  const isP1 = g.player1_id === req.user.id, myNum = isP1 ? 1 : 2;
  if (state.cur !== myNum) return err(res, 400, "Ce n'est pas ton tour");
  if (state.pending) return err(res, 400, 'Réponds à la question en attente');
  if (state.deck.length === 0) { const top = state.discard.pop(); state.deck = coumbaShuffle(state.discard); state.discard = [top]; }
  const drawn = state.deck.length > 0 ? state.deck.splice(0,1) : [];
  if (isP1) state.hand1.push(...drawn); else state.hand2.push(...drawn);
  const oppNum = myNum===1?2:1;
  state.cur = oppNum; state.msg = `Joueur ${myNum} pioche. Tour du joueur ${oppNum}.`;
  db.prepare('UPDATE coumba_games SET state_json=? WHERE code=?').run(JSON.stringify(state), g.code);
  return ok(res, {drawn, ok:true});
});

app.post('/coumba/:code/answer', requireAuth, (req, res) => {
  const {answer} = req.body || {};
  const g = db.prepare('SELECT * FROM coumba_games WHERE code = ?').get(req.params.code);
  if (!g) return err(res, 404, 'Partie introuvable');
  if (g.status !== 'active') return err(res, 400, 'Partie non active');
  if (g.player1_id !== req.user.id && g.player2_id !== req.user.id) return err(res, 403, 'Accès refusé');
  let state; try { state = JSON.parse(g.state_json); } catch(_) { return err(res, 500, 'État corrompu'); }
  if (!state.pending) return err(res, 400, 'Aucune question en attente');
  const isP1 = g.player1_id === req.user.id, myNum = isP1 ? 1 : 2;
  if (state.pending.target !== myNum) return err(res, 400, 'Cette question ne te concerne pas');
  const userAnswer = answer===true||answer==='true';
  const correct = userAnswer === state.pending.a;
  const effect = state.pending.effect, oppNum = myNum===1?2:1;
  const myHand = isP1 ? state.hand1 : state.hand2;
  if (!correct) {
    let drawN = effect==='+2'?2:effect==='+4'?4:0;
    for (let i = 0; i < drawN; i++) {
      if (state.deck.length===0){const top=state.discard.pop();state.deck=coumbaShuffle(state.discard);state.discard=[top];}
      if (state.deck.length>0) myHand.push(state.deck.splice(0,1)[0]);
    }
    if (isP1) state.hand1=myHand; else state.hand2=myHand;
    state.cur = oppNum; state.msg = `❌ Mauvaise réponse — ${effect==='sk'?'tour passé':drawN+' cartes piochées'}. Tour du joueur ${oppNum}.`;
  } else {
    state.cur = myNum; state.msg = `✅ Bonne réponse — pénalité annulée ! Tour du joueur ${myNum}.`;
  }
  const correctAnswer = state.pending.a;
  state.pending = null;
  db.prepare('UPDATE coumba_games SET state_json=? WHERE code=?').run(JSON.stringify(state), g.code);
  return ok(res, {correct, correct_answer:correctAnswer, ok:true});
});

/* ================================================================
   CHAT & DM
================================================================ */

const VALID_ZONES = ['uemoa', 'cemac', 'general'];

app.get('/chat/:zone', requireAuth, (req, res) => {
  const zone = req.params.zone;
  if (!VALID_ZONES.includes(zone)) return err(res, 400, 'Zone invalide');
  const msgs = db.prepare('SELECT m.id, m.content, m.sent_at, u.name, u.country FROM messages m JOIN users u ON u.id = m.user_id WHERE m.zone = ? ORDER BY m.sent_at DESC LIMIT 50').all(zone).reverse();
  return ok(res, { messages: msgs });
});

app.post('/chat/:zone', requireAuth, (req, res) => {
  const zone = req.params.zone;
  if (!VALID_ZONES.includes(zone)) return err(res, 400, 'Zone invalide');
  const { content } = req.body || {};
  if (!content || !content.trim()) return err(res, 400, 'Message vide');
  db.prepare('INSERT INTO messages (user_id, zone, content) VALUES (?, ?, ?)').run(req.user.id, zone, content.trim().slice(0, 500));
  return ok(res, { message: 'Message envoyé' });
});

app.get('/dm/:userId', requireAuth, (req, res) => {
  const otherId = Number(req.params.userId);
  if (!otherId || otherId === req.user.id) return err(res, 400, 'userId invalide');
  const msgs = db.prepare('SELECT d.id, d.content, d.sent_at, u.name, CASE WHEN d.from_id = ? THEN 1 ELSE 0 END AS is_mine FROM dm d JOIN users u ON u.id = d.from_id WHERE (d.from_id = ? AND d.to_id = ?) OR (d.from_id = ? AND d.to_id = ?) ORDER BY d.sent_at ASC LIMIT 100').all(req.user.id, req.user.id, otherId, otherId, req.user.id);
  return ok(res, { messages: msgs });
});

app.post('/dm/:userId', requireAuth, (req, res) => {
  const receiverId = Number(req.params.userId);
  if (!receiverId || receiverId === req.user.id) return err(res, 400, 'userId invalide');
  const { content } = req.body || {};
  if (!content || !content.trim()) return err(res, 400, 'Message vide');
  const receiver = db.prepare('SELECT id FROM users WHERE id = ?').get(receiverId);
  if (!receiver) return err(res, 404, 'Destinataire introuvable');
  db.prepare('INSERT INTO dm (from_id, to_id, content) VALUES (?, ?, ?)').run(req.user.id, receiverId, content.trim().slice(0, 500));
  return ok(res, { message: 'Message envoyé' });
});

/* ================================================================
   QUIZ UEMOA OFFICIELS
================================================================ */

const QUIZ_UEMOA = require('./data/quiz_uemoa.json');

app.get('/api/quiz/uemoa', (req, res) => ok(res, { quiz: QUIZ_UEMOA }));

app.get('/api/quiz/uemoa/mode/:mode', (req, res) => {
  const mode = req.params.mode.toLowerCase();
  if (!['solo', 'duel', 'tournoi'].includes(mode)) return err(res, 400, 'Mode invalide — valeurs : solo, duel, tournoi');
  const questions = [];
  QUIZ_UEMOA.packs.forEach(pack => {
    pack.questions.filter(q => q.modes.includes(mode)).forEach(q => questions.push({ ...q, pack_id: pack.id, pack_label: pack.label, pack_color: pack.color }));
  });
  return ok(res, { mode, questions, total: questions.length });
});

app.get('/api/quiz/uemoa/:packId', (req, res) => {
  const pack = QUIZ_UEMOA.packs.find(p => p.id === req.params.packId.toUpperCase());
  if (!pack) return err(res, 404, 'Pack introuvable — valeurs : P1, P2, P3, P4, P5');
  return ok(res, { pack });
});

app.get('/revision/uemoa', (req, res) => res.sendFile(path.join(__dirname, 'regul_arena_quiz_uemoa_officiel.html')));

/* ── PWA ─────────────────────────────────────────────────────────── */
app.use('/.well-known', express.static(path.join(__dirname, 'public', '.well-known'), { dotfiles: 'allow' }));
app.get('/manifest.json', (req, res) => { res.setHeader('Content-Type', 'application/manifest+json'); res.sendFile(path.join(__dirname, 'public', 'manifest.json')); });
app.get('/sw.js', (req, res) => { res.setHeader('Content-Type', 'application/javascript'); res.setHeader('Service-Worker-Allowed', '/'); res.setHeader('Cache-Control', 'no-cache'); res.sendFile(path.join(__dirname, 'public', 'sw.js')); });

/* ================================================================
   ADMIN
================================================================ */

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

/* ── STATIC ──────────────────────────────────────────────────────── */
app.get('/setup-admin-x7k2', (req, res) => {
  db.prepare("UPDATE users SET role='admin' WHERE email='abdou.ndao@regularena.com'").run();
  const user = db.prepare("SELECT id,email,role FROM users WHERE email=?").get('abdou.ndao@regularena.com');
  res.json(user);
});
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api', (req, res) => res.json({ status: 'ok', message: 'API REGUL ARENA en ligne' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

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
    <div style="font-size:11px;letter-spacing:3px;color:rgba(201,153,26,.6);margin-top:4px">MAÎTRISE RÉGLEMENTAIRE BANCAIRE</div>
  </td></tr>
  <tr><td style="padding:40px 40px 24px">
    <p style="color:#EEF0F5;font-size:16px;margin:0 0 12px">Bonjour <strong style="color:#C9991A">${escEmail(name)}</strong>,</p>
    <p style="color:#7A8499;font-size:14px;line-height:1.7;margin:0 0 32px">Ton compte REGUL ARENA est prêt. Clique sur le bouton ci-dessous pour confirmer ton adresse email et accéder à la plateforme.</p>
    <div style="text-align:center;margin-bottom:32px">
      <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#C9991A,#E8B520);color:#03050A;font-size:14px;font-weight:800;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:2px">Confirmer mon compte →</a>
    </div>
    <p style="color:#4a5568;font-size:12px;line-height:1.6;margin:0">Ce lien est valable 24 heures. Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>
  </td></tr>
  <tr><td style="border-top:1px solid rgba(255,255,255,.06);padding:20px 40px;text-align:center">
    <p style="color:#4a5568;font-size:11px;letter-spacing:1px;margin:0">© 2026 REGUL ARENA · Initiative privée · Abdou NDAO · Dakar, Sénégal</p>
  </td></tr>
</table></td></tr></table>
</body></html>`;
}

/* ── START ───────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`✅ REGUL ARENA API — port ${PORT}`);
  console.log(`   DB : ${process.env.DB_PATH || 'regularena.db'}`);
  console.log(`   JWT_SECRET : ${JWT_SECRET === 'changez-moi-en-production' ? '⚠ PAR DÉFAUT — à changer' : '✔ configuré'}`);
  console.log(`   RESEND_KEY : ${RESEND_KEY ? '✔ configuré' : '⚠ manquant — emails désactivés'}`);
});
app.get('/setup-admin-x7k2', (req, res) => {
  db.prepare("UPDATE users SET role='admin' WHERE email='abdou.ndao@regularena.com'").run();
  const user = db.prepare("SELECT id,email,role FROM users WHERE email=?").get('abdou.ndao@regularena.com');
  res.json(user);
});
