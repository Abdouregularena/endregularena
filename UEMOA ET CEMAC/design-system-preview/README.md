# REGUL ARENA — Design System v2.0
## Documentation Typographique & UX

---

## 1. Système de polices

### Logique de choix

| Famille | Rôle | Usage dans REGUL ARENA |
|---------|------|------------------------|
| **Bebas Neue** | Display — impact maximal | Scores, timers, hero titles, stats géantes |
| **Montserrat** | Titres institutionnels | H1, H2, boutons CTA, texte question (600–800) |
| **Lato** | Navigation & sous-titres | H3, H4, menus nav, titres de cartes, labels |
| **Roboto** | Corps de texte | Texte courant, explications, descriptions, feedback |
| **Merriweather** | Citations réglementaires | Blockquotes, textes de loi, références officielles |
| **JetBrains Mono** | Codes & étiquettes | Badges institution, timers secondaires, meta-données |

### Import Google Fonts

```html
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,600;0,700;0,800;0,900;1,600&family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&family=Lato:ital,wght@0,300;0,400;0,700;0,900;1,400&family=Bebas+Neue&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

### Variables CSS

```css
--font-display:   'Bebas Neue', 'Montserrat', cursive;
--font-title:     'Montserrat', sans-serif;
--font-heading:   'Lato', sans-serif;
--font-body:      'Roboto', sans-serif;
--font-quote:     'Merriweather', Georgia, serif;
--font-mono:      'JetBrains Mono', monospace;
```

---

## 2. Hiérarchie typographique

### H1 — Montserrat ExtraBold 800
- **Couleur** : `var(--gold)` sur fond sombre, blanc sur fond navy
- **Taille** : `clamp(1.8rem, 4vw, 2.8rem)` (fluide)
- **Lettres** : `-0.02em` (serrées)
- **Usage** : Titre de page principale, fin de partie

```html
<h1>Réglementation Bancaire <span class="accent">UEMOA</span></h1>
```

### H2 — Montserrat Bold 700
- **Couleur** : `var(--text)` avec `.accent` doré inline
- **Usage** : Titre de section (Zones, Packs, Modes)

### H3 — Lato Bold 700
- **Usage** : Titres de cartes (pack, mode), titre de question quiz

### H4 — Lato Bold 700 uppercase
- **Usage** : Labels de navigation, en-têtes de groupe

### Corps — Roboto Regular 400
- `line-height: 1.55` pour lisibilité
- Taille base : `0.9rem`

### Citations — Merriweather Italic 300
- `border-left: 3px solid var(--gold)` UEMOA
- `border-left: 3px solid var(--cyan)` CEMAC
- `line-height: 1.75` pour textes légaux
- Attribut source avec `.cite-ref` (JetBrains Mono cyan)

---

## 3. Palette de couleurs

```
--gold      #C9991A   → Doré BCEAO / UEMOA (accent principal)
--gold-l    #E8B520   → Doré clair (hover, dégradés)
--gold-b    #FFD27A   → Doré lumineux (emphase inline)
--navy      #002B5C   → Bleu marine profond (nav, badges)
--cyan      #22D3EE   → Cyan CEMAC / éléments dynamiques
--green     #10B981   → Correct / succès
--red       #EF4444   → Erreur / mauvaise réponse
--bg        #03050A   → Fond principal (quasi-noir)
--bg2       #080C14   → Cartes, panneaux
--muted     #7A8499   → Texte secondaire / descriptions
```

---

## 4. Composants disponibles

### `components/header.html`
Navigation sticky avec :
- Logo Bebas Neue (REGUL blanc + ARENA doré)
- Liens Lato Medium uppercase
- CTA Montserrat ExtraBold (dégradé doré)
- Barre de progression quiz (activée via `window.RAHeader.setQuizProgress(n, total)`)
- Pill quiz actif
- Menu hamburger mobile avec drawer

### `components/zones.html`
Grille UEMOA / CEMAC :
- Drapeaux en `country-chip` interactifs
- Citations Merriweather par zone
- Badges institution (`institution-tag bceao|beac|cobac`)
- Pills de textes réglementaires

### `components/quiz.html`
Interface quiz complète :
- Barre sticky (pack, progression, timer Bebas Neue, score)
- Puces de progression par question (correct/wrong/current)
- Texte question en Montserrat 600
- Choix en Roboto (lettre Bebas Neue)
- Feedback par question : verdict Lato, explication Roboto, citation Merriweather
- Feuille de résultats avec tableau détaillé + références officielles

### `components/packs.html`
Grille packs avec :
- Filtres UEMOA/CEMAC/Commun
- Citations Merriweather par pack
- Tags de textes réglementaires

### `components/footer.html`
Footer institutionnel avec navigation, badges zone, signature pédagogique.

### `css/typography.css`
Feuille de styles typographiques autonome — à importer avant les styles composants.

---

## 5. Classes utilitaires

```css
/* Typographie */
.h1 .h2 .h3 .h4 .h5 .h6     → Hiérarchie appliquée sans balise sémantique
.muted                        → Texte secondaire (--muted)
.lead                         → Corps mis en avant (Roboto Medium)
.regul-quote                  → Blockquote réglementaire
.cite-ref                     → Référence source (Mono cyan)
.cite-inline                  → Citation courte inline
.regul-keyword                → Terme légal (Merriweather Italic Bold doré)

/* Institutions */
.institution-tag.bceao|uemoa  → Badge doré
.institution-tag.beac|cemac|cobac → Badge cyan

/* Boutons */
.btn-gold                     → CTA principal (dégradé doré, clip-path)
.btn-ghost                    → Secondaire transparent
.btn-zone                     → Bouton zone UEMOA
.btn-zone-cemac               → Bouton zone CEMAC

/* Layout */
.section                      → Conteneur section (max 1200px, padding 90px)
.section-label                → Étiquette mono au-dessus du titre
```

---

## 6. Responsive

- **≥ 900px** : Navigation complète desktop
- **< 900px** : Hamburger + drawer mobile, zones en colonne unique
- **< 768px** : Réduction polices, quiz optimisé tactile, padding réduit
- **< 480px** : Modes en colonne unique, stats condensées

---

## 7. Intégration dans index.html existant

### Étape 1 — Remplacer le Google Fonts existant
```html
<!-- AVANT -->
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">

<!-- APRÈS -->
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,600;0,700;0,800;0,900&family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Merriweather:ital,wght@0,300;0,400;1,300;1,400&family=Lato:wght@0,300;0,400;0,700;0,900&family=Bebas+Neue&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

### Étape 2 — Remplacer Inter par Roboto dans le body
```css
/* body : Inter → Roboto */
body { font-family: var(--font-body); /* 'Roboto' */ }
```

### Étape 3 — Appliquer Lato aux boutons nav
```css
.nav-links button { font-family: var(--font-heading); /* 'Lato' */ }
```

### Étape 4 — Ajouter Merriweather aux citations réglementaires
Chercher dans index.html les zones de feedback/explication et wrapper :
```html
<blockquote class="regul-quote">
  Texte officiel ici
  <cite class="cite-ref">Source · Article</cite>
</blockquote>
```

### Étape 5 — Activer la barre de progression quiz
Dans la logique de navigation solo, appeler :
```javascript
// Début question N
window.RAHeader?.setQuizProgress(currentQ, totalQ);

// Fin du quiz
window.RAHeader?.clearQuizProgress();
```

---

## 8. Performance

- Google Fonts chargé avec `display=swap` — pas de FOUT bloquant
- Polices `preconnect` déclarées en `<head>`
- Bebas Neue : ~20 KB (latin uniquement)
- Montserrat/Roboto : subset latin+latin-ext inclus par défaut
- Merriweather : chargé uniquement en `ital,wght@300,400` (citations légales)

---

*REGUL ARENA Design System v2.0 — Abdou NDAO — 2026*
