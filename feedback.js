'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../db/database');
const { validateInstitutionalEmail, validateName } = require('../utils/validator');
const { sendNotifyConfirmation } = require('../emails/sender');
const { feedbackLimiter } = require('../middleware/rateLimit');

function jsonError(res, status, message, code = 'ERROR') {
  return res.status(status).json({ ok: false, error: message, code });
}

// ═══════════════════════════════════════════════════════════
// POST /api/feedback
// Corps : { name?, email?, type, stars, message }
// ═══════════════════════════════════════════════════════════
router.post('/', feedbackLimiter, (req, res) => {
  try {
    const { name, email, type, stars, message } = req.body;

    // Validation message (obligatoire)
    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return jsonError(res, 400, 'Message trop court (minimum 10 caractères)', 'INVALID_MESSAGE');
    }
    if (message.trim().length > 1200) {
      return jsonError(res, 400, 'Message trop long (maximum 1200 caractères)', 'MESSAGE_TOO_LONG');
    }

    // Validation type
    const allowedTypes = ['suggestion','bug','eloge','question'];
    const cleanType = allowedTypes.includes(type) ? type : 'suggestion';

    // Validation étoiles
    const cleanStars = Math.min(5, Math.max(1, parseInt(stars) || 5));

    // Validation email optionnel
    let cleanEmail = null;
    if (email && email.trim().length > 0) {
      const vEmail = validateInstitutionalEmail(email);
      if (!vEmail.ok) return jsonError(res, 400, vEmail.reason, 'INVALID_EMAIL');
      cleanEmail = email.trim().toLowerCase();
    }

    // Validation nom optionnel
    let cleanName = null;
    if (name && name.trim().length > 0) {
      const vName = validateName(name);
      if (!vName.ok) return jsonError(res, 400, vName.reason, 'INVALID_NAME');
      cleanName = name.trim();
    }

    db.prepare(`
      INSERT INTO feedback (name, email, type, stars, message)
      VALUES (?, ?, ?, ?, ?)
    `).run(cleanName, cleanEmail, cleanType, cleanStars, message.trim());

    return res.json({ ok: true, message: 'Feedback enregistré. Merci !' });

  } catch (err) {
    console.error('[/feedback]', err);
    return jsonError(res, 500, 'Erreur serveur.', 'SERVER_ERROR');
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/notify
// Corps : { email }
// Inscription liste d'attente Tournoi 2027
// ═══════════════════════════════════════════════════════════
router.post('/notify', feedbackLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const vEmail = validateInstitutionalEmail(email);
    if (!vEmail.ok) return jsonError(res, 400, vEmail.reason, 'INVALID_EMAIL');

    const cleanEmail = email.trim().toLowerCase();

    // Insérer (ignorer si déjà présent)
    try {
      db.prepare('INSERT INTO notify_list (email) VALUES (?)').run(cleanEmail);
      // Envoyer email de confirmation
      await sendNotifyConfirmation({ email: cleanEmail });
    } catch (e) {
      if (e.message?.includes('UNIQUE')) {
        // Déjà inscrit — pas d'erreur visible
        return res.json({ ok: true, message: 'Vous êtes déjà sur la liste d\'attente.' });
      }
      throw e;
    }

    return res.json({
      ok: true,
      message: 'Inscription confirmée ! Vous serez alerté à l\'ouverture du Tournoi Inter-Pays 2027.',
    });

  } catch (err) {
    console.error('[/notify]', err);
    return jsonError(res, 500, 'Erreur serveur.', 'SERVER_ERROR');
  }
});

module.exports = router;
