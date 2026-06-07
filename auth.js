'use strict';
const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const db      = require('../db/database');
const { createToken, verifyToken, consumeToken } = require('../utils/token');
const { validateInstitutionalEmail, validateName, validateProfile, validateCountry } = require('../utils/validator');
const { sendVerificationEmail, sendLoginEmail } = require('../emails/sender');
const { authLimiter, resendLimiter } = require('../middleware/rateLimit');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_production';

// ── Helpers ───────────────────────────────────────────────
function issueJWT(user) {
  return jwt.sign(
{ sub: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function jsonError(res, status, message, code = 'ERROR') {
  return res.status(status).json({ ok: false, error: message, code });
}

// ═══════════════════════════════════════════════════════════
// POST /api/auth/register
// Corps : { name, email, profile, country }
// Crée ou réutilise un compte non vérifié, envoie l'email
// ═══════════════════════════════════════════════════════════
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, profile, country } = req.body;

    // ── Validation ────────────────────────────────────────
    const vName    = validateName(name);
    const vEmail   = validateInstitutionalEmail(email);
    const vProfile = validateProfile(profile);
    const vCountry = validateCountry(country);

    if (!vName.ok)    return jsonError(res, 400, vName.reason,    'INVALID_NAME');
    if (!vEmail.ok)   return jsonError(res, 400, vEmail.reason,   'INVALID_EMAIL');
    if (!vProfile.ok) return jsonError(res, 400, vProfile.reason, 'INVALID_PROFILE');
    if (!vCountry.ok) return jsonError(res, 400, vCountry.reason, 'INVALID_COUNTRY');

    const cleanEmail = email.trim().toLowerCase();
    const cleanName  = name.trim();

    // ── Vérifier si email déjà existant ───────────────────
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (user && user.verified) {
      // Compte déjà actif → proposer le login
      return jsonError(res, 409,
        'Cet email est déjà inscrit. Utilisez "Se connecter" pour recevoir un lien magique.',
        'ALREADY_REGISTERED'
      );
    }

    // ── Créer ou mettre à jour l'utilisateur ──────────────
    if (!user) {
      const result = db.prepare(`
        INSERT INTO users (name, email, profile, country)
        VALUES (?, ?, ?, ?)
      `).run(cleanName, cleanEmail, profile, country);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    } else {
      // Mise à jour si données changées
      db.prepare(`
        UPDATE users SET name=?, profile=?, country=? WHERE id=?
      `).run(cleanName, profile, country, user.id);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    }

    // ── Générer token et envoyer email ────────────────────
    const token = createToken(user.id, 'verify');
    await sendVerificationEmail({ name: cleanName, email: cleanEmail, token });

    return res.json({
      ok: true,
      message: `Email de confirmation envoyé à ${cleanEmail}. Vérifiez votre boîte de réception.`,
    });

  } catch (err) {
    console.error('[/auth/register]', err);
    return jsonError(res, 500, 'Erreur serveur. Réessayez dans quelques instants.', 'SERVER_ERROR');
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/auth/verify?token=XXX
// Confirme l'email, retourne un JWT
// ═══════════════════════════════════════════════════════════
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return jsonError(res, 400, 'Token manquant', 'MISSING_TOKEN');

    const check = verifyToken(token);
    if (!check.valid) {
      const msg = check.reason === 'token_expired'
        ? 'Ce lien a expiré. Demandez un nouveau lien depuis la page d\'inscription.'
        : 'Lien invalide ou déjà utilisé.';
      return jsonError(res, 400, msg, check.reason.toUpperCase());
    }

    // Marquer comme vérifié
    consumeToken(token);
    db.prepare(`
      UPDATE users SET verified=1, last_login=datetime('now') WHERE id=?
    `).run(check.user_id);

    const user = db.prepare('SELECT * FROM users WHERE id=?').get(check.user_id);
    const jwt_token = issueJWT(user);

    return res.json({
      ok:    true,
      token: jwt_token,
      user: {
        id:      user.id,
        name:    user.name,
        email:   user.email,
        profile: user.profile,
        country: user.country,
      },
    });

  } catch (err) {
    console.error('[/auth/verify]', err);
    return jsonError(res, 500, 'Erreur serveur.', 'SERVER_ERROR');
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/auth/login
// Corps : { email }
// Magic link — envoie un lien de connexion sans mot de passe
// ═══════════════════════════════════════════════════════════
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const vEmail = validateInstitutionalEmail(email);
    if (!vEmail.ok) return jsonError(res, 400, vEmail.reason, 'INVALID_EMAIL');

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email=? AND verified=1').get(cleanEmail);

    // Toujours répondre la même chose (anti-enumération)
    if (!user) {
      return res.json({
        ok: true,
        message: 'Si cet email est inscrit, vous recevrez un lien de connexion.',
      });
    }

    const token = createToken(user.id, 'login');
    await sendLoginEmail({ name: user.name, email: cleanEmail, token });

    return res.json({
      ok: true,
      message: 'Lien de connexion envoyé. Vérifiez votre boîte de réception.',
    });

  } catch (err) {
    console.error('[/auth/login]', err);
    return jsonError(res, 500, 'Erreur serveur.', 'SERVER_ERROR');
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/auth/login-verify?login_token=XXX
// Authentifie via magic link, retourne JWT
// ═══════════════════════════════════════════════════════════
router.get('/login-verify', async (req, res) => {
  try {
    const { login_token } = req.query;
    if (!login_token) return jsonError(res, 400, 'Token manquant', 'MISSING_TOKEN');

    const check = verifyToken(login_token);
    if (!check.valid || check.type !== 'login') {
      const msg = check.reason === 'token_expired'
        ? 'Ce lien de connexion a expiré (15 min). Demandez-en un nouveau.'
        : 'Lien invalide ou déjà utilisé.';
      return jsonError(res, 400, msg, 'INVALID_LOGIN_TOKEN');
    }

    consumeToken(login_token);
    db.prepare(`UPDATE users SET last_login=datetime('now') WHERE id=?`).run(check.user_id);

    const user      = db.prepare('SELECT * FROM users WHERE id=?').get(check.user_id);
    const jwt_token = issueJWT(user);

return res.redirect(`${process.env.BASE_URL}/?login_token=${jwt_token}`);

  } catch (err) {
    console.error('[/auth/login-verify]', err);
    return jsonError(res, 500, 'Erreur serveur.', 'SERVER_ERROR');
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/auth/resend
// Corps : { email }
// Renvoi email de confirmation
// ═══════════════════════════════════════════════════════════
router.post('/resend', resendLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const vEmail = validateInstitutionalEmail(email);
    if (!vEmail.ok) return jsonError(res, 400, vEmail.reason, 'INVALID_EMAIL');

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email=? AND verified=0').get(cleanEmail);

    // Anti-enumération : toujours répondre ok
    if (!user) {
      return res.json({ ok: true, message: 'Email renvoyé si le compte existe.' });
    }

    const token = createToken(user.id, 'verify');
    await sendVerificationEmail({ name: user.name, email: cleanEmail, token });

    return res.json({ ok: true, message: 'Email de confirmation renvoyé.' });

  } catch (err) {
    console.error('[/auth/resend]', err);
    return jsonError(res, 500, 'Erreur serveur.', 'SERVER_ERROR');
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/auth/me  (route protégée — exemple)
// ═══════════════════════════════════════════════════════════
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonError(res, 401, 'Token requis', 'UNAUTHORIZED');
    }
    const token   = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user    = db.prepare('SELECT id,name,email,profile,country,verified,created_at FROM users WHERE id=?').get(payload.sub);
    if (!user) return jsonError(res, 404, 'Utilisateur introuvable', 'NOT_FOUND');
    return res.json({ ok: true, user });
  } catch (err) {
    return jsonError(res, 401, 'Token invalide ou expiré', 'INVALID_TOKEN');
  }
});

module.exports = router;
