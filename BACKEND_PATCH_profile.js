/* ============================================================
   PATCH BACKEND — Route PATCH /profile
   À ajouter dans index.js (Railway), après les routes existantes
   ============================================================ */

// MODIFIÉ : mise à jour nom/profil/pays utilisateur
app.patch('/profile', requireAuth, (req, res) => {
  const { name, profile, country } = req.body;
  if (!name && !profile && !country) return res.status(400).json({ error: 'Aucune donnée' });

  const updates = [];
  const params  = [];

  if (name)    { updates.push('name = ?');    params.push(name.trim().slice(0, 80)); }
  if (profile) { updates.push('profile = ?'); params.push(profile.trim().slice(0, 120)); }
  if (country) { updates.push('country = ?'); params.push(country.trim().slice(0, 60)); }

  params.push(req.user.id);

  try {
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Erreur DB' });
  }
});
