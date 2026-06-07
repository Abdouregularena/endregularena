'use strict';

// Domaines personnels bloqués (doit être identique au frontend)
const BLOCKED_DOMAINS = ['yopmail.com','free.fr','icloud.com','protonmail.com',
  'yahoo.fr','msn.com','wanadoo.fr','laposte.net',
  'tutanota.com','mailinator.com','guerrillamail.com','10minutemail.com',
];

/**
 * Valide un email institutionnel
 * @returns {{ ok: boolean, reason?: string }}
 */
function validateInstitutionalEmail(email) {
  if (!email || typeof email !== 'string') {
    return { ok: false, reason: 'Email manquant' };
  }

  const trimmed = email.trim().toLowerCase();

  // Format basique
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { ok: false, reason: 'Format email invalide' };
  }

  // Longueur max
  if (trimmed.length > 120) {
    return { ok: false, reason: 'Email trop long' };
  }

  const domain = trimmed.split('@')[1];

  // Domaine bloqué
  if (BLOCKED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d))) {
    return { ok: false, reason: 'Email personnel non accepté — utilisez votre email institutionnel' };
  }

  return { ok: true };
}

/**
 * Valide un nom (prénom + nom)
 */
function validateName(name) {
  if (!name || typeof name !== 'string') return { ok: false, reason: 'Nom manquant' };
  const trimmed = name.trim();
  if (trimmed.length < 2)  return { ok: false, reason: 'Nom trop court (min. 2 caractères)' };
  if (trimmed.length > 80) return { ok: false, reason: 'Nom trop long (max. 80 caractères)' };
  // Uniquement lettres, espaces, tirets, apostrophes
  if (!/^[\p{L}\s'\-\.]+$/u.test(trimmed)) {
    return { ok: false, reason: 'Nom contient des caractères non valides' };
  }
  return { ok: true };
}

/**
 * Valide un profil
 */
function validateProfile(profile) {
  const allowed = ['etudiant','professionnel','formateur','regulateur'];
  if (!allowed.includes(profile)) {
    return { ok: false, reason: 'Profil invalide' };
  }
  return { ok: true };
}

/**
 * Valide un pays (code ISO 2 lettres, liste UMOA + CEMAC)
 */
function validateCountry(country) {
  const allowed = [
    'SN','CI','BF','ML','BJ','NE','TG','GW',  // UEMOA
    'CM','GA','CG','CF','GQ','TD',               // CEMAC
  ];
  if (!allowed.includes(country)) {
    return { ok: false, reason: 'Pays non supporté' };
  }
  return { ok: true };
}

module.exports = {
  validateInstitutionalEmail,
  validateName,
  validateProfile,
  validateCountry,
};
