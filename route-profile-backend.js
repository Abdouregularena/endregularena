/* ════════════════════════════════════════════════════════════════════
   REGUL ARENA — Route de mise à jour du profil
   À AJOUTER dans ton backend (auth.js ou index.js, là où sont déjà
   définies les routes /auth/verify, /auth/login-verify, etc.)

   Le frontend (saveST) envoie déjà :
     POST /auth/profile
     Headers : Authorization: Bearer <JWT>, Content-Type: application/json
     Body    : { name, profile, country }

   Cette route met à jour l'utilisateur EN BASE pour que la valeur tienne
   même après une reconnexion par nouveau lien magique.
   ════════════════════════════════════════════════════════════════════ */

const jwt = require('jsonwebtoken');

// Réutilise le même secret que partout ailleurs dans ton backend
const JWT_SECRET = process.env.JWT_SECRET;

// Si ton routeur d'auth est monté sur '/auth', écris '/profile' (et non '/auth/profile').
router.post('/profile', async (req, res) => {
  try {
    // 1) Authentifier via le JWT (même logique que tes autres routes protégées)
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: 'Token manquant' });

    let payload;
    try { payload = jwt.verify(token, JWT_SECRET); }
    catch (e) { return res.status(401).json({ success: false, message: 'Token invalide' }); }

    const email = payload.email; // identifiant de l'utilisateur dans ton store

    // 2) Nettoyer les entrées
    const name    = String(req.body.name    || '').trim().slice(0, 80);
    const profile = String(req.body.profile || '').trim().slice(0, 120); // = institution
    const country = String(req.body.country || '').trim().slice(0, 4);

    // 3) ▼▼▼ METTRE À JOUR EN BASE — adapte cette partie à TON store ▼▼▼
    //    Remplace par ta couche de données réelle (fichier JSON, SQLite,
    //    Supabase, Postgres...). L'idée : retrouver l'utilisateur par email
    //    et écrire name / profile / country.
    //
    //    Exemple store JSON en mémoire/fichier :
    //      const user = users.find(u => u.email === email);
    //      if (!user) return res.status(404).json({ success:false, message:'Utilisateur introuvable' });
    //      user.name = name; user.profile = profile; user.country = country;
    //      saveUsers(users); // persiste le fichier
    //
    //    Exemple Supabase :
    //      await supabase.from('users')
    //        .update({ name, profile, country })
    //        .eq('email', email);
    // ▲▲▲ FIN partie à adapter ▲▲▲

    // 4) Renvoyer le profil mis à jour
    return res.json({ success: true, user: { email, name, profile, country } });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/* ────────────────────────────────────────────────────────────────────
   IMPORTANT — pour que la correction tienne après un NOUVEAU lien magique :
   À la connexion (génération du JWT dans /verify ou /login-verify), assure-toi
   que le token est fabriqué À PARTIR DES VALEURS EN BASE, ex. :

     const tok = jwt.sign(
       { email: user.email, name: user.name, profile: user.profile,
         country: user.country, role: user.role || 'user' },
       JWT_SECRET, { expiresIn: '7d' }
     );

   Ainsi, une fois la base mise à jour par /auth/profile, chaque nouvelle
   connexion portera automatiquement le bon nom / pays / institution.
   ──────────────────────────────────────────────────────────────────── */
