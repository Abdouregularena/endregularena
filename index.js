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

/* â”€â”€ CONFIG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const PORT         = process.env.PORT || 3000;
const JWT_SECRET   = process.env.JWT_SECRET || 'changez-moi-en-production';
const RESEND_KEY   = process.env.RESEND_API_KEY || '';
const FROM_EMAIL   = process.env.FROM_EMAIL || 'noreply@regularena.com';
// SOURCE DE VERITE UNIQUE — frontend servi par Railway, meme origine que l'API
const BASE_URL     = process.env.BASE_URL || 'https://endregularena-production.up.railway.app';
const TOKEN_TTL_H  = 24; // heures de validit&#233; du lien email

const resend = new Resend(RESEND_KEY);

/* â”€â”€ BASE DE DONNÃ‰ES SQLite â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const db = new Database(path.join(__dirname, 'regularena.db'));
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
`);

/* ALTER TABLE migrations — colonnes ajoutées après le déploiement initial */
['ALTER TABLE duels ADD COLUMN num_questions INTEGER NOT NULL DEFAULT 10',
 'ALTER TABLE duels ADD COLUMN timer_sec INTEGER NOT NULL DEFAULT 30',
 'ALTER TABLE duel_scores ADD COLUMN questions_answered INTEGER NOT NULL DEFAULT 0',
 'ALTER TABLE duel_scores ADD COLUMN finished INTEGER NOT NULL DEFAULT 0',
].forEach(sql => { try { db.exec(sql); } catch(_) {} });
try { db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_duel_scores_uq ON duel_scores (duel_id, user_id)'); } catch(_) {}

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
      is_verified: user.email_verified === 1 },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
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
      connectSrc:    ["'self'"],
      imgSrc:        ["'self'", "data:"],
      frameAncestors:["'none'"],
    },
  },
}));
app.use((req, res, next) => {
  const allowed = ['https://www.regularena.com','https://regularena.com','https://endregularena.up.railway.app'];
  if (allowed.includes(req.headers.origin)) res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
}); // MODIFIÉ — CORS manuel

app.use(express.json());

const limiterStrict = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
const limiterLoose  = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });

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
  const { name, email, profile, country, etablissement = '' } = req.body || {};
   
  if (!name || !email) return err(res, 400, 'Nom et email requis');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err(res, 400, 'Email invalide');
  if (name.length < 2 || name.length > 80) return err(res, 400, 'Nom invalide');

  const cleanName  = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  // Upsert user
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

  if (!user) {
    const result = db.prepare(
      'INSERT INTO users (name, email, profile, country, etablissement) VALUES (?, ?, ?, ?, ?)'
    ).run(cleanName, cleanEmail, profile || 'professionnel', country || '', etablissement);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
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

  return ok(res, { message: 'Email de confirmation envoyé' });
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

  return ok(res, { token: signJWT(user), user: publicUser(user) });
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
      to: 'contact@regularena.com',
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
  return ok(res, { message: 'Rejoint', duel: _duelFull(req.params.code) });
});

app.post('/duels/:code/start', requireAuth, (req, res) => {
  const duel = db.prepare('SELECT * FROM duels WHERE code = ?').get(req.params.code);
  if (!duel) return err(res, 404, 'Duel introuvable');
  if (duel.creator_id !== req.user.id) return err(res, 403, 'Seul le créateur peut démarrer');
  if (!duel.joiner_id) return err(res, 400, 'Personne n\'a encore rejoint');
  if (duel.status === 'active') return ok(res, { message: 'Déjà actif', duel: _duelFull(req.params.code) });
  db.prepare('UPDATE duels SET status = ? WHERE code = ?').run('active', req.params.code);
  return ok(res, { message: 'Duel lancé', duel: _duelFull(req.params.code) });
});

app.post('/duels/:code/answer', requireAuth, (req, res) => {
  const { q_index, correct, score } = req.body || {};
  if (q_index == null) return err(res, 400, 'q_index requis');
  const duel = db.prepare('SELECT * FROM duels WHERE code = ?').get(req.params.code);
  if (!duel) return err(res, 404, 'Duel introuvable');
  if (duel.status !== 'active') return err(res, 400, 'Duel non actif');
  const existing = db.prepare('SELECT * FROM duel_scores WHERE duel_id = ? AND user_id = ?').get(duel.id, req.user.id);
  if (!existing) {
    db.prepare('INSERT INTO duel_scores (duel_id, user_id, score, questions_answered) VALUES (?, ?, ?, ?)').run(duel.id, req.user.id, Number(score) || 0, 1);
  } else {
    const finished = existing.questions_answered + 1 >= duel.num_questions ? 1 : 0;
    db.prepare('UPDATE duel_scores SET score = ?, questions_answered = ?, finished = ? WHERE duel_id = ? AND user_id = ?')
      .run(Number(score) || 0, existing.questions_answered + 1, finished, duel.id, req.user.id);
    if (finished) {
      const allDone = db.prepare('SELECT COUNT(*) AS n FROM duel_scores WHERE duel_id = ? AND finished = 1').get(duel.id).n;
      if (allDone >= 2) db.prepare('UPDATE duels SET status = ? WHERE id = ?').run('finished', duel.id);
    }
  }
  return ok(res, { live: _duelFull(req.params.code) });
});

app.get('/duels/:code/live', requireAuth, (req, res) => {
  const d = _duelFull(req.params.code);
  if (!d) return err(res, 404, 'Duel introuvable');
  return ok(res, { duel: d });
});

/* ── TOURNOIS ────────────────────────────────────────────────────── */
app.post('/tournaments', requireAuth, (req, res) => {
  const { pack_id, max_players } = req.body || {};
  let code;
  for (let i = 0; i < 10; i++) {
    code = genCode('T');
    const existing = db.prepare('SELECT id FROM tournaments WHERE code = ?').get(code);
    if (!existing) break;
  }
  db.prepare('INSERT INTO tournaments (code, creator_id, pack_id, max_players) VALUES (?, ?, ?, ?)').run(code, req.user.id, pack_id || 'general', Number(max_players) || 8);
  db.prepare('INSERT INTO tournament_participants (tournament_id, user_id) VALUES ((SELECT id FROM tournaments WHERE code = ?), ?)').run(code, req.user.id);
  return ok(res, { code });
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
  const t = db.prepare('SELECT * FROM tournaments WHERE code = ?').get(req.params.code);
  if (!t) return err(res, 404, 'Tournoi introuvable');
  if (t.status !== 'waiting') return err(res, 400, 'Tournoi déjà commencé');
  const already = db.prepare('SELECT id FROM tournament_participants WHERE tournament_id = ? AND user_id = ?').get(t.id, req.user.id);
  if (already) return ok(res, { message: 'Déjà inscrit' });
  const count = db.prepare('SELECT COUNT(*) AS n FROM tournament_participants WHERE tournament_id = ?').get(t.id).n;
  if (count >= t.max_players) return err(res, 400, 'Tournoi complet');
  db.prepare('INSERT INTO tournament_participants (tournament_id, user_id) VALUES (?, ?)').run(t.id, req.user.id);
  return ok(res, { message: 'Inscrit au tournoi' });
});

app.post('/tournaments/:code/start', requireAuth, (req, res) => {
  const t = db.prepare('SELECT * FROM tournaments WHERE code = ?').get(req.params.code);
  if (!t) return err(res, 404, 'Tournoi introuvable');
  if (t.creator_id !== req.user.id) return err(res, 403, 'Seul le créateur peut démarrer');
  db.prepare('UPDATE tournaments SET status = ? WHERE code = ?').run('active', req.params.code);
  return ok(res, { message: 'Tournoi démarré' });
});

app.post('/tournaments/:code/score', requireAuth, (req, res) => {
  const { score, total } = req.body || {};
  if (score == null || total == null) return err(res, 400, 'score et total requis');
  const t = db.prepare('SELECT * FROM tournaments WHERE code = ?').get(req.params.code);
  if (!t) return err(res, 404, 'Tournoi introuvable');
  db.prepare('UPDATE tournament_participants SET score = ?, total = ? WHERE tournament_id = ? AND user_id = ?')
    .run(Number(score), Number(total), t.id, req.user.id);
  const participants = db.prepare('SELECT * FROM tournament_participants WHERE tournament_id = ? ORDER BY score DESC').all(t.id);
  participants.forEach((p, i) => db.prepare('UPDATE tournament_participants SET rank = ? WHERE id = ?').run(i + 1, p.id));
  return ok(res, { message: 'Score enregistré' });
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
  if (!otherId) return err(res, 400, 'userId invalide');
  const msgs = db.prepare(`
    SELECT d.id, d.content, d.sent_at, u.name,
           CASE WHEN d.sender_id = ? THEN 1 ELSE 0 END AS is_mine
    FROM dm d JOIN users u ON u.id = d.sender_id
    WHERE (d.sender_id = ? AND d.receiver_id = ?) OR (d.sender_id = ? AND d.receiver_id = ?)
    ORDER BY d.sent_at ASC LIMIT 100
  `).all(req.user.id, req.user.id, otherId, otherId, req.user.id);
  return ok(res, { messages: msgs });
});

app.post('/dm/:userId', requireAuth, (req, res) => {
  const receiverId = Number(req.params.userId);
  if (!receiverId) return err(res, 400, 'userId invalide');
  const { content } = req.body || {};
  if (!content || !content.trim()) return err(res, 400, 'Message vide');
  const receiver = db.prepare('SELECT id FROM users WHERE id = ?').get(receiverId);
  if (!receiver) return err(res, 404, 'Destinataire introuvable');
  db.prepare('INSERT INTO dm (sender_id, receiver_id, content) VALUES (?, ?, ?)').run(req.user.id, receiverId, content.trim().slice(0, 500));
  return ok(res, { message: 'Message envoyé' });
});

/* â”€â”€ STATIC + HEALTH CHECK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
  console.log(`   JWT_SECRET : ${JWT_SECRET === 'changez-moi-en-production' ? 'âš  PAR DÃ‰FAUT â€” &#224; changer' : 'âœ“ configur&#233;'}`);
  console.log(`   RESEND_KEY : ${RESEND_KEY ? 'âœ“ configur&#233;' : 'âš  manquant â€” emails d&#233;sactiv&#233;s'}`);
});
