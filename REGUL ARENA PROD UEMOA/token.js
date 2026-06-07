'use strict';
const crypto = require('crypto');
const db     = require('../db/database');

// ── Durée de vie des tokens ───────────────────────────────
const TTL = {
  verify: 24 * 60 * 60 * 1000,  // 24h
  login:  15 * 60 * 1000,        // 15 min
};

/**
 * Génère un token UUID v4 signé (hex 32 octets = 256 bits)
 * et le stocke en base avec une expiration.
 */
function createToken(userId, type = 'verify') {
  const token     = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TTL[type]).toISOString();

  // Invalider les anciens tokens du même type pour cet utilisateur
  db.prepare(`
    UPDATE email_tokens SET used = 1
    WHERE user_id = ? AND type = ? AND used = 0
  `).run(userId, type);

  db.prepare(`
    INSERT INTO email_tokens (user_id, token, type, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(userId, token, type, expiresAt);

  return token;
}

/**
 * Vérifie un token : retourne { valid, user_id, type } ou { valid: false }
 */
function verifyToken(token) {
  const row = db.prepare(`
    SELECT et.*, u.id AS uid
    FROM email_tokens et
    JOIN users u ON u.id = et.user_id
    WHERE et.token = ? AND et.used = 0
  `).get(token);

  if (!row)                              return { valid: false, reason: 'token_not_found' };
  if (new Date(row.expires_at) < new Date()) return { valid: false, reason: 'token_expired' };

  return { valid: true, user_id: row.user_id, type: row.type };
}

/**
 * Marque un token comme utilisé (one-time use)
 */
function consumeToken(token) {
  db.prepare(`UPDATE email_tokens SET used = 1 WHERE token = ?`).run(token);
}

/**
 * Nettoie les tokens expirés (appeler périodiquement)
 */
function cleanExpiredTokens() {
  const result = db.prepare(`
    DELETE FROM email_tokens WHERE expires_at < datetime('now')
  `).run();
  return result.changes;
}

module.exports = { createToken, verifyToken, consumeToken, cleanExpiredTokens };
