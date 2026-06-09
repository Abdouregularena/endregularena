'use strict';

/**
 * REGUL ARENA — Module "L'Arène des Débats" (Questions Ouvertes)
 * Plateforme professionnelle UEMOA / CEMAC — regularena.com
 *
 * MONTAGE dans server.js (ajoute ces 2 lignes près de tes autres app.use) :
 *   const debats = require('./debats');                 // MODIFIÉ
 *   app.use('/api/debats', debats(db, authMiddleware)); // MODIFIÉ
 *
 *   - db             : ton instance better-sqlite3 déjà ouverte
 *   - authMiddleware : ton middleware JWT existant (celui qui remplit req.user)
 *
 * Les 3 tables se créent automatiquement au démarrage (CREATE IF NOT EXISTS).
 */

const express = require('express');

// ===================== CONFIG (à adapter) =====================
const ADMIN_EMAILS = ['abdou@regularena.com']; // INTÉGRATION: emails du jury / admin
const MAX_CONTENT = 2000;
const POINTS_BASE = 10;      // bonus de participation
const POINTS_JURY_MAX = 50;  // plafond si validé par le jury
// ==============================================================

module.exports = function (db, authMiddleware) {
  const router = express.Router();

  // ---- Schéma (idempotent) ----
  db.exec(`
    CREATE TABLE IF NOT EXISTS open_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Active',        -- Active | Closed | Archived
      start_date TEXT,
      end_date TEXT,
      points_reward INTEGER DEFAULT 50,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS open_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      author_name TEXT DEFAULT '',
      content TEXT NOT NULL,
      is_anonymous INTEGER DEFAULT 0,
      is_validated_by_jury INTEGER DEFAULT 0,
      is_hidden INTEGER DEFAULT 0,
      score_assigned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(question_id, user_id),
      FOREIGN KEY(question_id) REFERENCES open_questions(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS answer_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      answer_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      vote_type INTEGER NOT NULL,                   -- 1 = up, -1 = down
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(answer_id, user_id),
      FOREIGN KEY(answer_id) REFERENCES open_answers(id) ON DELETE CASCADE
    );
  `);

  // ---- Helpers ----
  const uid = (req) => String((req.user && (req.user.id || req.user.userId || req.user.email)) || '');
  const uname = (req) => String((req.user && (req.user.name || req.user.email)) || 'Membre');
  const isAdmin = (req) => {
    const e = req.user && req.user.email;
    return !!((req.user && (req.user.is_admin || req.user.role === 'admin')) || (e && ADMIN_EMAILS.includes(e)));
  };

  // INTÉGRATION: au lancement tous tes inscrits sont des pros -> true.
  // Plus tard (ouverture étudiants filtrée): return req.user.parcours === 'Professional';
  const peutParticiper = () => true;

  // Pseudonyme stable et anonyme dérivé de l'user_id (pour l'option "pseudonyme Regul Arena")
  const pseudo = (id) => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return 'Régulateur #' + (h % 9000 + 1000);
  };

  // INTÉGRATION LEADERBOARD: relie au système de points/classement global existant.
  const awardPoints = (userId, points) => {
    try {
      // ex: db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(points, userId);
      void userId; void points;
    } catch (e) { /* noop */ }
  };

  const adminGuard = (req, res, next) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Accès réservé au jury / administration' });
    next();
  };

  router.use(authMiddleware);

  // ============================ UTILISATEUR ============================

  // Liste des débats (En cours par défaut)
  router.get('/questions', (req, res) => {
    const status = req.query.status || 'Active';
    const rows = db.prepare(`
      SELECT q.*,
        (SELECT COUNT(*) FROM open_answers a WHERE a.question_id = q.id AND a.is_hidden = 0) AS answer_count
      FROM open_questions q
      WHERE q.status = ?
      ORDER BY q.created_at DESC
    `).all(status);
    res.json(rows);
  });

  // Détail d'un débat + flux des réponses (triées : validées d'abord, puis votes net)
  router.get('/questions/:id', (req, res) => {
    const q = db.prepare('SELECT * FROM open_questions WHERE id = ?').get(req.params.id);
    if (!q) return res.status(404).json({ error: 'Débat introuvable' });
    const me = uid(req);
    const rows = db.prepare(`
      SELECT a.id, a.user_id, a.author_name, a.content, a.is_anonymous,
             a.is_validated_by_jury, a.score_assigned, a.created_at,
             COALESCE(SUM(CASE WHEN v.vote_type=1 THEN 1 ELSE 0 END),0)  AS upvotes,
             COALESCE(SUM(CASE WHEN v.vote_type=-1 THEN 1 ELSE 0 END),0) AS downvotes,
             (SELECT vote_type FROM answer_votes WHERE answer_id=a.id AND user_id=?) AS my_vote
      FROM open_answers a
      LEFT JOIN answer_votes v ON v.answer_id = a.id
      WHERE a.question_id = ? AND a.is_hidden = 0
      GROUP BY a.id
      ORDER BY a.is_validated_by_jury DESC, (upvotes - downvotes) DESC, a.created_at ASC
    `).all(me, q.id);

    const answers = rows.map(a => ({
      id: a.id,
      author: a.is_anonymous ? pseudo(a.user_id) : (a.author_name || 'Membre'),
      is_anonymous: !!a.is_anonymous,
      content: a.content,
      upvotes: a.upvotes,
      downvotes: a.downvotes,
      net: a.upvotes - a.downvotes,
      my_vote: a.my_vote || 0,
      is_validated_by_jury: !!a.is_validated_by_jury,
      score_assigned: a.score_assigned,
      is_mine: a.user_id === me,
      created_at: a.created_at
    }));
    const mine = db.prepare('SELECT id FROM open_answers WHERE question_id=? AND user_id=?').get(q.id, me);
    res.json({ question: q, answers, has_answered: !!mine });
  });

  // Soumettre une réponse (1 seule par utilisateur et par débat)
  router.post('/questions/:id/answers', (req, res) => {
    if (!peutParticiper(req)) return res.status(403).json({ error: 'Réservé aux professionnels du secteur' });
    const q = db.prepare('SELECT * FROM open_questions WHERE id = ?').get(req.params.id);
    if (!q) return res.status(404).json({ error: 'Débat introuvable' });
    if (q.status !== 'Active') return res.status(400).json({ error: 'Ce débat est clôturé' });

    let content = ((req.body && req.body.content) || '').toString().trim();
    if (!content) return res.status(400).json({ error: 'Réponse vide' });
    if (content.length > MAX_CONTENT) content = content.slice(0, MAX_CONTENT);
    const isAnon = (req.body && req.body.is_anonymous) ? 1 : 0;

    try {
      db.prepare(`INSERT INTO open_answers (question_id, user_id, author_name, content, is_anonymous)
                  VALUES (?,?,?,?,?)`).run(q.id, uid(req), uname(req), content, isAnon);
      awardPoints(uid(req), POINTS_BASE);
      res.json({ ok: true, points: POINTS_BASE });
    } catch (e) {
      if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'Vous avez déjà participé à ce débat' });
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // Voter (vote_type: 1 = up, -1 = down, 0 = retirer)
  router.post('/answers/:id/vote', (req, res) => {
    const a = db.prepare('SELECT * FROM open_answers WHERE id = ?').get(req.params.id);
    if (!a) return res.status(404).json({ error: 'Réponse introuvable' });
    if (a.user_id === uid(req)) return res.status(400).json({ error: 'Impossible de voter pour sa propre réponse' });

    const vt = parseInt((req.body && req.body.vote_type), 10);
    if (vt === 0) {
      db.prepare('DELETE FROM answer_votes WHERE answer_id=? AND user_id=?').run(a.id, uid(req));
      return res.json({ ok: true });
    }
    if (vt !== 1 && vt !== -1) return res.status(400).json({ error: 'Vote invalide' });
    db.prepare(`INSERT INTO answer_votes (answer_id, user_id, vote_type) VALUES (?,?,?)
                ON CONFLICT(answer_id, user_id) DO UPDATE SET vote_type = excluded.vote_type`)
      .run(a.id, uid(req), vt);
    res.json({ ok: true });
  });

  // ========================= ADMIN / JURY =========================

  router.get('/admin/questions', adminGuard, (req, res) => {
    res.json(db.prepare('SELECT * FROM open_questions ORDER BY created_at DESC').all());
  });

  router.post('/admin/questions', adminGuard, (req, res) => {
    const b = req.body || {};
    if (!b.title) return res.status(400).json({ error: 'Titre requis' });
    const r = db.prepare(`INSERT INTO open_questions (title, description, status, start_date, end_date, points_reward)
                          VALUES (?,?,?,?,?,?)`)
      .run(b.title, b.description || '', b.status || 'Active', b.start_date || null, b.end_date || null,
           Number.isInteger(b.points_reward) ? b.points_reward : POINTS_JURY_MAX);
    res.json({ ok: true, id: r.lastInsertRowid });
  });

  router.put('/admin/questions/:id', adminGuard, (req, res) => {
    const b = req.body || {};
    const q = db.prepare('SELECT * FROM open_questions WHERE id=?').get(req.params.id);
    if (!q) return res.status(404).json({ error: 'Introuvable' });
    db.prepare(`UPDATE open_questions
                SET title=?, description=?, status=?, start_date=?, end_date=?, points_reward=? WHERE id=?`)
      .run(b.title != null ? b.title : q.title,
           b.description != null ? b.description : q.description,
           b.status != null ? b.status : q.status,
           b.start_date != null ? b.start_date : q.start_date,
           b.end_date != null ? b.end_date : q.end_date,
           Number.isInteger(b.points_reward) ? b.points_reward : q.points_reward, q.id);
    res.json({ ok: true });
  });

  router.delete('/admin/questions/:id', adminGuard, (req, res) => {
    db.prepare('DELETE FROM open_questions WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  });

  // Toutes les réponses d'un débat — identité réelle visible pour la modération
  router.get('/admin/questions/:id/answers', adminGuard, (req, res) => {
    const rows = db.prepare(`
      SELECT a.*,
        COALESCE(SUM(CASE WHEN v.vote_type=1 THEN 1 ELSE 0 END),0)  AS upvotes,
        COALESCE(SUM(CASE WHEN v.vote_type=-1 THEN 1 ELSE 0 END),0) AS downvotes
      FROM open_answers a LEFT JOIN answer_votes v ON v.answer_id = a.id
      WHERE a.question_id = ? GROUP BY a.id
      ORDER BY a.created_at ASC
    `).all(req.params.id);
    res.json(rows);
  });

  // Valider + noter (épingle la réponse, badge jury, attribue le score)
  router.post('/admin/answers/:id/validate', adminGuard, (req, res) => {
    const a = db.prepare('SELECT * FROM open_answers WHERE id=?').get(req.params.id);
    if (!a) return res.status(404).json({ error: 'Introuvable' });
    const sc = parseInt((req.body && req.body.score), 10);
    const score = Number.isInteger(sc) ? sc : POINTS_JURY_MAX;
    db.prepare('UPDATE open_answers SET is_validated_by_jury=1, is_hidden=0, score_assigned=? WHERE id=?').run(score, a.id);
    awardPoints(a.user_id, score);
    res.json({ ok: true, score });
  });

  // Rejeter (masque la réponse — anti-spam / hors-sujet)
  router.post('/admin/answers/:id/reject', adminGuard, (req, res) => {
    db.prepare('UPDATE open_answers SET is_hidden=1, is_validated_by_jury=0 WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  });

  return router;
};
