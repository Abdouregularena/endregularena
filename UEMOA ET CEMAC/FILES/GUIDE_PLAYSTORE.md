# REGUL ARENA — Guide Play Store via TWA

## Fichiers à intégrer dans ton projet Railway

```
C:\Users\DELL\Documents\VERSION FINALE\
├── public/
│   ├── manifest.json          ← copier tel quel
│   ├── sw.js                  ← copier tel quel
│   ├── .well-known/
│   │   └── assetlinks.json    ← compléter après étape 4
│   └── icons/                 ← créer ce dossier (voir étape 1)
└── index.html                 ← ajouter le contenu de INDEX_HTML_SNIPPET.html
```

---

## Étape 1 — Créer les icônes

Utilise https://maskable.app/editor ou https://realfavicongenerator.net
- Charger ton logo REGUL ARENA
- Exporter les tailles : 72, 96, 128, 144, 152, 192, 384, 512 px
- Les placer dans `public/icons/`

---

## Étape 2 — Modifier index.html

Dans ton `index.html` (ou `public/index.html`), ajouter dans `<head>` :

```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#6d28d9">
```

Et avant `</body>` :

```html
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(r => console.log('[PWA] SW enregistré'))
        .catch(e => console.warn('[PWA] SW erreur', e));
    });
  }
</script>
```

---

## Étape 3 — Vérifier que Express sert les fichiers statiques

Dans ton `index.js`, assure-toi que tu as :

```js
app.use(express.static('public'));

// Indispensable pour le fichier assetlinks.json
app.use('/.well-known', express.static('public/.well-known', {
  dotfiles: 'allow'
}));
```

---

## Étape 4 — Générer l'APK avec Bubblewrap

```bash
# Installer Bubblewrap (une seule fois)
npm install -g @bubblewrap/cli

# Créer le projet TWA
mkdir regul-arena-twa && cd regul-arena-twa
bubblewrap init --manifest https://www.regularena.com/manifest.json

# Bubblewrap va demander :
# - Package name   → com.regularena.app
# - App name       → REGUL ARENA
# - Host           → www.regularena.com
# - Start URL      → /
# - Signing key    → créer une nouvelle keystore

# Builder l'APK signé
bubblewrap build
```

Cela génère `app-release-signed.apk` et affiche ton **SHA-256 fingerprint**.

---

## Étape 5 — Compléter assetlinks.json

Remplacer `REMPLACER_PAR_LE_SHA256_GENERE_PAR_BUBBLEWRAP` dans
`public/.well-known/assetlinks.json` par la valeur affichée par Bubblewrap.

Redéployer sur Railway. Vérifier avec :
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://www.regularena.com&relation=delegate_permission/common.handle_all_urls

---

## Étape 6 — Compte Google Play Console

1. Aller sur https://play.google.com/console
2. Créer un compte développeur (25 $ one-time)
3. Créer une nouvelle application
4. Uploader l'APK dans "Tests internes" d'abord
5. Remplir la fiche Play Store (description, captures d'écran, catégorie : Éducation)
6. Passer en "Production" → review Google (7–10 jours)

---

## Checklist avant soumission

- [ ] https://www.regularena.com/manifest.json accessible
- [ ] https://www.regularena.com/sw.js accessible
- [ ] https://www.regularena.com/.well-known/assetlinks.json accessible
- [ ] Icône 512×512 maskable présente
- [ ] Au moins 1 capture d'écran téléphone (1080×1920)
- [ ] Railway sur plan payant (pas trial)
- [ ] SHA-256 dans assetlinks.json correspond à la keystore APK

---

## Pré-requis système pour Bubblewrap

- Node.js 16+ ✓ (tu as 22)
- Java JDK 8+ (installer depuis https://adoptium.net si absent)
- Android SDK (Bubblewrap l'installe automatiquement au premier lancement)
