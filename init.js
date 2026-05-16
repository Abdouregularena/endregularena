'use strict';
// ============================================================
//  REGUL ARENA — Initialisation base de données SQLite
//  Lancer une fois : node db/init.js
// ============================================================
require('dotenv').config();
const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const dbPath = process.env.DB_PATH || './db/regularena.db';
const dbDir  = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  -- ── TABLE USERS ──────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    profile     TEXT    NOT NULL DEFAULT 'professionnel',
    country     TEXT    NOT NULL DEFAULT 'SN',
    verified    INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    last_login  TEXT
  );

  -- ── TABLE EMAIL_TOKENS ────────────────────────────────────
  -- Stocke les tokens de confirmation/réenvoi (UUID signé)
  CREATE TABLE IF NOT EXISTS email_tokens (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT    NOT NULL UNIQUE,
    type        TEXT    NOT NULL DEFAULT 'verify',   -- 'verify' | 'login'
    expires_at  TEXT    NOT NULL,
    used        INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- ── TABLE FEEDBACK ────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS feedback (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT,
    email       TEXT,
    type        TEXT    NOT NULL DEFAULT 'suggestion',
    stars       INTEGER NOT NULL DEFAULT 5,
    message     TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- ── TABLE NOTIFY_LIST ─────────────────────────────────────
  -- Inscriptions au tournoi inter-pays 2027
  CREATE TABLE IF NOT EXISTS notify_list (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- ── INDEX ─────────────────────────────────────────────────
  CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
  CREATE INDEX IF NOT EXISTS idx_tokens_token   ON email_tokens(token);
  CREATE INDEX IF NOT EXISTS idx_tokens_user    ON email_tokens(user_id);
`);

console.log('✅  Base de données initialisée :', dbPath);
db.close();
