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

/* ── CONFIG ─────────────────────────────────────────────────── */
const PORT         = process.env.PORT || 3000;
const JWT_SECRET   = process.env.JWT_SECRET || 'changez-moi-en-production';
const RESEND_KEY   = process.env.RESEND_API_KEY || '';
const FROM_EMAIL   = process.env.FROM_EMAIL   || 'noreply@regularena.com';
const FRONTEND_URL = process.env.FRONTEND_URL  || 'https://regularena.com';
const TOKEN_TTL_H  = 24; // heures de validité du lien email

const resend = new Resend(RESEND_KEY);

/* ── BASE DE DONNÉES SQLite ──────────────────────────────────── */
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
`);

/* ── HELPERS ─────────────────────────────────────────────────── */
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
    { id: user.id, email: user.email, name: user.name, profile: user.profile },
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

/* ── MIDDLEWARE ──────────────────────────────────────────────── */
const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: [FRONTEND_URL, 'https://endregularena.up.railway.app'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '32kb' }));

const limiterStrict = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
const limiterLoose  = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });

/* ── AUTH MIDDLEWARE (routes protégées futures) ──────────────── */
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

/* ================================================================
   ROUTES AUTH
================================================================ */

/* POST /auth/register
   Body : { name, email, profile, country, etablissement }
   → crée ou retrouve l'utilisateur, envoie email de confirmation
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

  // Générer token de confirmation
  const token = genToken();
  db.prepare(
    'INSERT INTO confirm_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).run(user.id, token, expiresAt(TOKEN_TTL_H));

  // Envoyer email via Resend
  const confirmUrl = `${FRONTEND_URL}?token=${token}`;
  try {
    await resend.emails.send({
      from: `REGUL ARENA <${FROM_EMAIL}>`,
      to:   cleanEmail,
      subject: 'Confirme ton inscription — REGUL ARENA',
      html: emailConfirmHTML(cleanName, confirmUrl),
    });
  } catch (e) {
    console.error('Resend error:', e.message);
    return err(res, 500, 'Erreur envoi email — réessaie dans quelques instants');
  }

  return ok(res, { message: 'Email de confirmation envoyé' });
});


/* POST /auth/resend
   Body : { email }
   → renvoie le dernier lien de confirmation
*/
app.post('/auth/resend', limiterStrict, async (req, res) => {
  const { email } = req.body || {};
  if (!email) return err(res, 400, 'Email requis');

  const cleanEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  if (!user) return err(res, 404, 'Aucun compte trouvé pour cet email');

  const token = genToken();
  db.prepare(
    'INSERT INTO confirm_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).run(user.id, token, expiresAt(TOKEN_TTL_H));

  const confirmUrl = `${FRONTEND_URL}?token=${token}`;
  try {
    await resend.emails.send({
      from: `REGUL ARENA <${FROM_EMAIL}>`,
      to:   cleanEmail,
      subject: 'Nouveau lien de confirmation — REGUL ARENA',
      html: emailConfirmHTML(user.name, confirmUrl),
    });
  } catch (e) {
    return err(res, 500, 'Erreur envoi email');
  }

  return ok(res, { message: 'Email renvoyé' });
});


/* GET /auth/verify?token=xxx
   → vérifie le token, marque email comme confirmé, retourne JWT + user
*/
app.get('/auth/verify', limiterLoose, (req, res) => {
  const { token } = req.query;
  if (!token) return err(res, 400, 'Token manquant');

  const row = db.prepare(
    'SELECT * FROM confirm_tokens WHERE token = ? AND used = 0'
  ).get(token);

  if (!row) return err(res, 400, 'Lien invalide ou déjà utilisé');
  if (new Date(row.expires_at) < new Date()) return err(res, 400, 'Lien expiré — demande un nouveau');

  // Marquer token utilisé + email vérifié
  db.prepare('UPDATE confirm_tokens SET used = 1 WHERE id = ?').run(row.id);
  db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(row.user_id);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id);
  return ok(res, { token: signJWT(user), user: publicUser(user) });
});


/* GET /auth/login-verify?login_token=xxx
   → connexion magique (lien email)
*/
app.get('/auth/login-verify', limiterLoose, (req, res) => {
  const { login_token } = req.query;
  if (!login_token) return err(res, 400, 'Token manquant');

  const row = db.prepare(
    'SELECT * FROM login_tokens WHERE token = ? AND used = 0'
  ).get(login_token);

  if (!row) return err(res, 400, 'Lien invalide ou déjà utilisé');
  if (new Date(row.expires_at) < new Date()) return err(res, 400, 'Lien expiré');

  db.prepare('UPDATE login_tokens SET used = 1 WHERE id = ?').run(row.id);

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(row.email);
  if (!user) return err(res, 404, 'Compte introuvable');

  return ok(res, { token: signJWT(user), user: publicUser(user) });
});


/* ================================================================
   ROUTES FEEDBACK
================================================================ */

/* POST /feedback
   Body : { type, content, email? }
*/
app.post('/feedback', limiterLoose, (req, res) => {
  const { type = 'general', content, email = '' } = req.body || {};
  if (!content || content.length < 2) return err(res, 400, 'Contenu requis');

  db.prepare(
    'INSERT INTO feedback (type, content, email) VALUES (?, ?, ?)'
  ).run(type, content.slice(0, 2000), email.slice(0, 120));

  return ok(res, { message: 'Feedback enregistré' });
});


/* POST /feedback/notify
   Body : { email }
   → liste d'attente tournoi 2027
*/
app.post('/feedback/notify', limiterLoose, (req, res) => {
  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err(res, 400, 'Email invalide');

  try {
    db.prepare('INSERT INTO notify_list (email) VALUES (?)').run(email.trim().toLowerCase());
  } catch {
    // email déjà dans la liste — silencieux
  }

  return ok(res, { message: 'Inscrit à la liste d\'alerte' });
});


/* ── STATIC + HEALTH CHECK ─────────────────────────────────── */
app.use(express.static(__dirname));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/api", (req, res) => res.json({ status: "ok", message: "API REGUL ARENA en ligne" }));


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

function escEmail(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, profile: u.profile, country: u.country, etablissement: u.etablissement };
}


/* ── START ───────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`✅ REGUL ARENA API — port ${PORT}`);
  console.log(`   DB : regularena.db`);
  console.log(`   JWT_SECRET : ${JWT_SECRET === 'changez-moi-en-production' ? '⚠ PAR DÉFAUT — à changer' : '✓ configuré'}`);
  console.log(`   RESEND_KEY : ${RESEND_KEY ? '✓ configuré' : '⚠ manquant — emails désactivés'}`);
});
