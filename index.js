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
// PUSH — module web-push chargé en mode garde : si non installé, le serveur démarre quand même (push simplement désactivées)
let webpush = null;
try { webpush = require('web-push'); } catch (_) { console.warn('[PUSH] module "web-push" non installé — npm install web-push pour activer les notifications push.'); }

/* â”€â”€ CONFIG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const PORT         = process.env.PORT || 3000;
const JWT_SECRET   = process.env.JWT_SECRET; // MODIFIÉ — crash guard : JWT_SECRET obligatoire en production
if (!JWT_SECRET) { console.error('❌ FATAL : JWT_SECRET non défini dans les variables d\'env Railway. Arrêt du serveur.'); process.exit(1); }
const RESEND_KEY   = process.env.RESEND_API_KEY || '';
const FROM_EMAIL   = process.env.FROM_EMAIL || 'noreply@regularena.com';
// SOURCE DE VERITE UNIQUE
const BASE_URL = process.env.BASE_URL || 'https://endregularena-production.up.railway.app';
const TOKEN_TTL_H = 24;

// PUSH — configuration VAPID (clés à définir dans les variables d'env Railway)
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:abdou.ndao@regularena.com';
let PUSH_ENABLED = false;
if (webpush && VAPID_PUBLIC && VAPID_PRIVATE) {
  try { webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE); PUSH_ENABLED = true; console.log('[PUSH] Notifications push activées.'); }
  catch (e) { console.warn('[PUSH] Clés VAPID invalides — push désactivées :', e.message); }
} else {
  console.warn('[PUSH] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY manquantes — push désactivées.');
}

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
 // MODIFIÉ — visibilité dans le Direct public (0 = visible, 1 = masqué par un joueur)
 'ALTER TABLE duels ADD COLUMN hidden_live INTEGER NOT NULL DEFAULT 0',
].forEach(sql => { try { db.exec(sql); } catch(_) {} });
// ORG — code collectif réutilisable d'invitation (écoles/institutions)
try { db.exec('ALTER TABLE organisations ADD COLUMN join_code TEXT'); } catch(_) {}
try { db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_org_join_code ON organisations (join_code)'); } catch(_) {}
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
 'ALTER TABLE tournaments ADD COLUMN match_mode TEXT NOT NULL DEFAULT \'duel\'', // ROI-POULES : mode des matchs (duel | kotm)
 'ALTER TABLE tournaments ADD COLUMN champion_id INTEGER', // ROI-POULES : vainqueur final du bracket
 // FEATURE 1/2 — invitation bêta + CGU
 'ALTER TABLE users ADD COLUMN cgu_accepted_at TEXT',
 'ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT "user"',
 // PRÉSENCE — dernière activité de l'utilisateur (heartbeat frontend)
 'ALTER TABLE users ADD COLUMN last_seen TEXT',
 // ORG-TOURNOI AJOUT — tournois privés programmés par un établissement partenaire
 'ALTER TABLE tournaments ADD COLUMN org_id INTEGER',
 'ALTER TABLE tournaments ADD COLUMN end_date TEXT NOT NULL DEFAULT \'\'',
 'ALTER TABLE tournaments ADD COLUMN visibility TEXT NOT NULL DEFAULT \'public\'',
].forEach(sql => { try { db.exec(sql); } catch(_) {} }); // TOURNOI AJOUT
try { db.exec('CREATE INDEX IF NOT EXISTS idx_tournaments_org ON tournaments (org_id, status)'); } catch(_) {} // ORG-TOURNOI AJOUT
try { db.exec("ALTER TABLE org_members ADD COLUMN agence TEXT NOT NULL DEFAULT ''"); } catch(_) {} // ORG-AGENCE AJOUT

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

// MODIFIÉ — récupération des inscrits non vérifiés (idempotent : sans effet une fois tous à 1)
db.prepare("UPDATE users SET email_verified = 1 WHERE email_verified = 0").run();

/* ── NOTIFICATIONS HELPER ──────────────────────────────────────────── */
function notifyAllExcept(excludeUserId, type, message) {
  const users = db.prepare('SELECT id FROM users WHERE email_verified = 1 AND id != ? ORDER BY RANDOM() LIMIT 50').all(excludeUserId);
  const insert = db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)');
  const tx = db.transaction(() => { users.forEach(u => insert.run(u.id, type, message)); });
  tx();
}

/* ── PUSH WEB (VAPID) ──────────────────────────────────────────────── */
// PUSH — table des abonnements push (un appareil = une ligne, dédoublonné par endpoint)
db.exec(`
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    endpoint   TEXT    NOT NULL UNIQUE,
    p256dh     TEXT    NOT NULL,
    auth       TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);
try { db.exec('CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions (user_id)'); } catch (_) {}

// PUSH — envoie une notif push à un utilisateur (tous ses appareils). Nettoie les abonnements périmés (404/410).
function sendPushToUser(userId, payload) {
  if (!PUSH_ENABLED) return;
  let subs;
  try { subs = db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').all(userId); }
  catch (_) { return; }
  if (!subs.length) return;
  const body = JSON.stringify(payload);
  subs.forEach(s => {
    webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body)
      .catch(e => {
        if (e && (e.statusCode === 404 || e.statusCode === 410)) {
          try { db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(s.id); } catch (_) {}
        }
      });
  });
}

// PUSH — diffuse une push à tous les inscrits vérifiés sauf l'auteur (max 50, comme l'in-app)
function pushAllExcept(excludeUserId, payload) {
  if (!PUSH_ENABLED) return;
  let rows;
  try {
    rows = db.prepare(
      'SELECT DISTINCT ps.user_id AS id FROM push_subscriptions ps JOIN users u ON u.id = ps.user_id WHERE u.email_verified = 1 AND ps.user_id != ? LIMIT 50'
    ).all(excludeUserId);
  } catch (_) { return; }
  rows.forEach(r => sendPushToUser(r.id, payload));
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
      country: user.country, // MODIFIÉ — country embarqué dans le JWT (session restaurée garde le pays)
      etablissement: user.etablissement || '', // AJOUT (task C) — nécessaire pour reconnaître la banque côté frontend sans appel réseau supplémentaire
      role: user.role || 'user', is_verified: user.email_verified === 1 },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/* Middleware admin — vérifie JWT + rôle EN DIRECT en base (et non plus le seul claim figé
   dans le token). Sans ça, une promotion via /admin/promote restait invisible tant que
   la personne ne se déconnectait pas/reconnectait pas manuellement. */
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token manquant' });
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
    const liveUser = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(decoded.id);
    if (!liveUser || !isAdmin(liveUser)) return res.status(403).json({ error: 'Accès refusé' });
    req.user = { ...decoded, role: liveUser.role || 'user' }; // MODIFIÉ — rôle toujours à jour
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
      connectSrc: ["'self'", "https://www.regularena.com", "https://regularena.com", "https://endregularena-production.up.railway.app", "https://endregularena-production-b268.up.railway.app"], // MODIFIÉ
      imgSrc:        ["'self'", "data:"],
      frameAncestors:["'none'"],
    },
  },
}));
app.use((req, res, next) => {
   const allowed = ['https://www.regularena.com','https://regularena.com','https://endregularena-production.up.railway.app','https://endregularena-production-b268.up.railway.app']; // MODIFIÉ — nouveau domaine Railway
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
      "INSERT INTO users (name, email, profile, country, etablissement, cgu_accepted_at, email_verified) VALUES (?, ?, ?, ?, ?, datetime('now'), 1)" // MODIFIÉ — auto-vérifié à l'inscription
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
      subject: 'Bienvenue sur REGUL ARENA — ton compte est actif',
      html: emailWelcomeHTML(cleanName, BASE_URL), // MODIFIÉ — email de bienvenue (compte déjà actif, aucune confirmation requise)
      headers: { 'X-Entity-Ref-ID': crypto.randomUUID() },
    });
    if (sendResult.error) console.error('Resend error (NON bloquant):', JSON.stringify(sendResult.error)); // MODIFIÉ — l'échec d'envoi ne bloque plus l'inscription
  } catch (e) {
    console.error('Resend exception (NON bloquant):', e.message); // MODIFIÉ — l'échec d'envoi ne bloque plus l'inscription
  }

  // FEATURE 1 — marquer l'invitation comme utilisée après succès
  if (req._invitation) {
    db.prepare('UPDATE invitations SET used = 1 WHERE id = ?').run(req._invitation.id);
  }

  return ok(res, { message: 'Inscription réussie', jwt: signJWT(user), user: publicUser(user) }); // MODIFIÉ — JWT immédiat, plus de blocage email
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
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail); // MODIFIÉ — reconnexion ouverte à tous les inscrits

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
    if (sendResult.error) console.error('Resend error (NON bloquant):', JSON.stringify(sendResult.error)); // MODIFIÉ — l'échec d'envoi ne bloque plus l'inscription
  } catch (e) {
    console.error('Resend exception (NON bloquant):', e.message); // MODIFIÉ — l'échec d'envoi ne bloque plus l'inscription
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
   -> connexion magique (lien email)
   MODIFIÉ 21/06 — ANTI-SCANNER : un simple GET ne consomme PLUS le token.
   Les scanners d'email / le préchargement Chrome ouvraient le lien avant le vrai
   clic et le grillaient (« déjà utilisé »). Désormais le GET ne fait QUE lire
   (aucune écriture) et affiche une page propre ; la consommation se fait via
   POST /auth/login-consume déclenché en JS (que les scanners n'exécutent pas).
   Le JWT n'est donc jamais exposé dans une URL de redirection. */
app.get('/auth/login-verify', limiterLoose, (req, res) => {
  const { login_token } = req.query;
  res.set('Content-Type', 'text/html; charset=utf-8');

  const tok = typeof login_token === 'string' ? login_token : '';
  const row = tok ? db.prepare('SELECT * FROM login_tokens WHERE token = ?').get(tok) : null;

  let state = 'invalid';
  if (row) state = (new Date(row.expires_at) < new Date()) ? 'expired' : 'valid';

  return res.send(renderLoginVerifyPage(tok, state));
});

/* POST /auth/login-consume   Body : { login_token }
   MODIFIÉ 21/06 — consomme réellement le token (appelé en JS par la page ci-dessus).
   Idempotent tant que le token n'est pas expiré : si le POST se déclenche deux fois
   (préchargement + vrai clic), les deux réussissent -> plus jamais de « déjà utilisé ». */
app.post('/auth/login-consume', limiterLoose, (req, res) => {
  const { login_token } = req.body || {};
  if (!login_token) return err(res, 400, 'Token manquant');

  const row = db.prepare('SELECT * FROM login_tokens WHERE token = ?').get(login_token);
  if (!row) return err(res, 400, 'Lien invalide');
  if (new Date(row.expires_at) < new Date()) return err(res, 400, 'Lien expiré');

  db.prepare('UPDATE login_tokens SET used = 1 WHERE id = ?').run(row.id);

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(row.email);
  if (!user) return err(res, 404, 'Compte introuvable');

  const jwtToken = signJWT(user);
  return ok(res, { redirect: `${BASE_URL}/?confirmed=true&jwt=${encodeURIComponent(jwtToken)}` });
});

/* Page HTML de connexion (interstitiel anti-scanner) — MODIFIÉ 21/06 */
function renderLoginVerifyPage(tok, state) {
  const base = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Connexion — REGUL ARENA</title>
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
background:radial-gradient(700px 400px at 15% 0%,rgba(245,196,83,.10),transparent 60%),linear-gradient(160deg,#112240,#0A192F 55%,#040D1A);
font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#F8F9FA}
.card{width:100%;max-width:420px;background:rgba(17,34,64,.72);border:1px solid rgba(35,53,84,.6);
border-radius:22px;padding:34px 28px;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.35)}
.brand{font-size:14px;letter-spacing:4px;font-weight:800;color:#F5C453;margin-bottom:18px}
.sp{width:46px;height:46px;border:4px solid rgba(245,196,83,.25);border-top-color:#F5C453;border-radius:50%;
animation:spin 1s linear infinite;margin:6px auto 18px}
@keyframes spin{to{transform:rotate(360deg)}}
h1{font-size:21px;margin:0 0 8px}
p{color:#9DB2D0;font-size:15px;line-height:1.55;margin:0 0 20px}
.btn{display:inline-block;background:linear-gradient(180deg,#FFE08A,#E8B520);color:#0A192F;font-weight:800;
text-decoration:none;border:0;cursor:pointer;font-size:16px;padding:14px 26px;border-radius:30px}
.ic{font-size:42px;margin-bottom:10px}
.muted{color:#5C6B85;font-size:12px;margin-top:18px}
</style></head><body><div class="card"><div class="brand">REGUL ARENA</div>`;
  const foot = `<div class="muted">Connexion sécurisée — UEMOA &amp; CEMAC</div></div></body></html>`;

  if (state === 'valid') {
    return base +
`<div class="sp" id="spin"></div>
<h1>Connexion en cours…</h1>
<p id="msg">Un instant, on vous connecte.</p>
<button class="btn" id="go" style="display:none">Se connecter</button>
<script>
(function(){
  var TOK=${JSON.stringify(tok)};
  var spin=document.getElementById('spin'),msg=document.getElementById('msg'),btn=document.getElementById('go');
  function fail(t){ if(spin)spin.style.display='none'; msg.textContent=t||'Lien invalide ou déjà utilisé.'; btn.style.display='inline-block'; btn.textContent='Réessayer'; }
  function go(){
    fetch('/auth/login-consume',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({login_token:TOK})})
      .then(function(r){return r.json();})
      .then(function(d){ if(d&&d.success&&d.redirect){ location.replace(d.redirect); } else { fail(d&&d.error); } })
      .catch(function(){ fail('Erreur réseau — réessayez.'); });
  }
  btn.addEventListener('click',go);
  setTimeout(go,350);
})();
</script>` + foot;
  }

  const icon  = state === 'expired' ? '⏱️' : '🔗';
  const title = state === 'expired' ? 'Lien expiré' : 'Lien invalide';
  const note  = state === 'expired'
    ? 'Ce lien de connexion a dépassé sa durée de validité.'
    : 'Ce lien est invalide ou a déjà servi à se connecter.';
  return base +
`<div class="ic">${icon}</div>
<h1>${title}</h1>
<p>${note} Demandez-en un nouveau, c'est immédiat.</p>
<a class="btn" href="${BASE_URL}/">Demander un nouveau lien</a>` + foot;
}


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
    SELECT u.id, u.name, u.country, u.profile,
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

/* ── CLASSEMENT PAR BANQUE / ÉTABLISSEMENT ──────────────────────────
   Agrège les scores solo par établissement (banque/institution). Le
   regroupement est insensible à la casse et aux espaces pour éviter
   les doublons ("BCEAO" / "bceao "). Filtres zone (uemoa/cemac) et
   profil identiques au classement joueurs. Renvoie aussi le rang de
   la banque du joueur connecté si un token est fourni.
*/
app.get('/leaderboard/banks', (req, res) => {
  try {
    const { zone, profile } = req.query;
    const UEMOA = ['SN','CI','BF','ML','BJ','NE','TG','GW'];
    const CEMAC  = ['CM','GA','CG','CF','GQ','TD'];
    // La banque a pu être saisie dans 'etablissement' OU (anciens comptes / formulaire) dans 'profile'.
    // On prend 'etablissement' s'il est rempli, sinon 'profile' quand ce n'est pas un simple rôle.
    const BANK_EXPR = `TRIM(CASE WHEN TRIM(u.etablissement) <> '' THEN u.etablissement WHEN LOWER(TRIM(u.profile)) NOT IN ('professionnel','etudiant','étudiant','') THEN u.profile ELSE '' END)`;
    const conditions = ['u.email_verified = 1', `${BANK_EXPR} <> ''`];
    const params = [];
    if (zone === 'uemoa') { conditions.push(`u.country IN (${UEMOA.map(()=>'?').join(',')})`); params.push(...UEMOA); }
    else if (zone === 'cemac') { conditions.push(`u.country IN (${CEMAC.map(()=>'?').join(',')})`); params.push(...CEMAC); }

    const rows = db.prepare(`
      SELECT ${BANK_EXPR}                      AS bank,
             LOWER(${BANK_EXPR})               AS bank_key,
             COUNT(DISTINCT u.id)             AS members,
             COUNT(s.id)                      AS games,
             COALESCE(SUM(s.score), 0)        AS total_score
      FROM users u
      LEFT JOIN user_scores s ON s.user_id = u.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY bank_key
      HAVING total_score > 0 AND members >= 3
      ORDER BY total_score DESC, members ASC
      LIMIT 50
    `).all(...params);

    // Score moyen par membre : récompense l'engagement collectif, pas seulement la taille
    rows.forEach(r => { r.avg_score = r.members ? Math.round(r.total_score / r.members) : 0; });

    // Rang de la banque du joueur connecté (même si elle est hors top 50 affiché)
    let myBank = null, myRank = null;
    const hdr = req.headers['authorization'] || '';
    const tok = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (tok) {
      try {
        const p = jwt.verify(tok, JWT_SECRET);
        const me = db.prepare('SELECT etablissement, profile FROM users WHERE id = ?').get(p.id);
        if (me) {
          const roles = ['professionnel','etudiant','étudiant',''];
          let b = (me.etablissement || '').trim();
          if (!b) { const pr = (me.profile || '').trim(); if (roles.indexOf(pr.toLowerCase()) === -1) b = pr; }
          if (b) {
            myBank = b;
            const key = b.toLowerCase();
            const idx = rows.findIndex(r => r.bank_key === key);
            if (idx !== -1) myRank = idx + 1;
          }
        }
      } catch (_) {}
    }
    return ok(res, { leaderboard: rows, my_bank: myBank, my_rank: myRank });
  } catch (e) {
    return err(res, 500, 'Erreur serveur (classement banques)');
  }
});

/* ── MEMBRES D'UNE BANQUE ────────────────────────────────────────────
   Classement individuel des joueurs d'un même établissement. Le nom de
   la banque est reçu en clair (?bank=) et comparé de façon insensible à
   la casse/aux espaces. Filtres zone/profil optionnels, identiques.
*/
app.get('/leaderboard/banks/members', (req, res) => {
  try {
    const bankRaw = (req.query.bank || '').trim();
    if (!bankRaw) return err(res, 400, 'Paramètre bank requis');
    const bankKey = bankRaw.toLowerCase();
    const { zone } = req.query;
    const UEMOA = ['SN','CI','BF','ML','BJ','NE','TG','GW'];
    const CEMAC  = ['CM','GA','CG','CF','GQ','TD'];
    // Même logique que /leaderboard/banks : la banque vient de 'etablissement' ou, à défaut, de 'profile'.
    const BANK_EXPR = `TRIM(CASE WHEN TRIM(u.etablissement) <> '' THEN u.etablissement WHEN LOWER(TRIM(u.profile)) NOT IN ('professionnel','etudiant','étudiant','') THEN u.profile ELSE '' END)`;
    const conditions = ['u.email_verified = 1', `LOWER(${BANK_EXPR}) = ?`];
    const params = [bankKey];
    if (zone === 'uemoa') { conditions.push(`u.country IN (${UEMOA.map(()=>'?').join(',')})`); params.push(...UEMOA); }
    else if (zone === 'cemac') { conditions.push(`u.country IN (${CEMAC.map(()=>'?').join(',')})`); params.push(...CEMAC); }

    const rows = db.prepare(`
      SELECT u.id, u.name, u.country, u.profile, ${BANK_EXPR} AS bank,
             COUNT(s.id)                AS games,
             COALESCE(SUM(s.score), 0)  AS total_score
      FROM users u
      LEFT JOIN user_scores s ON s.user_id = u.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY u.id
      HAVING total_score > 0
      ORDER BY total_score DESC, games ASC
      LIMIT 100
    `).all(...params);

    // Nom d'affichage : on garde la casse réelle telle que saisie par un membre
    const bankName = rows.length ? (rows[0].bank || bankRaw) : bankRaw;
    const totalScore = rows.reduce((a, r) => a + (r.total_score || 0), 0);

    let myId = null, viewer = null; // MODIFIÉ
    const hdr = req.headers['authorization'] || '';
    const tok = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (tok) { try { const p = jwt.verify(tok, JWT_SECRET); myId = p.id; viewer = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(p.id); } catch (_) {} } // MODIFIÉ

    // CONFIDENTIALITÉ (CDP) : le détail NOMINATIF du personnel d'un établissement // MODIFIÉ
    // n'est ouvert qu'à l'admin REGUL ARENA. Les autres ne reçoivent que l'agrégat (aucun nom). // MODIFIÉ
    if (!viewer || !isAdmin(viewer)) { // MODIFIÉ
      return ok(res, { bank: bankName, restricted: true, count: rows.length, total_score: totalScore }); // MODIFIÉ
    } // MODIFIÉ

    return ok(res, { bank: bankName, members: rows, count: rows.length, total_score: totalScore, my_id: myId });
  } catch (e) {
    return err(res, 500, 'Erreur serveur (membres banque)');
  }
});

/* ── TABLEAU DE BORD D'UNE BANQUE : forces / faiblesses par thème ──── // MODIFIÉ (task B)
   Niveau Kirkpatrick 2 (apprentissage) : taux de réussite (score/total)
   agrégé par pack_id pour les membres d'une même banque. Même logique de
   rattachement (etablissement OU profile) et de filtre zone que ci-dessus.
*/
app.get('/leaderboard/banks/themes', (req, res) => {
  try {
    const bankRaw = (req.query.bank || '').trim();
    if (!bankRaw) return err(res, 400, 'Paramètre bank requis');
    // CONFIDENTIALITÉ (CDP) : analyse NOMINATIVE par thème réservée à l'admin REGUL ARENA. // MODIFIÉ
    let viewer = null; // MODIFIÉ
    const hdrT = req.headers['authorization'] || ''; // MODIFIÉ
    const tokT = hdrT.startsWith('Bearer ') ? hdrT.slice(7) : null; // MODIFIÉ
    if (tokT) { try { viewer = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(jwt.verify(tokT, JWT_SECRET).id); } catch (_) {} } // MODIFIÉ
    if (!viewer || !isAdmin(viewer)) { return ok(res, { bank: bankRaw, restricted: true, themes: [], count: 0 }); } // MODIFIÉ
    const bankKey = bankRaw.toLowerCase();
    const { zone } = req.query;
    const UEMOA = ['SN','CI','BF','ML','BJ','NE','TG','GW'];
    const CEMAC  = ['CM','GA','CG','CF','GQ','TD'];
    const BANK_EXPR = `TRIM(CASE WHEN TRIM(u.etablissement) <> '' THEN u.etablissement WHEN LOWER(TRIM(u.profile)) NOT IN ('professionnel','etudiant','étudiant','') THEN u.profile ELSE '' END)`;
    const conditions = ['u.email_verified = 1', `LOWER(${BANK_EXPR}) = ?`];
    const params = [bankKey];
    if (zone === 'uemoa') { conditions.push(`u.country IN (${UEMOA.map(()=>'?').join(',')})`); params.push(...UEMOA); }
    else if (zone === 'cemac') { conditions.push(`u.country IN (${CEMAC.map(()=>'?').join(',')})`); params.push(...CEMAC); }

    const rows = db.prepare(`
      SELECT s.pack_id                 AS pack_id,
             COUNT(s.id)               AS parties,
             COUNT(DISTINCT s.user_id) AS joueurs,
             COALESCE(SUM(s.score), 0) AS sc,
             COALESCE(SUM(s.total), 0) AS tt
      FROM users u
      JOIN user_scores s ON s.user_id = u.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY s.pack_id
      HAVING tt >= 5
      ORDER BY (1.0 * sc / tt) DESC, parties DESC
    `).all(...params);

    const themes = rows.map(r => ({
      pack_id: r.pack_id,
      parties: r.parties,
      joueurs: r.joueurs,
      taux: r.tt ? Math.round(100 * r.sc / r.tt) : 0
    }));
    return ok(res, { bank: bankRaw, themes, count: themes.length });
  } catch (e) {
    return err(res, 500, 'Erreur serveur (thèmes banque)');
  }
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

/* ── PUSH WEB : routes ──────────────────────────────────────────────── */
// PUSH — clé publique VAPID + état (le frontend en a besoin pour s'abonner). Pas d'auth.
app.get('/push/vapid-public-key', (req, res) => {
  return ok(res, { key: VAPID_PUBLIC, enabled: PUSH_ENABLED });
});

// PUSH — enregistre / met à jour l'abonnement push de l'appareil courant
app.post('/push/subscribe', requireAuth, (req, res) => {
  const sub = (req.body && req.body.subscription) || req.body || {};
  const endpoint = sub && sub.endpoint;
  const keys = sub && sub.keys;
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) return err(res, 400, 'Abonnement push invalide');
  try {
    // upsert par endpoint : on réattribue à l'utilisateur courant si l'endpoint existe déjà
    db.prepare(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`
    ).run(req.user.id, endpoint, keys.p256dh, keys.auth);
  } catch (e) {
    return err(res, 500, 'Enregistrement push impossible');
  }
  return ok(res, { message: 'Abonné aux notifications', enabled: PUSH_ENABLED });
});

// PUSH — supprime l'abonnement de l'appareil courant
app.post('/push/unsubscribe', requireAuth, (req, res) => {
  const endpoint = (req.body && req.body.endpoint) || ((req.body && req.body.subscription && req.body.subscription.endpoint));
  if (endpoint) { try { db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?').run(endpoint, req.user.id); } catch (_) {} }
  return ok(res, { message: 'Désabonné' });
});

/* ── PRÉSENCE EN LIGNE ──────────────────────────────────────────────── */
// PRÉSENCE — fenêtre (secondes) pendant laquelle un utilisateur est considéré « en ligne »
const PRESENCE_WINDOW_S = 120;
// PRÉSENCE — noms masqués (comptes admin / tests), alignés avec le frontend
const PRESENCE_HIDDEN = ['abdou ndao', 'kaiser ndao'];

// PRÉSENCE — heartbeat : met à jour last_seen. Si l'utilisateur revient après une absence,
// pousse « 🟢 X est en ligne » aux autres joueurs actuellement connectés (sans spam).
app.post('/presence/ping', requireAuth, (req, res) => {
  let wasOffline = true;
  try {
    const prev = db.prepare('SELECT last_seen FROM users WHERE id = ?').get(req.user.id);
    if (prev && prev.last_seen) {
      const ageSec = (Date.now() - new Date(prev.last_seen.replace(' ', 'T') + 'Z').getTime()) / 1000;
      // « revient en ligne » seulement après > 5 min d'absence → évite les push répétés du heartbeat (45 s)
      wasOffline = !(ageSec >= 0 && ageSec < 300);
    }
  } catch (_) {}
  try { db.prepare("UPDATE users SET last_seen = datetime('now') WHERE id = ?").run(req.user.id); } catch (_) {}

  if (wasOffline && PUSH_ENABLED) {
    try {
      const me = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
      const myName = me && me.name ? me.name : 'Un joueur';
      if (PRESENCE_HIDDEN.indexOf(myName.trim().toLowerCase()) === -1) {
        // cibles = autres joueurs en ligne à l'instant et abonnés aux push
        const others = db.prepare(
          `SELECT DISTINCT u.id AS id FROM users u
           JOIN push_subscriptions ps ON ps.user_id = u.id
           WHERE u.id != ? AND u.email_verified = 1
             AND u.last_seen IS NOT NULL
             AND (julianday('now') - julianday(u.last_seen)) * 86400 < ?
           LIMIT 50`
        ).all(req.user.id, PRESENCE_WINDOW_S);
        others.forEach(o => sendPushToUser(o.id, {
          title: '🟢 ' + myName + ' est en ligne',
          body: 'Défiez-le en duel ou lancez un débat maintenant !',
          tag: 'online-' + req.user.id,
          url: '/?arena=1'
        }));
      }
    } catch (_) {}
  }
  return ok(res, { ok: true });
});

// PRÉSENCE — liste des joueurs en ligne (hors soi-même et comptes masqués)
app.get('/presence/online', requireAuth, (req, res) => {
  let rows = [];
  try {
    rows = db.prepare(
      `SELECT id, name, country FROM users
       WHERE id != ? AND email_verified = 1
         AND last_seen IS NOT NULL
         AND (julianday('now') - julianday(last_seen)) * 86400 < ?
       ORDER BY last_seen DESC LIMIT 30`
    ).all(req.user.id, PRESENCE_WINDOW_S);
  } catch (_) {}
  const online = rows.filter(u => PRESENCE_HIDDEN.indexOf((u.name || '').trim().toLowerCase()) === -1);
  return ok(res, { online });
});

/* ── DUELS ──────────────────────────────────────────────────────── */
function _duelFull(code, revealQuestions = false) {
  const duel = db.prepare('SELECT * FROM duels WHERE code = ?').get(code);
  if (!duel) return null;
  const creator = db.prepare('SELECT id, name, country FROM users WHERE id = ?').get(duel.creator_id);
  const joiner  = duel.joiner_id ? db.prepare('SELECT id, name, country FROM users WHERE id = ?').get(duel.joiner_id) : null;
  const scores  = db.prepare('SELECT user_id, score, questions_answered, finished FROM duel_scores WHERE duel_id = ?').all(duel.id);
  // MODIFIÉ — expose questions_json (avec bonnes réponses) UNIQUEMENT quand le duel est terminé (feuille de match)
  const reveal = revealQuestions || duel.status === 'finished';
  const { questions_json, ...duelSafe } = duel;
  return { ...duelSafe, questions_json: reveal ? questions_json : undefined, creator, joiner, scores };
}

app.post('/duels', requireAuth, (req, res) => {
  const { pack_id, num_questions = 10, timer_sec = 30, target_user_id } = req.body || {}; // MODIFIÉ : target_user_id
  let code;
  for (let i = 0; i < 10; i++) {
    code = genCode('D');
    if (!db.prepare('SELECT id FROM duels WHERE code = ?').get(code)) break;
  }
  db.prepare('INSERT INTO duels (code, creator_id, pack_id, num_questions, timer_sec) VALUES (?, ?, ?, ?, ?)')
    .run(code, req.user.id, pack_id || 'general', Math.min(20, Math.max(5, Number(num_questions))), Math.min(60, Math.max(15, Number(timer_sec))));
  // MODIFIÉ — notif ciblée si target_user_id, sinon notif globale
  const tid = target_user_id ? Number(target_user_id) : null;
  if (tid && tid !== req.user.id) {
    db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)')
      .run(tid, 'duel_challenge', `⚔️ ${req.user.name} vous défie personnellement ! Code : ${code}`);
    // PUSH — défi personnel reçu : push ciblée vers l'adversaire
    sendPushToUser(tid, { title: '⚔️ Vous êtes défié !', body: `${req.user.name} vous défie en duel. Code : ${code}`, tag: 'duel-' + code, url: '/?duel=' + code });
  }
  notifyAllExcept(req.user.id, 'duel_created', `🥊 ${req.user.name} vous défie en duel ! Code : ${code}`);
  // PUSH — nouveau duel ouvert : diffusion aux abonnés (sauf défi déjà ciblé)
  if (!tid) pushAllExcept(req.user.id, { title: '🥊 Nouveau duel dans l\'Arène', body: `${req.user.name} lance un duel. Code : ${code}`, tag: 'duel-' + code, url: '/?duel=' + code });
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
  // PUSH — un adversaire a rejoint ton duel : push vers le créateur
  sendPushToUser(duel.creator_id, { title: '⚔️ Adversaire trouvé !', body: `${req.user.name} a rejoint votre duel. À vous de jouer !`, tag: 'duel-' + req.params.code, url: '/?duel=' + req.params.code });
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
  // MODIFIÉ — calcule q_elapsed_ms pour sync timer côté client
  // = temps écoulé depuis le début de la question courante
  let q_elapsed_ms = undefined;
  if (d.status === 'active' && d.started_at && d.timer_sec) {
    const startedMs = new Date(d.started_at).getTime();
    const qIdx = d.current_q_index || 0;
    const qStartMs = startedMs + qIdx * d.timer_sec * 1000;
    q_elapsed_ms = Math.max(0, Date.now() - qStartMs);
    if (q_elapsed_ms > d.timer_sec * 1000) q_elapsed_ms = d.timer_sec * 1000;
  }
  return ok(res, { duel: { ...d, q_elapsed_ms } });
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

// MODIFIÉ — recherche joueur par nom (min 2 caractères)
app.get('/users/search', requireAuth, (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return ok(res, { users: [] });
  const users = db.prepare(
    `SELECT id, name, country FROM users
     WHERE name LIKE ? AND id != ?
     ORDER BY name LIMIT 10`
  ).all('%' + q + '%', req.user.id);
  return ok(res, { users });
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
  try { // MODIFIÉ : éviter crash serveur
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
  } catch(e) { return err(res, 500, 'Erreur serveur certificat'); } // MODIFIÉ
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
  const { name, zone, pack_id, max_players, start_date, match_mode } = req.body || {}; // TOURNOI AJOUT // ROI-POULES: match_mode
  if (!name || !zone) return err(res, 400, 'name et zone requis'); // TOURNOI AJOUT
  if (!['uemoa','cemac','inter','country'].includes(zone)) return err(res, 400, 'Zone invalide'); // TOURNOI AJOUT
  const mp = Number(max_players); // TOURNOI AJOUT
  if (![4,8,16,32].includes(mp)) return err(res, 400, 'max_players doit être 4, 8, 16 ou 32'); // MODIFIÉ
  // PERMISSION (REGUL ARENA) : jusqu'à 4 joueurs = ouvert à tous ; au-delà = réservé aux organisateurs (admin ou jury). // GATING-CAPACITE
  const _creatorRole = (req.user && req.user.role) || 'user'; // GATING-CAPACITE
  if (mp > 4 && _creatorRole !== 'admin' && _creatorRole !== 'jury') { // GATING-CAPACITE
    return err(res, 403, 'Les tournois de plus de 4 joueurs sont réservés aux organisateurs. Vous pouvez créer un tournoi de 4 joueurs.'); // GATING-CAPACITE
  } // GATING-CAPACITE
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
    'INSERT INTO tournaments (code, creator_id, name, pack_id, max_players, status, country, zone, start_date, match_mode) VALUES (?,?,?,?,?,?,?,?,?,?)' // TOURNOI AJOUT // ROI-POULES
  ).run(code, req.user.id, name.trim().slice(0,80), pack_id || 'general', mp, 'waiting', user.country || '', zone, start_date || '', (match_mode === 'kotm' ? 'kotm' : 'duel')); // TOURNOI AJOUT // ROI-POULES
  db.prepare('INSERT INTO tournament_participants (tournament_id, user_id) VALUES (?,?)').run(result.lastInsertRowid, req.user.id); // TOURNOI AJOUT
  notifyAllExcept(req.user.id, 'tournament_created', '🏆 ' + user.name + ' crée le tournoi "' + name.trim() + '" ! Code : ' + code); // TOURNOI AJOUT
  // PUSH — nouveau tournoi : diffusion aux abonnés
  pushAllExcept(req.user.id, { title: '🏆 Nouveau tournoi !', body: user.name + ' lance « ' + name.trim() + ' ». Code : ' + code, tag: 'tour-' + code, url: '/?tournoi=' + code });
  return ok(res, { code, id: result.lastInsertRowid }); // TOURNOI AJOUT
}); // TOURNOI AJOUT

/* POST /org/tournament/create — JWT requis, admin de l'org.
   Tournoi privé programmé, réservé aux membres de l'établissement.
   curl -X POST /org/tournament/create -H 'Authorization: Bearer JWT' -d '{"org_id":1,"name":"Coupe Conformité","pack_id":"lbcft","max_players":16,"start_date":"2026-07-10T09:00","end_date":"2026-07-17T18:00"}'
*/
app.post('/org/tournament/create', requireAuth, (req, res) => { // ORG-TOURNOI AJOUT
  const { org_id, name, pack_id, max_players, start_date, end_date, match_mode } = req.body || {}; // ORG-TOURNOI AJOUT
  const orgId = Number(org_id); // ORG-TOURNOI AJOUT
  if (!orgId || !name) return err(res, 400, 'org_id et name requis'); // ORG-TOURNOI AJOUT
  const membre = db.prepare("SELECT role FROM org_members WHERE org_id = ? AND user_id = ?").get(orgId, req.user.id); // ORG-TOURNOI AJOUT
  if (!membre || membre.role !== 'admin') return err(res, 403, "Réservé à l'admin de l'établissement"); // ORG-TOURNOI AJOUT
  const mp = Number(max_players); // ORG-TOURNOI AJOUT
  if (![4,8,16,32,64].includes(mp)) return err(res, 400, 'max_players doit être 4, 8, 16, 32 ou 64'); // ORG-TOURNOI AJOUT
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id); // ORG-TOURNOI AJOUT
  let code; // ORG-TOURNOI AJOUT
  for (let i = 0; i < 10; i++) { // ORG-TOURNOI AJOUT
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase(); // ORG-TOURNOI AJOUT
    code = 'O-' + rand; // ORG-TOURNOI AJOUT
    if (!db.prepare('SELECT id FROM tournaments WHERE code = ?').get(code)) break; // ORG-TOURNOI AJOUT
  } // ORG-TOURNOI AJOUT
  const result = db.prepare( // ORG-TOURNOI AJOUT
    'INSERT INTO tournaments (code, creator_id, name, pack_id, max_players, status, country, zone, start_date, end_date, match_mode, org_id, visibility) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)' // ORG-TOURNOI AJOUT
  ).run(code, req.user.id, name.trim().slice(0,80), pack_id || 'general', mp, 'waiting', user.country || '', 'inter', start_date || '', end_date || '', (match_mode === 'kotm' ? 'kotm' : 'duel'), orgId, 'org'); // ORG-TOURNOI AJOUT
  db.prepare('INSERT INTO tournament_participants (tournament_id, user_id) VALUES (?,?)').run(result.lastInsertRowid, req.user.id); // ORG-TOURNOI AJOUT
  const membres = db.prepare('SELECT user_id FROM org_members WHERE org_id = ? AND user_id != ?').all(orgId, req.user.id); // ORG-TOURNOI AJOUT
  const insertNotif = db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?,?,?)'); // ORG-TOURNOI AJOUT
  membres.forEach(m => insertNotif.run(m.user_id, 'org_tournament_created', '🏆 Nouveau tournoi établissement « ' + name.trim() + ' » ! Code : ' + code)); // ORG-TOURNOI AJOUT
  return ok(res, { code, id: result.lastInsertRowid }); // ORG-TOURNOI AJOUT
}); // ORG-TOURNOI AJOUT

/* GET /org/tournament/list?org_id=xxx — JWT requis, membre de l'org. */
app.get('/org/tournament/list', requireAuth, (req, res) => { // ORG-TOURNOI AJOUT
  const orgId = Number(req.query.org_id); // ORG-TOURNOI AJOUT
  if (!orgId) return err(res, 400, 'org_id requis'); // ORG-TOURNOI AJOUT
  const membre = db.prepare('SELECT id FROM org_members WHERE org_id = ? AND user_id = ?').get(orgId, req.user.id); // ORG-TOURNOI AJOUT
  if (!membre) return err(res, 403, "Vous n'êtes pas membre de cet établissement"); // ORG-TOURNOI AJOUT
  const list = db.prepare( // ORG-TOURNOI AJOUT
    'SELECT t.*, u.name AS creator_name, (SELECT COUNT(*) FROM tournament_participants tp WHERE tp.tournament_id = t.id) AS nb FROM tournaments t JOIN users u ON u.id = t.creator_id WHERE t.org_id = ? ORDER BY t.created_at DESC LIMIT 50' // ORG-TOURNOI AJOUT
  ).all(orgId); // ORG-TOURNOI AJOUT
  return ok(res, { tournaments: list }); // ORG-TOURNOI AJOUT
}); // ORG-TOURNOI AJOUT
/* POST /tournament/join */
app.post('/tournament/join', requireAuth, (req, res) => { // TOURNOI AJOUT
  const { code } = req.body || {}; // TOURNOI AJOUT
  if (!code) return err(res, 400, 'code requis'); // TOURNOI AJOUT
  const t = db.prepare('SELECT * FROM tournaments WHERE code = ?').get(code.trim().toUpperCase()); // TOURNOI AJOUT
  if (!t) return err(res, 404, 'Tournoi introuvable'); // TOURNOI AJOUT
  if (!['waiting','qualif'].includes(t.status)) return err(res, 400, 'Inscriptions fermées pour ce tournoi'); // TOURNOI AJOUT
  if (t.visibility === 'org') { // ORG-TOURNOI AJOUT
    const membre = db.prepare('SELECT id FROM org_members WHERE org_id = ? AND user_id = ?').get(t.org_id, req.user.id); // ORG-TOURNOI AJOUT
    if (!membre) return err(res, 403, 'Tournoi réservé aux membres de cet établissement'); // ORG-TOURNOI AJOUT
  } // ORG-TOURNOI AJOUT
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
  // PUSH — un participant a rejoint ton tournoi : push vers le créateur
  sendPushToUser(t.creator_id, { title: '🏟 Nouveau participant', body: user.name + ' a rejoint « ' + t.name + ' » (' + (count+1) + '/' + t.max_players + ')', tag: 'tour-' + t.code, url: '/?tournoi=' + t.code });
  return ok(res, { message: 'Inscrit au tournoi', tournament: _tFull(t.code) }); // TOURNOI AJOUT
}); // TOURNOI AJOUT

/* GET /tournament/list */
app.get('/tournament/list', requireAuth, (req, res) => { // TOURNOI AJOUT
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id); // TOURNOI AJOUT
  if (!user) return err(res, 401, 'Session expirée, reconnecte-toi'); // MODIFIÉ — anti-crash user undefined
  const uZone = _zoneOf(user.country); // TOURNOI AJOUT
  // SECURITE FIX : utiliser des paramètres SQLite au lieu de l'interpolation de chaîne (anti-injection SQL)
  const BASE_OPEN_SQL = `SELECT t.*, u.name AS creator_name, (SELECT COUNT(*) FROM tournament_participants tp WHERE tp.tournament_id = t.id) AS nb FROM tournaments t JOIN users u ON u.id = t.creator_id WHERE t.status IN ('waiting','qualif','elim') AND t.visibility != 'org' AND (t.start_date = '' OR datetime(t.start_date) IS NULL OR datetime(t.start_date) >= datetime('now','-1 day'))`; // SECURITE FIX // MODIFIÉ — exclut les tournois programmés expirés // MODIFIÉ — exclut les tournois privés établissement
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

/* ── ROI-POULES : helpers bracket multi-mode (duel | kotm) ── */
function _tMatchGame(t, p1id, p2id) {
  // Crée le jeu support d'un match 1v1 selon le mode du tournoi ; renvoie son code.
  let code;
  if (t.match_mode === 'kotm') {
    for (let j = 0; j < 12; j++) { code = genCode('K'); if (!db.prepare('SELECT id FROM kotm_games WHERE code = ?').get(code)) break; }
    // Les 2 joueurs sont pré-assignés (créateur = p1, adversaire = p2, statut 'joined') :
    // le créateur n'a plus qu'à lancer (/kotm/:code/start) — le contrat KOTM gelé fait le reste.
    db.prepare("INSERT INTO kotm_games (code, creator_id, joiner_id, pack_id, num_questions, timer_sec, status) VALUES (?,?,?,?,?,?, 'joined')")
      .run(code, p1id, p2id, t.pack_id || 'general', 12, 20);
  } else {
    for (let j = 0; j < 12; j++) { code = genCode('D'); if (!db.prepare('SELECT id FROM duels WHERE code = ?').get(code)) break; }
    db.prepare('INSERT INTO duels (code, creator_id, pack_id, num_questions, timer_sec) VALUES (?,?,?,?,?)')
      .run(code, p1id, t.pack_id || 'general', 10, 30);
  }
  return code;
}
function _tBuildRound(t, round, ids) {
  // Apparie séquentiellement les `ids` (déjà ordonnés) et crée les matchs du tour.
  // Nombre impair → le dernier reçoit un bye (qualifié d'office, match déjà 'done').
  const mIns = db.prepare('INSERT INTO tournament_matches (tournament_id, round, player1_id, player2_id, winner_id, duel_code, status) VALUES (?,?,?,?,?,?,?)');
  const q = ids.slice();
  while (q.length >= 2) {
    const p1 = q.shift(), p2 = q.shift();
    const code = _tMatchGame(t, p1, p2);
    mIns.run(t.id, round, p1, p2, null, code, 'pending');
  }
  if (q.length === 1) { const bye = q.shift(); mIns.run(t.id, round, bye, null, bye, null, 'done'); }
}
function _tRoundWinners(tid, round) {
  // Vainqueurs d'un tour, dans l'ordre des matchs (appariement stable au tour suivant).
  return db.prepare("SELECT winner_id FROM tournament_matches WHERE tournament_id = ? AND round = ? ORDER BY id").all(tid, round)
    .map(m => m.winner_id).filter(Boolean);
}

/* POST /tournament/:code/generate-bracket — tour 1 (mode duel ou KOTM) */
app.post('/tournament/:code/generate-bracket', requireAuth, (req, res) => {
  const t = db.prepare('SELECT * FROM tournaments WHERE code = ?').get(req.params.code);
  if (!t) return err(res, 404, 'Tournoi introuvable');
  if (t.creator_id !== req.user.id) return err(res, 403, 'Seul le créateur peut générer le bracket');
  if (!['qualif','waiting'].includes(t.status)) return err(res, 400, 'Phase invalide pour générer un bracket');
  const participants = db.prepare('SELECT * FROM tournament_participants WHERE tournament_id = ? ORDER BY score DESC, COALESCE(rank,9999) ASC').all(t.id);
  if (participants.length < 2) return err(res, 400, 'Minimum 2 participants requis');
  const ids = participants.map(p => p.user_id);
  db.transaction(() => {
    db.prepare('DELETE FROM tournament_matches WHERE tournament_id = ?').run(t.id);
    _tBuildRound(t, 1, ids);
  })();
  db.prepare('UPDATE tournaments SET status = ? WHERE code = ?').run('elim', req.params.code);
  const allParts = db.prepare('SELECT user_id FROM tournament_participants WHERE tournament_id = ?').all(t.id);
  const nIns = db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?,?,?)');
  const modeLabel = t.match_mode === 'kotm' ? 'Roi de la Manche 👑' : 'duels';
  db.transaction(() => allParts.forEach(pp => nIns.run(pp.user_id, 'tournament_bracket', '🏆 Bracket généré pour "' + t.name + '" — phase d\'élimination en ' + modeLabel + ' !')))();
  return ok(res, { message: 'Bracket généré', tournament: _tFull(req.params.code) });
});

/* POST /tournament/:code/advance — clôt le tour courant et génère le suivant (ou la finale) */
app.post('/tournament/:code/advance', requireAuth, (req, res) => {
  const t = db.prepare('SELECT * FROM tournaments WHERE code = ?').get(req.params.code);
  if (!t) return err(res, 404, 'Tournoi introuvable');
  if (t.creator_id !== req.user.id) return err(res, 403, 'Seul le créateur peut faire avancer le tournoi');
  if (t.status !== 'elim') return err(res, 400, "Le tournoi n'est pas en phase d'élimination");
  const lastRound = (db.prepare('SELECT MAX(round) AS r FROM tournament_matches WHERE tournament_id = ?').get(t.id).r) || 1;
  const pend = db.prepare("SELECT COUNT(*) AS n FROM tournament_matches WHERE tournament_id = ? AND round = ? AND status != 'done'").get(t.id, lastRound).n;
  if (pend > 0) return err(res, 400, pend + ' match(s) du tour ' + lastRound + ' pas encore terminé(s)');
  const winners = _tRoundWinners(t.id, lastRound);
  if (winners.length <= 1) {
    const champ = winners[0] || null;
    db.prepare('UPDATE tournaments SET status = ?, champion_id = ? WHERE code = ?').run('finished', champ, req.params.code);
    if (champ) {
      const cu = db.prepare('SELECT name FROM users WHERE id = ?').get(champ);
      const allParts = db.prepare('SELECT user_id FROM tournament_participants WHERE tournament_id = ?').all(t.id);
      const nIns = db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?,?,?)');
      db.transaction(() => allParts.forEach(pp => nIns.run(pp.user_id, 'tournament_finished', '🏆 ' + (cu ? cu.name : 'Un champion') + ' remporte le tournoi "' + t.name + '" !')))();
    }
    return ok(res, { message: 'Tournoi terminé', finished: true, champion_id: champ, tournament: _tFull(req.params.code) });
  }
  db.transaction(() => _tBuildRound(t, lastRound + 1, winners))();
  return ok(res, { message: 'Tour ' + (lastRound + 1) + ' généré', finished: false, tournament: _tFull(req.params.code) });
});

/* POST /tournament/match/:matchId/settle — résout un match d'après son jeu support (serveur fait foi) */
app.post('/tournament/match/:matchId/settle', requireAuth, (req, res) => {
  const matchId = Number(req.params.matchId);
  const m = db.prepare('SELECT * FROM tournament_matches WHERE id = ?').get(matchId);
  if (!m) return err(res, 404, 'Match introuvable');
  if (m.status === 'done') return ok(res, { message: 'Déjà résolu', winner_id: m.winner_id });
  if (!m.duel_code) return err(res, 400, 'Aucun jeu associé à ce match');
  const kg = db.prepare('SELECT * FROM kotm_games WHERE code = ?').get(m.duel_code);
  let winnerId = null;
  if (kg) {
    if (kg.status !== 'finished') return err(res, 400, 'Manche pas encore terminée');
    const sc = db.prepare('SELECT user_id, score, questions_won FROM kotm_scores WHERE game_id = ?').all(kg.id);
    const s1 = sc.find(x => x.user_id === m.player1_id) || { score: 0, questions_won: 0 };
    const s2 = sc.find(x => x.user_id === m.player2_id) || { score: 0, questions_won: 0 };
    if (s1.score !== s2.score) winnerId = s1.score > s2.score ? m.player1_id : m.player2_id;
    else if (s1.questions_won !== s2.questions_won) winnerId = s1.questions_won > s2.questions_won ? m.player1_id : m.player2_id;
    else winnerId = m.player1_id; // égalité parfaite → tête de série
  } else {
    const d = db.prepare('SELECT * FROM duels WHERE code = ?').get(m.duel_code);
    if (!d || d.status !== 'finished') return err(res, 400, 'Duel pas encore terminé');
    const ds = db.prepare('SELECT user_id, score FROM duel_scores WHERE duel_id = ?').all(d.id);
    const d1 = ds.find(x => x.user_id === m.player1_id) || { score: 0 };
    const d2 = ds.find(x => x.user_id === m.player2_id) || { score: 0 };
    winnerId = d1.score >= d2.score ? m.player1_id : m.player2_id;
  }
  db.prepare("UPDATE tournament_matches SET winner_id = ?, status = 'done' WHERE id = ?").run(winnerId, matchId);
  return ok(res, { message: 'Match résolu', winner_id: winnerId });
});

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
  // MODIFIÉ — un seul et même statut admin, vérifié de deux façons complémentaires :
  // 1) la colonne users.role = 'admin' (source de vérité, gérée via /admin/promote)
  // 2) la liste ADMIN_EMAILS (filet de sécurité si un JWT ne porte pas encore le rôle)
  if (!user) return false;
  if ((user.role || '').toLowerCase() === 'admin') return true;
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

/* POST /org/create — JWT requis. Le créateur devient admin de l'établissement.
   curl -X POST /org/create -H 'Authorization: Bearer JWT' -H 'Content-Type: application/json' -d '{"name":"ISM Dakar"}'
*/
app.post('/org/create', requireAuth, (req, res) => {
  const name = ((req.body && req.body.name) || '').trim();
  if (name.length < 2)   return err(res, 400, "Nom d'établissement requis (2 caractères min).");
  if (name.length > 120) return err(res, 400, 'Nom trop long (120 caractères max).');
  const info  = db.prepare('INSERT INTO organisations (name, admin_user_id) VALUES (?, ?)').run(name, req.user.id);
  const orgId = info.lastInsertRowid;
  // l'admin devient aussi membre (rôle admin) pour figurer dans les stats
  try {
    db.prepare("INSERT INTO org_members (org_id, user_id, role) VALUES (?, ?, 'admin')").run(orgId, req.user.id);
  } catch(e) { if (!String(e.message).includes('UNIQUE')) throw e; }
  return ok(res, { org: { id: orgId, name } });
});

/* POST /org/agence/set — JWT requis, membre déclare son agence/unité.
   curl -X POST /org/agence/set -d '{"org_id":1,"agence":"Agence Almadies"}'
*/
app.post('/org/agence/set', requireAuth, (req, res) => { // ORG-AGENCE AJOUT
  const orgId = Number((req.body || {}).org_id); // ORG-AGENCE AJOUT
  const agence = String((req.body || {}).agence || '').trim().slice(0, 80); // ORG-AGENCE AJOUT
  if (!orgId) return err(res, 400, 'org_id requis'); // ORG-AGENCE AJOUT
  const membre = db.prepare('SELECT id FROM org_members WHERE org_id = ? AND user_id = ?').get(orgId, req.user.id); // ORG-AGENCE AJOUT
  if (!membre) return err(res, 403, "Vous n'êtes pas membre de cet établissement"); // ORG-AGENCE AJOUT
  db.prepare('UPDATE org_members SET agence = ? WHERE org_id = ? AND user_id = ?').run(agence, orgId, req.user.id); // ORG-AGENCE AJOUT
  return ok(res, { agence }); // ORG-AGENCE AJOUT
}); // ORG-AGENCE AJOUT

/* GET /org/dashboard?org_id=xxx — JWT requis (admin de l'org).
   Membres + stats agrégées (parties, précision, dernière activité).
   curl -H 'Authorization: Bearer JWT' '/org/dashboard?org_id=1'
*/
app.get('/org/dashboard', requireAuth, (req, res) => {
  const orgId = Number(req.query.org_id);
  if (!orgId) return err(res, 400, 'org_id requis');
  const org = db.prepare('SELECT * FROM organisations WHERE id = ?').get(orgId);
  if (!org) return err(res, 404, 'Organisation introuvable');
  if (org.admin_user_id !== req.user.id) return err(res, 403, "Accès réservé à l'administrateur de l'établissement");

  const rows = db.prepare(
    'SELECT u.id, u.name, u.email, u.country, om.role, om.joined_at, om.agence, ' /* MODIFIÉ — ajout agence */ +
    'COUNT(s.id) AS games, COALESCE(SUM(s.score),0) AS score_sum, ' +
    'COALESCE(SUM(s.total),0) AS total_sum, MAX(s.played_at) AS last_played ' +
    'FROM org_members om JOIN users u ON u.id = om.user_id ' +
    'LEFT JOIN user_scores s ON s.user_id = u.id ' +
    'WHERE om.org_id = ? GROUP BY u.id ORDER BY games DESC, score_sum DESC'
  ).all(orgId);

  // certificats par membre (table certificates)
  const certRows = db.prepare(
    'SELECT c.user_id AS uid, COUNT(*) AS n FROM certificates c ' +
    'JOIN org_members om ON om.user_id = c.user_id ' +
    'WHERE om.org_id = ? GROUP BY c.user_id'
  ).all(orgId);
  const certBy = {}; certRows.forEach(function(r){ certBy[r.uid] = r.n; });

  function palier(pts){ return pts>=600?'Maître':pts>=250?'Expert':pts>=100?'Confirmé':'Initié'; }
  const NOW = Date.now();
  function dormant(last){ if(!last) return true; var t=Date.parse(String(last).replace(' ','T')); return isNaN(t)?false:(NOW-t)>21*864e5; }

  const members = rows.map(function(m){
    const acc = m.total_sum > 0 ? Math.round((m.score_sum / m.total_sum) * 100) : 0;
    return { id:m.id, name:m.name, email:m.email, country:m.country, role:m.role,
             joined_at:m.joined_at, agence: m.agence || '', games:m.games, accuracy:acc, score_sum:m.score_sum, /* MODIFIÉ — ajout agence */
             palier: palier(m.score_sum), certs: certBy[m.id] || 0,
             dormant: m.games>0 ? dormant(m.last_played) : false, last_played:m.last_played };
  });

  // ORG-AGENCE AJOUT — agrégat stats par agence/unité (membres sans agence déclarée groupés sous "Non renseigné")
  const byAgenceMap = {};
  members.forEach(function(m){
    const key = m.agence || 'Non renseigné';
    if (!byAgenceMap[key]) byAgenceMap[key] = { agence: key, members: 0, active: 0, games: 0, score_sum: 0, total_sum: 0 };
    const b = byAgenceMap[key];
    b.members++;
    if (m.games > 0) b.active++;
    b.games += m.games;
  });
  rows.forEach(function(m){
    const key = m.agence || 'Non renseigné';
    byAgenceMap[key].score_sum = (byAgenceMap[key].score_sum || 0) + m.score_sum;
    byAgenceMap[key].total_sum = (byAgenceMap[key].total_sum || 0) + m.total_sum;
  });
  const byAgence = Object.values(byAgenceMap).map(function(b){
    return { agence: b.agence, members: b.members, active: b.active, games: b.games,
             accuracy: b.total_sum > 0 ? Math.round(b.score_sum / b.total_sum * 100) : 0 };
  }).sort(function(a,b){ return b.games - a.games; });

  const active = members.filter(function(m){ return m.games > 0; });
  const paliers = { 'Initié':0, 'Confirmé':0, 'Expert':0, 'Maître':0 };
  active.forEach(function(m){ paliers[m.palier]++; });
  const accSum = active.reduce(function(a,m){ return a + m.accuracy; }, 0);
  const totals = {
    members: members.length,
    active:  active.length,
    games:   members.reduce(function(a,m){ return a + m.games; }, 0),
    certified: members.filter(function(m){ return m.certs > 0; }).length,
    certificates: members.reduce(function(a,m){ return a + m.certs; }, 0),
    activation_rate: members.length ? Math.round(active.length / members.length * 100) : 0,
    certification_rate: members.length ? Math.round(members.filter(function(m){return m.certs>0;}).length / members.length * 100) : 0,
    avg_accuracy: active.length ? Math.round(accSum / active.length) : 0,
    paliers: paliers,
  };

  // Matrice de compétence par domaine (pack_id) sur les membres de l'org
  const domains = db.prepare(
    'SELECT s.pack_id AS pack, COUNT(*) AS attempts, ' +
    'COALESCE(SUM(s.score),0) AS sc, COALESCE(SUM(s.total),0) AS tt ' +
    'FROM user_scores s JOIN org_members om ON om.user_id = s.user_id ' +
    "WHERE om.org_id = ? AND s.pack_id IS NOT NULL AND s.pack_id <> 'coumba' " +
    'GROUP BY s.pack_id ORDER BY attempts DESC'
  ).all(orgId).map(function(d){
    return { pack: d.pack, attempts: d.attempts, accuracy: d.tt>0 ? Math.round(d.sc/d.tt*100) : 0 };
  });

  return ok(res, { org: { id: org.id, name: org.name, created_at: org.created_at, join_code: org.join_code || null }, totals, members, domains, by_agence: byAgence }); /* MODIFIÉ — ajout by_agence */
});

/* Helper — génère un code collectif lisible unique : SLUG + 4 hex (ex. UCAO-7F3A) */
function _orgGenJoinCode(name){
  const slug = String(name || 'ORG').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'ORG';
  for (let i = 0; i < 12; i++) {
    const code = slug + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();
    const exists = db.prepare('SELECT id FROM organisations WHERE join_code = ?').get(code);
    if (!exists) return code;
  }
  return slug + '-' + crypto.randomUUID().slice(0, 8).toUpperCase();
}

/* POST /org/code — JWT requis (admin de l'org). Génère le code collectif (ou le régénère).
   curl -X POST /org/code -H 'Authorization: Bearer JWT' -H 'Content-Type: application/json' -d '{"org_id":1}'
   Body: { org_id, regenerate?:true }
*/
app.post('/org/code', requireAuth, (req, res) => {
  const orgId = Number((req.body && req.body.org_id) || 0);
  if (!orgId) return err(res, 400, 'org_id requis');
  const org = db.prepare('SELECT * FROM organisations WHERE id = ?').get(orgId);
  if (!org) return err(res, 404, 'Organisation introuvable');
  if (org.admin_user_id !== req.user.id) return err(res, 403, "Accès réservé à l'administrateur de l'établissement");
  let code = org.join_code;
  if (!code || (req.body && req.body.regenerate)) {
    code = _orgGenJoinCode(org.name);
    db.prepare('UPDATE organisations SET join_code = ? WHERE id = ?').run(code, orgId);
  }
  return ok(res, { code });
});

/* GET /org/code-info?code=XXX — public. Valide un code collectif (pour l'écran « Rejoindre »).
   curl '/org/code-info?code=UCAO-7F3A'
*/
app.get('/org/code-info', limiterLoose, (req, res) => {
  const code = String((req.query.code || '')).trim().toUpperCase();
  if (!code) return ok(res, { valid: false });
  const org = db.prepare('SELECT id, name FROM organisations WHERE join_code = ?').get(code);
  if (!org) return ok(res, { valid: false });
  return ok(res, { valid: true, org_name: org.name });
});

/* POST /org/join-code — JWT requis. Rejoint une org via son code collectif (réutilisable).
   curl -X POST /org/join-code -H 'Authorization: Bearer JWT' -H 'Content-Type: application/json' -d '{"code":"UCAO-7F3A"}'
*/
app.post('/org/join-code', requireAuth, (req, res) => {
  const code = String(((req.body && req.body.code) || '')).trim().toUpperCase();
  if (!code) return err(res, 400, 'code requis');
  const org = db.prepare('SELECT id, name FROM organisations WHERE join_code = ?').get(code);
  if (!org) return err(res, 400, 'Code établissement invalide.');
  try {
    db.prepare("INSERT INTO org_members (org_id, user_id, role) VALUES (?, ?, 'member')").run(org.id, req.user.id);
  } catch(e) {
    if (String(e.message).includes('UNIQUE')) return err(res, 409, 'Vous êtes déjà membre de cet établissement.');
    throw e;
  }
  return ok(res, { message: 'Vous avez rejoint ' + org.name + ' avec succès !', org_name: org.name, org_id: org.id }); /* MODIFIÉ — ajout org_id pour déclarer l'agence juste après */
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

// MODIFIÉ — route /setup-admin-x7k2 supprimée (sécurité : accès non authentifié → promotion admin possible par n'importe qui)
// AJOUT — POST /admin/promote : permet à un admin déjà en poste de promouvoir un autre
// utilisateur, sans passer par une console SQL. Le compte ciblé doit déjà exister
// (avoir un compte Regul Arena). Utilisation (depuis le mobile, via le panneau /admin/board
// ou un simple appel fetch) : coller le JWT admin, POST { "email": "kaiser@..." }
app.post('/admin/promote', requireAdmin, (req, res) => {
  const email = (req.body && req.body.email || '').trim().toLowerCase();
  if (!email) return err(res, 400, 'Email requis');
  const target = db.prepare('SELECT id, email, role FROM users WHERE LOWER(email) = ?').get(email);
  if (!target) return err(res, 404, "Aucun compte Regul Arena n'existe avec cet email. La personne doit d'abord s'inscrire.");
  db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(target.id);
  return ok(res, { message: `${target.email} est maintenant administrateur.`, id: target.id });
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

// MODIFIÉ — AJOUT : paliers d'expertise serveur (identiques au frontend raTier)
function raPalier(pts) {
  pts = Number(pts) || 0;
  if (pts >= 500) return { key: 'maitre',   label: 'Maître',   icon: '👑' };
  if (pts >= 250) return { key: 'expert',   label: 'Expert',   icon: '⭐' };
  if (pts >= 100) return { key: 'confirme', label: 'Confirmé', icon: '🔷' };
  return { key: 'initie', label: 'Initié', icon: '🔰' };
}

// MODIFIÉ — AJOUT : tableau de bord enrichi (activation, engagement, croissance)
app.get('/admin/insights', requireAdmin, (req, res) => {
  try {
    const one  = (sql) => db.prepare(sql).get();
    const many = (sql) => db.prepare(sql).all();

    // — Utilisateurs
    const totalUsers  = one(`SELECT COUNT(*) n FROM users`).n;
    const verifies    = one(`SELECT COUNT(*) n FROM users WHERE email_verified=1`).n;
    const nouveaux24h = one(`SELECT COUNT(*) n FROM users WHERE created_at >= datetime('now','-1 day')`).n;
    const nouveaux7j  = one(`SELECT COUNT(*) n FROM users WHERE created_at >= datetime('now','-7 days')`).n;
    const parPays     = many(`SELECT country, COUNT(*) n FROM users GROUP BY country ORDER BY n DESC LIMIT 10`);
    const parProfil   = many(`SELECT profile, COUNT(*) n FROM users GROUP BY profile ORDER BY n DESC`);

    // — Activation & engagement (user_scores = parties réellement jouées)
    const joueursActifs  = one(`SELECT COUNT(DISTINCT user_id) n FROM user_scores`).n;
    const actifs7j       = one(`SELECT COUNT(DISTINCT user_id) n FROM user_scores WHERE played_at >= datetime('now','-7 days')`).n;
    const actifs24h      = one(`SELECT COUNT(DISTINCT user_id) n FROM user_scores WHERE played_at >= datetime('now','-1 day')`).n;
    const partiesTotal   = one(`SELECT COUNT(*) n FROM user_scores`).n;
    const parties7j      = one(`SELECT COUNT(*) n FROM user_scores WHERE played_at >= datetime('now','-7 days')`).n;
    const tauxActivation = totalUsers ? Math.round(joueursActifs * 100 / totalUsers) : 0;

    // — Inscriptions par jour (30 derniers jours)
    const inscriptionsParJour = many(`
      SELECT date(created_at) jour, COUNT(*) n
      FROM users
      WHERE created_at >= datetime('now','-30 days')
      GROUP BY date(created_at) ORDER BY jour ASC`);

    // — Top joueurs (parties + score cumulé)
    const topJoueurs = many(`
      SELECT u.name, u.country,
             COUNT(s.id) parties,
             COALESCE(SUM(s.score),0) score_cumule
      FROM user_scores s JOIN users u ON u.id = s.user_id
      GROUP BY s.user_id ORDER BY parties DESC, score_cumule DESC LIMIT 10`);

    // — Packs les plus joués
    const parPack = many(`
      SELECT pack_id, COUNT(*) parties, COALESCE(SUM(score),0) score_cumule
      FROM user_scores GROUP BY pack_id ORDER BY parties DESC LIMIT 15`);

    // — Duels / tournois / certificats / messages
    const duelsTotal    = one(`SELECT COUNT(*) n FROM duels`).n;
    const duelsTermines = one(`SELECT COUNT(*) n FROM duels WHERE status='finished'`).n;
    const tournoisTotal = one(`SELECT COUNT(*) n FROM tournaments`).n;
    const tournoiPartic = one(`SELECT COUNT(*) n FROM tournament_participants`).n;
    const certifsTotal  = one(`SELECT COUNT(*) n FROM certificates`).n;
    const certifs7j     = one(`SELECT COUNT(*) n FROM certificates WHERE created_at >= datetime('now','-7 days')`).n;
    const certifsDetenteurs = one(`SELECT COUNT(DISTINCT user_id) n FROM certificates`).n; // MODIFIÉ
    const messagesTotal = one(`SELECT COUNT(*) n FROM messages`).n;

    // MODIFIÉ — AJOUT : top scoreurs (par points) + palier + nb de certificats détenus
    const topScoreursRaw = many(`
      SELECT u.id, u.name, u.country, u.profile,
             COUNT(s.id) parties,
             COALESCE(SUM(s.score),0) points,
             (SELECT COUNT(*) FROM certificates c WHERE c.user_id = u.id) certificats
      FROM users u LEFT JOIN user_scores s ON s.user_id = u.id
      WHERE u.email_verified = 1
      GROUP BY u.id HAVING points > 0
      ORDER BY points DESC, parties DESC LIMIT 20`);
    const topScoreurs = topScoreursRaw.map((r, i) => {
      const p = raPalier(r.points);
      return { rang: i + 1, name: r.name, country: r.country, profile: r.profile,
               points: r.points, parties: r.parties, palier: p.label, palier_icon: p.icon,
               palier_key: p.key, certificats: r.certificats, a_certificat: r.certificats > 0 };
    });
    const repartitionPaliers = { initie: 0, confirme: 0, expert: 0, maitre: 0 };
    topScoreurs.forEach(t => { repartitionPaliers[t.palier_key]++; });

    // MODIFIÉ — AJOUT : détail des certificats délivrés (qui a obtenu quoi)
    const certifsDetail = many(`
      SELECT c.cert_id, c.user_name, c.theme, c.zone, c.score, c.total, c.created_at
      FROM certificates c ORDER BY c.created_at DESC LIMIT 50`);

    // — Inscrits jamais actifs (à relancer par email)
    const inactifs = many(`
      SELECT u.name, u.email, u.country, u.created_at
      FROM users u
      LEFT JOIN user_scores s ON s.user_id = u.id
      WHERE s.id IS NULL
      ORDER BY u.created_at DESC LIMIT 50`);

    res.json({
      utilisateurs: { total: totalUsers, verifies, nouveaux_24h: nouveaux24h, nouveaux_7j: nouveaux7j, par_pays: parPays, par_profil: parProfil },
      activation:   { joueurs_actifs: joueursActifs, taux_pct: tauxActivation, inactifs: totalUsers - joueursActifs, actifs_7j: actifs7j, actifs_24h: actifs24h },
      parties:      { total: partiesTotal, sur_7j: parties7j },
      inscriptions_par_jour: inscriptionsParJour,
      top_joueurs:  topJoueurs,
      top_scoreurs: topScoreurs,                                  // MODIFIÉ
      repartition_paliers: repartitionPaliers,                    // MODIFIÉ
      par_pack:     parPack,
      duels:        { total: duelsTotal, termines: duelsTermines, taux_completion_pct: duelsTotal ? Math.round(duelsTermines * 100 / duelsTotal) : 0 },
      tournois:     { total: tournoisTotal, participants: tournoiPartic },
      certificats:  { total: certifsTotal, sur_7j: certifs7j, detenteurs: certifsDetenteurs, detail: certifsDetail }, // MODIFIÉ
      messages:     { total: messagesTotal },
      inactifs_a_relancer: inactifs,
      genere_le: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[admin/insights]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// MODIFIÉ — AJOUT : classement complet exploitant la table certificates
// Retourne pour chaque joueur : points, palier, parties, nb de certificats détenus
app.get('/admin/top-scorers', requireAdmin, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT u.id, u.name, u.email, u.country, u.profile, u.etablissement,
             COUNT(s.id) AS parties,
             COALESCE(SUM(s.score),0) AS points,
             (SELECT COUNT(*) FROM certificates c WHERE c.user_id = u.id) AS certificats
      FROM users u
      LEFT JOIN user_scores s ON s.user_id = u.id
      WHERE u.email_verified = 1
      GROUP BY u.id
      HAVING points > 0
      ORDER BY points DESC, parties DESC
      LIMIT 100
    `).all();
    const top = rows.map((r, i) => {
      const p = raPalier(r.points);
      return {
        rang: i + 1, id: r.id, name: r.name, email: r.email, country: r.country,
        profile: r.profile, etablissement: r.etablissement, parties: r.parties,
        points: r.points, palier: p.label, palier_icon: p.icon, palier_key: p.key,
        certificats: r.certificats, a_certificat: r.certificats > 0
      };
    });
    const repartition = { initie: 0, confirme: 0, expert: 0, maitre: 0 };
    top.forEach(t => { repartition[t.palier_key]++; });
    const avecCertif = top.filter(t => t.a_certificat).length;
    res.json({ total: top.length, avec_certificat: avecCertif, repartition, top_scoreurs: top, genere_le: new Date().toISOString() });
  } catch (e) {
    console.error('[admin/top-scorers]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// MODIFIÉ — AJOUT : GET /admin/roster — tableau RH complet (tous les utilisateurs,
// actifs ou non) avec points/parties/duels/certificats/statut de présence.
// Consommé par le frontend (admLoadRoster / admRenderRoster côté public/index.html).
app.get('/admin/roster', requireAdmin, (req, res) => {
  try {
    const limit = Math.min(5000, Math.max(1, Number(req.query.limit) || 500));
    const rows = db.prepare(`
      SELECT u.id, u.name, u.email, u.profile, u.country, u.etablissement,
             u.email_verified, u.role, u.created_at, u.last_seen,
             (SELECT COUNT(*) FROM user_scores s WHERE s.user_id = u.id) AS parties,
             (SELECT COALESCE(SUM(s2.score),0) FROM user_scores s2 WHERE s2.user_id = u.id) AS points,
             (SELECT COUNT(*) FROM duels d WHERE d.creator_id = u.id OR d.joiner_id = u.id) AS duels_total,
             (SELECT COUNT(*) FROM certificates c WHERE c.user_id = u.id) AS certificats
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT ?
    `).all(limit);

    const total = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;

    const roster = rows.map(r => {
      const p = raPalier(r.points);
      let actif = false;
      if (r.last_seen) {
        try {
          const ageSec = (Date.now() - new Date(String(r.last_seen).replace(' ', 'T') + 'Z').getTime()) / 1000;
          actif = ageSec >= 0 && ageSec < PRESENCE_WINDOW_S;
        } catch (_) {}
      }
      return {
        id: r.id, name: r.name, email: r.email, profile: r.profile,
        country: r.country, etablissement: r.etablissement,
        email_verified: r.email_verified, role: r.role,
        created_at: r.created_at, last_seen: r.last_seen,
        parties: r.parties, points: r.points, duels_total: r.duels_total,
        certificats: r.certificats, a_certificat: r.certificats > 0,
        palier: p.label, palier_icon: p.icon, palier_key: p.key,
        actif,
      };
    });

    return res.json({ success: true, roster, total });
  } catch (e) {
    console.error('[admin/roster]', e);
    return res.status(500).json({ success: false, error: 'Erreur serveur (roster)' });
  }
});

// MODIFIÉ — AJOUT : page HTML admin lisible sur mobile (coquille publique, données via token).
// Coller le JWT admin une fois ; il est conservé en local et envoyé en en-tête Authorization.
app.get('/admin/board', (req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>REGUL ARENA — Admin</title>
<style>
:root{--navy:#002B5C;--gold:#C9991A;--cream:#F5F3EE}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:var(--cream);color:var(--navy)}
header{background:linear-gradient(135deg,var(--navy),#001a3a);color:#fff;padding:18px 16px;position:sticky;top:0;z-index:5}
header b{color:var(--gold);letter-spacing:3px;font-size:13px}header h1{margin:4px 0 0;font-size:18px}
.wrap{padding:16px;max-width:760px;margin:0 auto}
.tokbox{display:flex;gap:8px;margin:14px 0}
.tokbox input{flex:1;padding:11px;border:1px solid #ccc;border-radius:8px;font-size:14px}
.tokbox button,.reload{background:var(--gold);color:#03050A;border:0;border-radius:8px;padding:11px 16px;font-weight:800;cursor:pointer}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:14px 0}
.kpi{background:#fff;border:1px solid rgba(201,153,26,.3);border-radius:12px;padding:14px}
.kpi .v{font-size:24px;font-weight:900;color:var(--navy)}.kpi .l{font-size:12px;color:#667}
h2{font-size:15px;border-left:4px solid var(--gold);padding-left:8px;margin:22px 0 10px}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;font-size:13px}
th,td{padding:9px 8px;text-align:left;border-bottom:1px solid #eee}th{background:#f3ede0;font-size:11px;text-transform:uppercase;color:#776}
.pill{display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;background:#eef;color:var(--navy);white-space:nowrap}
.cert{color:#1a7f37;font-weight:800}.nocert{color:#bbb}
.rep{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}.rep span{background:#fff;border:1px solid #e3d9c2;border-radius:20px;padding:5px 12px;font-size:13px;font-weight:700}
.muted{color:#778;font-size:12px}.err{color:#b91c1c;font-weight:700}
</style></head><body>
<header><b>REGUL ARENA</b><h1>Tableau de bord — Admin</h1></header>
<div class="wrap">
  <div class="tokbox">
    <input id="tok" type="password" placeholder="Coller le JWT admin…" autocomplete="off">
    <button id="go">Entrer</button>
  </div>
  <div id="msg" class="muted">Collez votre token admin pour charger les données.</div>
  <div id="content" style="display:none">
    <div class="kpis" id="kpis"></div>
    <h2>Répartition par palier</h2>
    <div class="rep" id="rep"></div>
    <h2>🏆 Top scoreurs · palier · certificat</h2>
    <table id="topt"><thead><tr><th>#</th><th>Joueur</th><th>Points</th><th>Palier</th><th>Cert.</th></tr></thead><tbody></tbody></table>
    <h2>📜 Certificats délivrés</h2>
    <table id="ct"><thead><tr><th>Bénéficiaire</th><th>Thème</th><th>Zone</th><th>Date</th></tr></thead><tbody></tbody></table>
    <p class="muted" style="margin-top:18px"><button class="reload" id="reload">↻ Rafraîchir</button></p>
    <h2>⭐ Promouvoir un administrateur</h2>
    <div class="tokbox">
      <input id="promEmail" type="email" placeholder="email@exemple.com" autocomplete="off">
      <button id="promBtn">Promouvoir</button>
    </div>
    <div id="promMsg" class="muted">La personne doit déjà avoir un compte Regul Arena (inscrite au moins une fois).</div>
  </div>
</div>
<script>
var KEY='ra_admin_token';
function tok(){return localStorage.getItem(KEY)||'';}
function H(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function pillP(p,icon){return '<span class="pill">'+icon+' '+H(p)+'</span>';}
async function api(path){
  var r=await fetch(path,{headers:{Authorization:'Bearer '+tok()}});
  if(!r.ok){throw new Error(r.status===401||r.status===403?'Token invalide ou non admin.':'Erreur '+r.status);}
  return r.json();
}
async function load(){
  var msg=document.getElementById('msg');
  if(!tok()){msg.textContent='Collez votre token admin pour charger les données.';return;}
  msg.textContent='Chargement…';msg.className='muted';
  try{
    var ins=await api('/admin/insights');
    var ts=await api('/admin/top-scorers');
    document.getElementById('content').style.display='block';
    document.getElementById('msg').style.display='none';
    var k=[
      ['Inscrits',ins.utilisateurs.total],['Vérifiés',ins.utilisateurs.verifies],
      ['Joueurs actifs',ins.activation.joueurs_actifs],['Taux activation',ins.activation.taux_pct+'%'],
      ['Parties jouées',ins.parties.total],['Certificats',ins.certificats.total],
      ['Détenteurs cert.',ins.certificats.detenteurs],['Scoreurs (7j)',ins.activation.actifs_7j]
    ];
    document.getElementById('kpis').innerHTML=k.map(function(x){return '<div class="kpi"><div class="v">'+x[1]+'</div><div class="l">'+x[0]+'</div></div>';}).join('');
    var rp=ts.repartition;
    document.getElementById('rep').innerHTML=
      '<span>🔰 Initié : '+rp.initie+'</span><span>🔷 Confirmé : '+rp.confirme+'</span>'+
      '<span>⭐ Expert : '+rp.expert+'</span><span>👑 Maître : '+rp.maitre+'</span>';
    document.querySelector('#topt tbody').innerHTML=ts.top_scoreurs.map(function(t){
      return '<tr><td>'+t.rang+'</td><td>'+H(t.name)+' <span class="muted">'+H(t.country||'')+'</span></td>'+
        '<td><b>'+t.points+'</b></td><td>'+pillP(t.palier,t.palier_icon)+'</td>'+
        '<td>'+(t.a_certificat?'<span class="cert">✓ '+t.certificats+'</span>':'<span class="nocert">—</span>')+'</td></tr>';
    }).join('')||'<tr><td colspan="5" class="muted">Aucun scoreur pour l\\'instant.</td></tr>';
    var cd=ins.certificats.detail||[];
    document.querySelector('#ct tbody').innerHTML=cd.map(function(c){
      return '<tr><td>'+H(c.user_name)+'</td><td>'+H(c.theme)+'</td><td>'+H(c.zone||'')+'</td><td>'+H((c.created_at||'').slice(0,10))+'</td></tr>';
    }).join('')||'<tr><td colspan="4" class="muted">Aucun certificat délivré.</td></tr>';
  }catch(e){
    document.getElementById('msg').style.display='block';
    document.getElementById('msg').className='err';
    document.getElementById('msg').textContent=e.message;
    document.getElementById('content').style.display='none';
  }
}
document.getElementById('go').onclick=function(){
  var v=document.getElementById('tok').value.trim();
  if(v){localStorage.setItem(KEY,v);document.getElementById('tok').value='';}
  load();
};
document.getElementById('reload').onclick=load;
document.getElementById('promBtn').onclick=async function(){
  var email=document.getElementById('promEmail').value.trim();
  var pm=document.getElementById('promMsg');
  if(!email){pm.textContent='Entrez un email.';pm.className='err';return;}
  if(!tok()){pm.textContent='Collez d\\'abord votre token admin tout en haut.';pm.className='err';return;}
  pm.textContent='Promotion en cours…';pm.className='muted';
  try{
    var r=await fetch('/admin/promote',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok()},body:JSON.stringify({email:email})});
    var d=await r.json();
    if(r.ok && d.message){ pm.textContent='✅ '+d.message; pm.className='muted'; document.getElementById('promEmail').value=''; }
    else { pm.textContent='❌ '+(d.error||'Erreur'); pm.className='err'; }
  }catch(e){ pm.textContent='❌ Erreur réseau.'; pm.className='err'; }
};
if(tok())load();
</script>
</body></html>`);
});

// MODIFIÉ — Module "L'Arène des Débats" : on passe requireAuth (et NON authMiddleware)
/* ════════════════════════════════════════════════════════════════
   MODE SPRINT / BLITZ — solo contre-la-montre, vitesse mesurée SERVEUR
   (AJOUT — 100% additif). Phase 1 du brainstorm "nouveaux modes".
   Principe anti-triche timing : le serveur horodate l'instant où il sert
   chaque question (served_at_ms) et calcule lui-même le temps de réponse
   à la réception. Le polling REST ne joue plus : chaque question est un
   aller-retour serveur, donc le chrono est équitable et non manipulable.
   Le score de vitesse n'inflle PAS le classement global : à la fin, on
   poste seulement correct_count dans user_scores (1 pt / bonne réponse,
   comme les autres modes) → alimente classement + paliers + Flash Info.
   Le score "vitesse" sert au classement Sprint dédié + au certificat.
================================================================ */
db.exec(`
  CREATE TABLE IF NOT EXISTS sprints (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    code           TEXT    NOT NULL UNIQUE,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    format         TEXT    NOT NULL DEFAULT 'pro',
    zone           TEXT    NOT NULL DEFAULT '',
    num_questions  INTEGER NOT NULL DEFAULT 15,
    questions_json TEXT    NOT NULL DEFAULT '[]',
    cur_index      INTEGER NOT NULL DEFAULT 0,
    served_at_ms   INTEGER,
    score          INTEGER NOT NULL DEFAULT 0,
    correct_count  INTEGER NOT NULL DEFAULT 0,
    total_ms       INTEGER NOT NULL DEFAULT 0,
    status         TEXT    NOT NULL DEFAULT 'active',
    created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
    finished_at    TEXT
  );
`);
try { db.exec('CREATE INDEX IF NOT EXISTS idx_sprints_user ON sprints (user_id, status)'); } catch(_) {}
try { db.exec('CREATE INDEX IF NOT EXISTS idx_sprints_board ON sprints (format, score DESC, total_ms ASC)'); } catch(_) {}

const SPRINT_FORMATS   = { eclair: 7, pro: 15, marathon: 21 }; // ⚡Éclair / 🎯Pro / 🏆Marathon
const SPRINT_BUDGET_MS = 20000;  // budget de 20 s par question (base du bonus de vitesse)
const SPRINT_FLOOR_MS  = 1000;   // plancher anti-bot : en-deçà, bonus plafonné (pas de score "0 ms")
const SPRINT_BASE_PTS  = 100;    // points d'une bonne réponse
const SPRINT_SPEED_MAX = 100;    // bonus de vitesse maximal (réponse quasi instantanée)

// Score serveur d'une réponse : 0 si faux ; sinon base + bonus de vitesse décroissant.
function sprintPoints(correct, elapsedMs) {
  if (!correct) return 0;
  const e = Math.max(SPRINT_FLOOR_MS, Math.min(SPRINT_BUDGET_MS, Number(elapsedMs) || SPRINT_BUDGET_MS));
  const frac = (SPRINT_BUDGET_MS - e) / (SPRINT_BUDGET_MS - SPRINT_FLOOR_MS); // 1 = rapide, 0 = lent
  return SPRINT_BASE_PTS + Math.round(SPRINT_SPEED_MAX * frac);
}

// POST /sprint/start — body { format, zone, questions:[{q,choices,correct,source}] }
// Le client envoie le pool figé (tiré dans QR/QB/QC/QN selon la zone). Le serveur
// nettoie, fige et NE RENVOIE JAMAIS le champ correct.
app.post('/sprint/start', requireAuth, (req, res) => {
  try {
    const { format, zone, questions } = req.body || {};
    const n = SPRINT_FORMATS[format];
    if (!n) return err(res, 400, 'Format invalide (eclair, pro ou marathon)');
    if (!Array.isArray(questions) || questions.length !== n) {
      return err(res, 400, `${n} questions attendues pour ce format`);
    }
    const clean = [];
    for (const raw of questions) {
      if (!raw || typeof raw.q !== 'string' || !Array.isArray(raw.choices)) {
        return err(res, 400, 'Question malformée');
      }
      const choices = raw.choices.map(c => String(c)).slice(0, 6);
      if (choices.length < 2) return err(res, 400, 'Choix insuffisants');
      const correct = Number(raw.correct);
      if (!Number.isInteger(correct) || correct < 0 || correct >= choices.length) {
        return err(res, 400, 'Indice de bonne réponse invalide');
      }
      clean.push({
        q:       String(raw.q).slice(0, 600),
        choices,
        correct,
        source:  String(raw.source || '').slice(0, 240),
      });
    }
    const code = 'S-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    db.prepare(`INSERT INTO sprints (code, user_id, format, zone, num_questions, questions_json, cur_index, status)
                VALUES (?,?,?,?,?,?,0,'active')`)
      .run(code, req.user.id, format, String(zone || '').slice(0, 12), n, JSON.stringify(clean));
    return ok(res, { code, total: n, format, budget_ms: SPRINT_BUDGET_MS });
  } catch (e) { return err(res, 500, 'Erreur serveur sprint (start)'); }
});

// GET /sprint/:code/question/:index — sert la question courante SANS la bonne réponse,
// et horodate l'instant exact où elle est servie (base du chrono serveur).
app.get('/sprint/:code/question/:index', requireAuth, (req, res) => {
  const s = db.prepare('SELECT * FROM sprints WHERE code = ?').get(req.params.code);
  if (!s) return err(res, 404, 'Sprint introuvable');
  if (s.user_id !== req.user.id) return err(res, 403, 'Accès refusé');
  if (s.status !== 'active') return err(res, 400, 'Sprint terminé');
  const idx = Number(req.params.index);
  if (idx !== s.cur_index) return err(res, 403, 'Question non débloquée'); // anti-prefetch
  let questions = [];
  try { questions = JSON.parse(s.questions_json || '[]'); } catch (_) {}
  const q = questions[idx];
  if (!q) return err(res, 500, 'Question introuvable');
  // N'arme le chrono qu'au PREMIER service de cette question (un re-fetch ne le
  // remet pas à zéro → impossible de gagner du bonus en rechargeant).
  if (s.served_at_ms == null) {
    db.prepare('UPDATE sprints SET served_at_ms = ? WHERE id = ?').run(Date.now(), s.id);
  }
  return ok(res, {
    question: { index: idx, q: q.q, choices: q.choices, source: q.source || '' },
    total: s.num_questions,
    budget_ms: SPRINT_BUDGET_MS,
  });
});

// POST /sprint/:code/answer — body { q_index, choice_index } (choice_index = -1 si temps écoulé)
// Le serveur calcule elapsed = now - served_at_ms, valide la réponse et fait foi.
app.post('/sprint/:code/answer', requireAuth, (req, res) => {
  try {
    const { q_index, choice_index } = req.body || {};
    const s = db.prepare('SELECT * FROM sprints WHERE code = ?').get(req.params.code);
    if (!s) return err(res, 404, 'Sprint introuvable');
    if (s.user_id !== req.user.id) return err(res, 403, 'Accès refusé');
    if (s.status !== 'active') return err(res, 400, 'Sprint terminé');
    if (Number(q_index) !== s.cur_index) return err(res, 400, 'Question hors séquence');
    if (s.served_at_ms == null) return err(res, 400, 'Question non servie');

    let questions = [];
    try { questions = JSON.parse(s.questions_json || '[]'); } catch (_) {}
    const q = questions[s.cur_index];
    if (!q) return err(res, 500, 'Question introuvable');

    const elapsed   = Math.max(0, Date.now() - Number(s.served_at_ms));
    const isCorrect = Number(choice_index) === Number(q.correct);
    const pts       = sprintPoints(isCorrect, elapsed);

    const newScore   = s.score + pts;
    const newCorrect = s.correct_count + (isCorrect ? 1 : 0);
    const newTotalMs = s.total_ms + Math.min(elapsed, SPRINT_BUDGET_MS);
    const newIndex   = s.cur_index + 1;
    const finished   = newIndex >= s.num_questions;

    const tx = db.transaction(() => {
      db.prepare(`UPDATE sprints SET score = ?, correct_count = ?, total_ms = ?, cur_index = ?,
                  served_at_ms = NULL, status = ?, finished_at = ? WHERE id = ?`)
        .run(newScore, newCorrect, newTotalMs, newIndex,
             finished ? 'finished' : 'active',
             finished ? new Date().toISOString() : null, s.id);
      // À la fin : on alimente le classement GLOBAL avec correct_count (1 pt/bonne
      // réponse), cohérent avec les autres modes — paliers & Flash Info suivent.
      if (finished) {
        db.prepare('INSERT INTO user_scores (user_id, pack_id, score, total) VALUES (?,?,?,?)')
          .run(req.user.id, 'sprint-' + s.format, newCorrect, s.num_questions);
      }
    });
    tx();

    return ok(res, {
      correct:       isCorrect,
      correct_index: q.correct,
      points_earned: pts,
      elapsed_ms:    elapsed,
      my_score:      newScore,
      correct_count: newCorrect,
      total_ms:      newTotalMs,
      cur_index:     newIndex,
      total:         s.num_questions,
      finished,
    });
  } catch (e) { return err(res, 500, 'Erreur serveur sprint (answer)'); }
});

// GET /sprint/leaderboard?format=pro — classement Sprint dédié (par score de vitesse,
// départage par temps total). Renvoie aussi mon meilleur run si token fourni.
app.get('/sprint/leaderboard', (req, res) => {
  try {
    const fmt = req.query.format;
    const where = ["s.status = 'finished'", 'u.email_verified = 1'];
    const params = [];
    if (fmt && SPRINT_FORMATS[fmt]) { where.push('s.format = ?'); params.push(fmt); }
    const rows = db.prepare(`
      SELECT s.score, s.correct_count, s.num_questions, s.total_ms, s.format,
             u.id AS user_id, u.name, u.country
      FROM sprints s JOIN users u ON u.id = s.user_id
      WHERE ${where.join(' AND ')}
      ORDER BY s.score DESC, s.total_ms ASC
      LIMIT 20
    `).all(...params);
    let myBest = null;
    const hdr = req.headers['authorization'] || '';
    const tok = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (tok) {
      try {
        const p = jwt.verify(tok, JWT_SECRET);
        const mw = ["status = 'finished'", 'user_id = ?']; const mp = [p.id];
        if (fmt && SPRINT_FORMATS[fmt]) { mw.push('format = ?'); mp.push(fmt); }
        myBest = db.prepare(`SELECT score, correct_count, num_questions, total_ms, format
                             FROM sprints WHERE ${mw.join(' AND ')}
                             ORDER BY score DESC, total_ms ASC LIMIT 1`).get(...mp) || null;
      } catch (_) {}
    }
    return ok(res, { leaderboard: rows, my_best: myBest });
  } catch (e) { return err(res, 500, 'Erreur serveur sprint (leaderboard)'); }
});
/* ════════════════ FIN MODE SPRINT / BLITZ ════════════════ */

/* ════════════════ MODE ROI DE LA MANCHE (King of the Hill 1v1) — ROI AJOUT ════════════════
   Tir à la corde réglementaire. Deux joueurs, une séquence figée de N questions.
   À chaque question, le PREMIER à répondre juste rafle la question et s'assoit
   (ou se maintient) sur le trône. Tenir le trône plusieurs questions d'affilée
   fait grimper un bonus de défense (effet boule de neige) ; voler le trône remet
   l'élan de l'adversaire à zéro. Vainqueur = meilleur score après N questions.

   Réutilise : l'horodatage SERVEUR du Sprint (served_at_ms, chrono équitable) +
   le verrou « premier juste » du Duel (cur_index partagé). AUCUNE boucle de fond :
   les fins de manche par temps écoulé ou double-erreur sont résolues paresseusement
   (lazy) au moment du /answer ou du /state. Le scoring fait foi côté serveur.
   ──────────────────────────────────────────────────────────────────────────── */
db.exec(`
  CREATE TABLE IF NOT EXISTS kotm_games (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    code           TEXT    NOT NULL UNIQUE,
    creator_id     INTEGER NOT NULL REFERENCES users(id),
    joiner_id      INTEGER REFERENCES users(id),
    pack_id        TEXT    NOT NULL DEFAULT 'general',
    num_questions  INTEGER NOT NULL DEFAULT 12,
    timer_sec      INTEGER NOT NULL DEFAULT 20,
    questions_json TEXT    NOT NULL DEFAULT '[]',
    cur_index      INTEGER NOT NULL DEFAULT 0,
    served_at_ms   INTEGER,
    king_id        INTEGER,
    king_streak    INTEGER NOT NULL DEFAULT 0,
    c_wrong        INTEGER NOT NULL DEFAULT 0,
    j_wrong        INTEGER NOT NULL DEFAULT 0,
    status         TEXT    NOT NULL DEFAULT 'waiting',
    started_at     TEXT,
    created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
    finished_at    TEXT
  );
  CREATE TABLE IF NOT EXISTS kotm_scores (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id       INTEGER NOT NULL REFERENCES kotm_games(id) ON DELETE CASCADE,
    user_id       INTEGER NOT NULL REFERENCES users(id),
    score         INTEGER NOT NULL DEFAULT 0,
    questions_won INTEGER NOT NULL DEFAULT 0,
    UNIQUE(game_id, user_id)
  );
`);
try { db.exec('CREATE INDEX IF NOT EXISTS idx_kotm_status ON kotm_games (status, created_at DESC)'); } catch(_){}
try { db.exec('ALTER TABLE kotm_games ADD COLUMN hidden_live INTEGER NOT NULL DEFAULT 0'); } catch(_){} // MODIFIÉ : visibilité Direct

const KOTM_WIN_PTS     = 100; // prise / maintien du trône (bonne réponse en 1er)
const KOTM_DEFEND_STEP = 30;  // bonus de défense par question déjà tenue (boule de neige)
const KOTM_SPEED_MAX   = 60;  // bonus de vitesse max (réponse quasi instantanée)
const KOTM_FLOOR_MS    = 800; // plancher anti-bot

function kotmSpeed(elapsedMs, budgetMs) {
  const e = Math.max(KOTM_FLOOR_MS, Math.min(budgetMs, Number(elapsedMs) || budgetMs));
  const frac = (budgetMs - e) / (budgetMs - KOTM_FLOOR_MS); // 1 = rapide, 0 = lent
  return Math.round(KOTM_SPEED_MAX * Math.max(0, frac));
}

function _kotmEnsureScore(gameId, userId) {
  let r = db.prepare('SELECT * FROM kotm_scores WHERE game_id=? AND user_id=?').get(gameId, userId);
  if (!r) {
    db.prepare('INSERT INTO kotm_scores (game_id, user_id) VALUES (?,?)').run(gameId, userId);
    r = db.prepare('SELECT * FROM kotm_scores WHERE game_id=? AND user_id=?').get(gameId, userId);
  }
  return r;
}

// Vue complète d'une partie (questions révélées seulement à la fin = feuille de match).
function _kotmFull(code) {
  const g = db.prepare('SELECT * FROM kotm_games WHERE code=?').get(code);
  if (!g) return null;
  const creator = db.prepare('SELECT id,name,country FROM users WHERE id=?').get(g.creator_id);
  const joiner  = g.joiner_id ? db.prepare('SELECT id,name,country FROM users WHERE id=?').get(g.joiner_id) : null;
  const scores  = db.prepare('SELECT user_id,score,questions_won FROM kotm_scores WHERE game_id=?').all(g.id);
  const reveal  = g.status === 'finished';
  const { questions_json, ...safe } = g;
  return { ...safe, questions_json: reveal ? questions_json : undefined, creator, joiner, scores };
}

// Finalise une partie : alimente le classement GLOBAL (paliers + Flash Info) avec
// les questions remportées par chaque joueur (1 pt / trône gagné). Idempotent par
// construction : appelé une seule fois, au moment exact où status passe à 'finished'.
function _kotmFinalize(gameId) {
  const g = db.prepare('SELECT * FROM kotm_games WHERE id=?').get(gameId);
  if (!g) return;
  const rows = db.prepare('SELECT user_id, questions_won FROM kotm_scores WHERE game_id=?').all(gameId);
  for (const r of rows) {
    db.prepare('INSERT INTO user_scores (user_id, pack_id, score, total) VALUES (?,?,?,?)')
      .run(r.user_id, 'kotm', r.questions_won, g.num_questions);
  }
}

// Avance l'index courant SANS changer le trône (manche neutre : temps écoulé ou
// les deux joueurs se sont trompés). Gère la transition de fin + finalisation.
function _kotmNeutralAdvance(g) {
  const newIndex = g.cur_index + 1;
  const finished = newIndex >= g.num_questions;
  db.prepare(`UPDATE kotm_games SET cur_index=?, served_at_ms=NULL, c_wrong=0, j_wrong=0,
              status=?, finished_at=? WHERE id=?`)
    .run(newIndex, finished ? 'finished' : g.status,
         finished ? new Date().toISOString() : g.finished_at, g.id);
  if (finished) _kotmFinalize(g.id);
  return newIndex;
}

// Résout paresseusement une question expirée (temps écoulé) en manche neutre.
// Retourne true si une avance a eu lieu. Handlers synchrones better-sqlite3 →
// pas de course possible : chaque requête s'exécute atomiquement.
function _kotmCheckTimeout(g) {
  if (g.status !== 'active') return false;
  if (g.served_at_ms == null) return false;
  if (Date.now() - Number(g.served_at_ms) <= g.timer_sec * 1000) return false;
  _kotmNeutralAdvance(g);
  return true;
}

// POST /kotm — crée une partie (body { pack_id, num_questions, timer_sec, target_user_id })
app.post('/kotm', requireAuth, (req, res) => {
  const { pack_id, num_questions = 12, timer_sec = 20, target_user_id } = req.body || {};
  let code;
  for (let i = 0; i < 10; i++) { code = genCode('K'); if (!db.prepare('SELECT id FROM kotm_games WHERE code=?').get(code)) break; }
  const nq = Math.min(21, Math.max(6, Number(num_questions) || 12));
  const ts = Math.min(40, Math.max(10, Number(timer_sec) || 20));
  db.prepare('INSERT INTO kotm_games (code, creator_id, pack_id, num_questions, timer_sec) VALUES (?,?,?,?,?)')
    .run(code, req.user.id, pack_id || 'general', nq, ts);
  const tid = target_user_id ? Number(target_user_id) : null;
  if (tid && tid !== req.user.id) {
    db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?,?,?)')
      .run(tid, 'kotm_challenge', `👑 ${req.user.name} vous défie au Roi de la Manche ! Code : ${code}`);
    sendPushToUser(tid, { title: '👑 Défi Roi de la Manche', body: `${req.user.name} veut vous voler le trône. Code : ${code}`, tag: 'kotm-' + code, url: '/?kotm=' + code });
  }
  notifyAllExcept(req.user.id, 'kotm_created', `👑 ${req.user.name} ouvre un Roi de la Manche ! Code : ${code}`);
  return ok(res, { code, game: _kotmFull(code) });
});

// GET /kotm/lobby — parties ouvertes (DOIT précéder /kotm/:code)
app.get('/kotm/lobby', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT g.code, g.num_questions, g.timer_sec, g.created_at,
                                  u.name AS creator_name, u.country
                           FROM kotm_games g JOIN users u ON u.id = g.creator_id
                           WHERE g.status='waiting' AND g.creator_id != ?
                           ORDER BY g.created_at DESC LIMIT 20`).all(req.user.id);
  return ok(res, { games: rows });
});

// GET /kotm/:code — état complet
app.get('/kotm/:code', requireAuth, (req, res) => {
  const g = _kotmFull(req.params.code);
  if (!g) return err(res, 404, 'Partie introuvable');
  return ok(res, { game: g });
});

// POST /kotm/:code/join — l'adversaire rejoint
app.post('/kotm/:code/join', requireAuth, (req, res) => {
  const g = db.prepare('SELECT * FROM kotm_games WHERE code=?').get(req.params.code);
  if (!g) return err(res, 404, 'Partie introuvable');
  if (g.creator_id === req.user.id) return ok(res, { message: 'Tu es le créateur', game: _kotmFull(req.params.code) });
  if (g.joiner_id === req.user.id) return ok(res, { message: 'Déjà dans la partie', game: _kotmFull(req.params.code) });
  if (g.joiner_id) return err(res, 400, 'Partie déjà pleine');
  if (g.status !== 'waiting') return err(res, 400, 'Partie déjà commencée');
  db.prepare('UPDATE kotm_games SET joiner_id=?, status=? WHERE code=?').run(req.user.id, 'joined', req.params.code);
  db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?,?,?)')
    .run(g.creator_id, 'kotm_joined', `👑 ${req.user.name} a rejoint votre Roi de la Manche (${req.params.code})`);
  sendPushToUser(g.creator_id, { title: '👑 Adversaire prêt', body: `${req.user.name} a rejoint. Lancez la manche !`, tag: 'kotm-' + req.params.code, url: '/?kotm=' + req.params.code });
  return ok(res, { message: 'Rejoint', game: _kotmFull(req.params.code) });
});

// POST /kotm/:code/start — le créateur lance : tire et FIGE les questions côté serveur
app.post('/kotm/:code/start', requireAuth, (req, res) => {
  const g = db.prepare('SELECT * FROM kotm_games WHERE code=?').get(req.params.code);
  if (!g) return err(res, 404, 'Partie introuvable');
  if (g.creator_id !== req.user.id) return err(res, 403, 'Seul le créateur peut lancer');
  if (!g.joiner_id) return err(res, 400, "Personne n'a encore rejoint");
  if (g.status === 'active') return ok(res, { message: 'Déjà active', game: _kotmFull(req.params.code) });
  const picked = pickQuestions(g.pack_id, g.num_questions);
  if (!picked || picked.length === 0) return err(res, 500, 'Pack introuvable ou vide côté serveur');
  const realN = picked.length;
  db.prepare(`UPDATE kotm_games SET status='active', questions_json=?, num_questions=?, started_at=?,
              cur_index=0, served_at_ms=NULL, king_id=NULL, king_streak=0, c_wrong=0, j_wrong=0 WHERE code=?`)
    .run(JSON.stringify(picked), realN, new Date().toISOString(), req.params.code);
  _kotmEnsureScore(g.id, g.creator_id);
  _kotmEnsureScore(g.id, g.joiner_id);
  return ok(res, { message: 'Manche lancée', game: _kotmFull(req.params.code) });
});

// GET /kotm/:code/question/:index — sert la question courante SANS la bonne réponse ;
// arme le chrono serveur au tout premier service (partagé par les deux joueurs).
app.get('/kotm/:code/question/:index', requireAuth, (req, res) => {
  let g = db.prepare('SELECT * FROM kotm_games WHERE code=?').get(req.params.code);
  if (!g) return err(res, 404, 'Partie introuvable');
  if (g.creator_id !== req.user.id && g.joiner_id !== req.user.id) return err(res, 403, 'Accès refusé');
  if (_kotmCheckTimeout(g)) g = db.prepare('SELECT * FROM kotm_games WHERE code=?').get(req.params.code);
  if (g.status !== 'active') return err(res, 400, 'Partie non active');
  const idx = Number(req.params.index);
  if (idx !== g.cur_index) return err(res, 403, 'Question non débloquée');
  let questions = []; try { questions = JSON.parse(g.questions_json || '[]'); } catch (_) {}
  const q = questions[idx];
  if (!q) return err(res, 500, 'Question introuvable');
  if (g.served_at_ms == null) db.prepare('UPDATE kotm_games SET served_at_ms=? WHERE id=?').run(Date.now(), g.id);
  return ok(res, {
    question: { index: idx, q: q.q, choices: q.choices, reference: q.source || q.reference || 'BCEAO/CIMA 2026' },
    total: g.num_questions, budget_ms: g.timer_sec * 1000,
  });
});

// POST /kotm/:code/answer — body { q_index, choice_index }. Le serveur fait foi :
// 1re bonne réponse rafle la question (prise/maintien du trône), double erreur ou
// temps écoulé = manche neutre.
app.post('/kotm/:code/answer', requireAuth, (req, res) => {
  try {
    const { q_index, choice_index } = req.body || {};
    if (q_index == null) return err(res, 400, 'q_index requis');
    const g = db.prepare('SELECT * FROM kotm_games WHERE code=?').get(req.params.code);
    if (!g) return err(res, 404, 'Partie introuvable');
    if (g.status !== 'active') return err(res, 400, 'Partie non active');
    const meId = req.user.id;
    const isCreator = g.creator_id === meId, isJoiner = g.joiner_id === meId;
    if (!isCreator && !isJoiner) return err(res, 403, 'Accès refusé');

    // Temps écoulé sur la question courante → manche neutre, on renvoie l'état.
    if (_kotmCheckTimeout(g)) {
      const gg = _kotmFull(req.params.code);
      return ok(res, { locked: true, timeout: true, correct: null, points_earned: 0, game: gg,
        cur_index: gg.cur_index, king_id: gg.king_id, king_streak: gg.king_streak, finished: gg.status === 'finished' });
    }
    // Question déjà résolue par l'adversaire (il a répondu juste avant moi).
    if (Number(q_index) < g.cur_index) {
      const gg = _kotmFull(req.params.code);
      return ok(res, { locked: true, correct: null, points_earned: 0, game: gg,
        cur_index: gg.cur_index, king_id: gg.king_id, king_streak: gg.king_streak, finished: gg.status === 'finished' });
    }
    if (Number(q_index) !== g.cur_index) return err(res, 400, 'Question hors séquence');
    if (g.served_at_ms == null) return err(res, 400, 'Question non servie');

    // Anti-2e-essai : si j'ai déjà répondu (faux) à CETTE question, je suis bloqué.
    if ((isCreator && g.c_wrong === 1) || (isJoiner && g.j_wrong === 1)) {
      const gg = _kotmFull(req.params.code);
      return ok(res, { already: true, correct: false, points_earned: 0, game: gg,
        cur_index: gg.cur_index, king_id: gg.king_id, king_streak: gg.king_streak, finished: gg.status === 'finished' });
    }

    let questions = []; try { questions = JSON.parse(g.questions_json || '[]'); } catch (_) {}
    const q = questions[g.cur_index];
    if (!q) return err(res, 500, 'Question introuvable');

    const elapsed = Math.max(0, Date.now() - Number(g.served_at_ms));
    const isCorrect = Number(choice_index) === Number(q.correct);

    if (isCorrect) {
      const wasKing = g.king_id === meId;
      const newStreak = wasKing ? g.king_streak + 1 : 1;
      const defendBonus = wasKing ? KOTM_DEFEND_STEP * g.king_streak : 0; // croît tant qu'on tient
      const speed = kotmSpeed(elapsed, g.timer_sec * 1000);
      const pts = KOTM_WIN_PTS + defendBonus + speed;
      const newIndex = g.cur_index + 1;
      const finished = newIndex >= g.num_questions;
      const sc = _kotmEnsureScore(g.id, meId);
      const tx = db.transaction(() => {
        db.prepare('UPDATE kotm_scores SET score=?, questions_won=? WHERE game_id=? AND user_id=?')
          .run(sc.score + pts, sc.questions_won + 1, g.id, meId);
        db.prepare(`UPDATE kotm_games SET king_id=?, king_streak=?, cur_index=?, served_at_ms=NULL,
                    c_wrong=0, j_wrong=0, status=?, finished_at=? WHERE id=?`)
          .run(meId, newStreak, newIndex, finished ? 'finished' : 'active',
               finished ? new Date().toISOString() : g.finished_at, g.id);
      });
      tx();
      if (finished) _kotmFinalize(g.id);
      const gg = _kotmFull(req.params.code);
      return ok(res, {
        correct: true, stole: !wasKing, defended: wasKing, points_earned: pts,
        speed_bonus: speed, defend_bonus: defendBonus, elapsed_ms: elapsed,
        king_id: meId, king_streak: newStreak, correct_index: q.correct,
        cur_index: newIndex, finished, game: gg,
      });
    } else {
      // Mauvaise réponse : on marque le fautif. Si les DEUX se trompent → manche neutre.
      const col = isCreator ? 'c_wrong' : 'j_wrong';
      db.prepare(`UPDATE kotm_games SET ${col}=1 WHERE id=?`).run(g.id);
      const g2 = db.prepare('SELECT * FROM kotm_games WHERE code=?').get(req.params.code);
      let neutral = false;
      if (g2.c_wrong === 1 && g2.j_wrong === 1) { _kotmNeutralAdvance(g2); neutral = true; }
      const gg = _kotmFull(req.params.code);
      return ok(res, {
        correct: false, points_earned: 0, correct_index: q.correct,
        neutral, both_wrong: neutral, king_id: gg.king_id, king_streak: gg.king_streak,
        cur_index: gg.cur_index, finished: gg.status === 'finished', game: gg,
      });
    }
  } catch (e) { return err(res, 500, 'Erreur serveur Roi de la Manche (answer)'); }
});

// GET /kotm/:code/state — poll temps réel (~1s) : trône, scores, chrono restant.
app.get('/kotm/:code/state', requireAuth, (req, res) => {
  let g = db.prepare('SELECT * FROM kotm_games WHERE code=?').get(req.params.code);
  if (!g) return err(res, 404, 'Partie introuvable');
  if (g.creator_id !== req.user.id && g.joiner_id !== req.user.id) return err(res, 403, 'Accès refusé');
  if (_kotmCheckTimeout(g)) g = db.prepare('SELECT * FROM kotm_games WHERE code=?').get(req.params.code);
  let q_elapsed_ms = null, q_remaining_ms = null;
  if (g.status === 'active' && g.served_at_ms != null) {
    q_elapsed_ms = Math.max(0, Date.now() - Number(g.served_at_ms));
    q_remaining_ms = Math.max(0, g.timer_sec * 1000 - q_elapsed_ms);
  }
  const meId = req.user.id;
  const iAnswered = g.status === 'active' &&
    ((g.creator_id === meId && g.c_wrong === 1) || (g.joiner_id === meId && g.j_wrong === 1));
  return ok(res, {
    game: _kotmFull(req.params.code), status: g.status, cur_index: g.cur_index,
    king_id: g.king_id, king_streak: g.king_streak,
    q_elapsed_ms, q_remaining_ms, i_answered_current: iAnswered,
  });
});
// GET /kotm/:code/watch — spectateur (lecture seule, tout utilisateur authentifié) : diffusion de la finale.
app.get('/kotm/:code/watch', requireAuth, (req, res) => {
  const g = db.prepare('SELECT * FROM kotm_games WHERE code = ?').get(req.params.code);
  if (!g) return err(res, 404, 'Manche introuvable');
  const creator = db.prepare('SELECT name, country FROM users WHERE id = ?').get(g.creator_id);
  const joiner = g.joiner_id ? db.prepare('SELECT name, country FROM users WHERE id = ?').get(g.joiner_id) : null;
  const scores = db.prepare('SELECT user_id, score, questions_won FROM kotm_scores WHERE game_id = ?').all(g.id);
  let q_remaining_ms = null, current_question = null;
  if (g.status === 'active' && g.served_at_ms != null) {
    q_remaining_ms = Math.max(0, g.timer_sec * 1000 - (Date.now() - Number(g.served_at_ms)));
    try { const qs = JSON.parse(g.questions_json || '[]'); const q = qs[g.cur_index];
      if (q) current_question = { index: g.cur_index, q: q.q, choices: q.choices }; } catch (_) {} // sans la bonne réponse
  }
  return ok(res, {
    status: g.status, code: g.code, cur_index: g.cur_index, total: g.num_questions,
    king_id: g.king_id, king_streak: g.king_streak,
    creator: { id: g.creator_id, name: creator ? creator.name : '', country: creator ? creator.country : '' },
    joiner: joiner ? { id: g.joiner_id, name: joiner.name, country: joiner.country } : null,
    scores, q_remaining_ms, current_question,
  });
});

/* ════════════════ FIN MODE ROI DE LA MANCHE ════════════════ */


/* MODIFIÉ — DIRECT : liste des duels et manches KOTM actuellement EN COURS,
   pour le mode spectateur. Lecture seule, tout utilisateur authentifié.
   Les questions ne sont PAS exposées ici (anti-triche) ; seul l'état public l'est. */
app.get('/live/now', requireAuth, (req, res) => {
  let duels = [], kotm = [];
  try {
    duels = db.prepare(
      `SELECT d.code, d.pack_id, d.num_questions, d.current_q_index,
              c.name AS creator_name, c.country AS creator_country,
              j.name AS joiner_name, j.country AS joiner_country
       FROM duels d
       JOIN users c ON c.id = d.creator_id
       LEFT JOIN users j ON j.id = d.joiner_id
       WHERE d.status = 'active' AND (d.hidden_live IS NULL OR d.hidden_live = 0)
       ORDER BY d.id DESC LIMIT 30`
    ).all();
  } catch (_) {}
  try {
    kotm = db.prepare(
      `SELECT g.code, g.num_questions, g.cur_index, g.king_streak,
              c.name AS creator_name, c.country AS creator_country,
              j.name AS joiner_name, j.country AS joiner_country
       FROM kotm_games g
       JOIN users c ON c.id = g.creator_id
       LEFT JOIN users j ON j.id = g.joiner_id
       WHERE g.status = 'active' AND (g.hidden_live IS NULL OR g.hidden_live = 0)
       ORDER BY g.created_at DESC LIMIT 30`
    ).all();
  } catch (_) {}
  return ok(res, { duels, kotm });
});

/* MODIFIÉ — VISIBILITÉ DIRECT : un participant peut masquer/afficher sa partie
   de la liste publique des directs (droit à la confidentialité). */
app.post('/duels/:code/live-visibility', requireAuth, (req, res) => {
  const d = db.prepare('SELECT id, creator_id, joiner_id FROM duels WHERE code = ?').get(req.params.code);
  if (!d) return err(res, 404, 'Duel introuvable');
  if (req.user.id !== d.creator_id && req.user.id !== d.joiner_id) return err(res, 403, 'Accès refusé');
  const hidden = (req.body && req.body.hidden) ? 1 : 0;
  try { db.prepare('UPDATE duels SET hidden_live = ? WHERE id = ?').run(hidden, d.id); } catch (_) {}
  return ok(res, { hidden });
});
app.post('/kotm/:code/live-visibility', requireAuth, (req, res) => {
  const g = db.prepare('SELECT id, creator_id, joiner_id FROM kotm_games WHERE code = ?').get(req.params.code);
  if (!g) return err(res, 404, 'Manche introuvable');
  if (req.user.id !== g.creator_id && req.user.id !== g.joiner_id) return err(res, 403, 'Accès refusé');
  const hidden = (req.body && req.body.hidden) ? 1 : 0;
  try { db.prepare('UPDATE kotm_games SET hidden_live = ? WHERE id = ?').run(hidden, g.id); } catch (_) {}
  return ok(res, { hidden });
});

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
      <a href="${url}" style="display:inline-block;background-color:#C9991A;background-image:linear-gradient(135deg,#C9991A,#E8B520);color:#03050A;font-size:14px;font-weight:800;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:2px">Confirmer mon compte &#8594;</a><!-- MODIFIÉ : fond doré solide de secours (bouton visible même sans dégradé, ex. Outlook) -->
    </div>
    <p style="color:#4a5568;font-size:12px;line-height:1.6;margin:0">Ce lien est valable 24 heures. Si tu n'es pas &#224; l'origine de cette demande, ignore cet email.</p>
  </td></tr>
  <tr><td style="border-top:1px solid rgba(255,255,255,.06);padding:20px 40px;text-align:center">
    <p style="color:#4a5568;font-size:11px;letter-spacing:1px;margin:0">&#169; 2026 REGUL ARENA &#183; Initiative priv&#233;e &#183; Abdou NDAO &#183; Dakar, S&#233;n&#233;gal</p>
  </td></tr>
</table></td></tr></table>
</body></html>`;
}

// MODIFIÉ — Email de bienvenue (inscription) : compte déjà actif, aucun lien à confirmer
function emailWelcomeHTML(name, url) {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bienvenue sur REGUL ARENA</title></head>
<body style="margin:0;padding:0;background:#03050A;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:48px 20px">
<table width="560" cellpadding="0" cellspacing="0" style="background:#080C14;border:1px solid rgba(201,153,26,.2);border-radius:4px;overflow:hidden">
  <tr><td style="background:linear-gradient(135deg,#002B5C,#001a3a);padding:32px 40px;text-align:center">
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:26px;font-weight:900;letter-spacing:6px;color:#C9991A">REGUL ARENA</div>
    <div style="font-size:11px;letter-spacing:3px;color:rgba(201,153,26,.6);margin-top:4px">MA&#206;TRISE R&#201;GLEMENTAIRE BANCAIRE</div>
  </td></tr>
  <tr><td style="padding:40px 40px 24px">
    <p style="color:#EEF0F5;font-size:16px;margin:0 0 12px">Bienvenue <strong style="color:#C9991A">${escEmail(name)}</strong>,</p>
    <p style="color:#7A8499;font-size:14px;line-height:1.7;margin:0 0 32px">Ton compte REGUL ARENA est <strong style="color:#EEF0F5">actif</strong>. Tu peux d&#232;s maintenant te connecter, relever des d&#233;fis et affronter d'autres professionnels de la banque dans l'ar&#232;ne r&#233;glementaire.</p>
    <div style="text-align:center;margin-bottom:32px">
      <a href="${url}" style="display:inline-block;background-color:#C9991A;background-image:linear-gradient(135deg,#C9991A,#E8B520);color:#03050A;font-size:14px;font-weight:800;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:2px">Acc&#233;der &#224; la plateforme &#8594;</a>
    </div>
    <p style="color:#4a5568;font-size:12px;line-height:1.6;margin:0">Si tu n'es pas &#224; l'origine de cette inscription, ignore simplement cet email.</p>
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
  // MODIFIÉ — le rôle renvoyé au frontend doit refléter le statut admin RÉEL (colonne role
  // OU présence dans ADMIN_EMAILS), sinon l'onglet Administration reste invisible pour un
  // compte ajouté seulement dans ADMIN_EMAILS (cas de Kaiser Ndao).
  return { id: u.id, name: u.name, email: u.email, profile: u.profile, country: u.country, etablissement: u.etablissement, role: isAdmin(u) ? 'admin' : (u.role || 'user') };
}


/* â”€â”€ START â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
app.listen(PORT, () => {
  console.log(`âœ… REGUL ARENA API â€” port ${PORT}`);
  console.log(`   DB : regularena.db`);
  console.log(`   JWT_SECRET : ✔ configuré`); // MODIFIÉ
  console.log(`   RESEND_KEY : ${RESEND_KEY ? 'âœ“ configur&#233;' : 'âš  manquant â€” emails d&#233;sactiv&#233;s'}`);
});
