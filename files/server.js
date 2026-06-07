/* ============================================================
   server.js — Moteur RegulArena (Node.js) pour Railway
   ------------------------------------------------------------
   Rôle :
     1) Sert le site (le dossier "public", ou la racine si pas de "public").
     2) Fournit le salon de la communauté :
          GET  /api/salon/messages?zone=...&since_id=...
          POST /api/salon/send   { zone, name, message }
   Base de données : PostgreSQL fourni par Railway (variable DATABASE_URL).
   La table se crée toute seule au démarrage : rien à faire à la main.
   ============================================================ */

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '64kb' }));

const PORT = process.env.PORT || 3000;
const ZONES = ['general', 'uemoa', 'cemac'];

/* ---- Connexion à PostgreSQL (Railway fournit DATABASE_URL) ---- */
const needSsl = /sslmode=require/.test(process.env.DATABASE_URL || '')
             || process.env.PGSSLMODE === 'require';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: needSsl ? { rejectUnauthorized: false } : false,
});

/* ---- Création automatique de la table au démarrage ---- */
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS salon_messages (
      id          SERIAL PRIMARY KEY,
      zone        TEXT NOT NULL,
      author_name TEXT NOT NULL,
      body        TEXT NOT NULL,
      ip_hash     TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_salon_zone_id ON salon_messages (zone, id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_salon_ip_time ON salon_messages (ip_hash, created_at);`);
}

function ipHash(req) {
  const ip = (req.ip || '').toString();
  return ip ? crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32) : '';
}

/* ---- Lire les messages d'une zone ---- */
app.get('/api/salon/messages', async (req, res) => {
  try {
    let zone = (req.query.zone || 'general').toString();
    if (!ZONES.includes(zone)) zone = 'general';
    const sinceId = parseInt(req.query.since_id, 10) || 0;

    let rows;
    if (sinceId > 0) {
      const q = await pool.query(
        `SELECT id, author_name, body, EXTRACT(EPOCH FROM created_at)::int AS ts
           FROM salon_messages
          WHERE zone = $1 AND id > $2
          ORDER BY id ASC
          LIMIT 200`,
        [zone, sinceId]
      );
      rows = q.rows;
    } else {
      const q = await pool.query(
        `SELECT id, author_name, body, ts FROM (
            SELECT id, author_name, body, EXTRACT(EPOCH FROM created_at)::int AS ts
              FROM salon_messages
             WHERE zone = $1
             ORDER BY id DESC
             LIMIT 60
         ) sub ORDER BY id ASC`,
        [zone]
      );
      rows = q.rows;
    }
    res.json({ ok: true, zone, messages: rows });
  } catch (e) {
    console.error('salon/messages', e.message);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
});

/* ---- Envoyer un message ---- */
app.post('/api/salon/send', async (req, res) => {
  try {
    const data = req.body || {};
    let zone = (data.zone || 'general').toString();
    if (!ZONES.includes(zone)) zone = 'general';

    let name = (data.name || '').toString().replace(/[\u0000-\u001F\u007F]/g, '').trim();
    let body = (data.message || '').toString().replace(/[\u0000-\u001F\u007F]/g, ' ').trim();

    if (!name) name = 'Anonyme';
    name = name.slice(0, 40);
    body = body.slice(0, 500);
    if (!body) return res.status(400).json({ ok: false, error: 'empty' });

    const iph = ipHash(req);

    // anti-spam léger : 1 message / 2 s par appareil
    if (iph) {
      const chk = await pool.query(
        `SELECT 1 FROM salon_messages
          WHERE ip_hash = $1 AND created_at > now() - interval '2 seconds' LIMIT 1`,
        [iph]
      );
      if (chk.rowCount > 0) return res.status(429).json({ ok: false, error: 'rate' });
    }

    const ins = await pool.query(
      `INSERT INTO salon_messages (zone, author_name, body, ip_hash)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [zone, name, body, iph]
    );
    res.json({ ok: true, id: ins.rows[0].id });
  } catch (e) {
    console.error('salon/send', e.message);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
});

/* ---- Petite route de test (vérifier que le serveur tourne) ---- */
app.get('/api/health', (req, res) => res.json({ ok: true }));

/* ---- Servir le site (public/ s'il existe, sinon la racine) ---- */
const PUBLIC_DIR = fs.existsSync(path.join(__dirname, 'public'))
  ? path.join(__dirname, 'public')
  : __dirname;
app.use(express.static(PUBLIC_DIR));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

/* ---- Démarrage ---- */
initDb()
  .then(() => {
    app.listen(PORT, () => console.log('RegulArena en écoute sur le port ' + PORT));
  })
  .catch((e) => {
    console.error('Erreur init base de données :', e.message);
    // On démarre quand même le serveur pour servir le site,
    // mais le salon renverra une erreur tant que la base n'est pas connectée.
    app.listen(PORT, () => console.log('Serveur démarré (base de données non connectée) port ' + PORT));
  });
