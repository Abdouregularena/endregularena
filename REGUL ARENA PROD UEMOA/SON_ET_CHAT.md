# 🔊 Son + 💬 Chat de duel — 2 fichiers à mettre à jour

Cette mise à jour ajoute **deux choses** d'un coup :

**1. Le son** (nouveau — il n'y en avait aucun)
- Un bouton **🔊 en bas à droite**, toujours visible, pour activer/couper le son (ton choix est mémorisé).
- Sons intégrés (aucun fichier à héberger) : bonne réponse, mauvaise réponse, début de duel, victoire/défaite, et « bip » à la réception d'un message de chat.
- Le son marche aussi dans le quiz solo (bonne/mauvaise réponse).

**2. Le chat du duel**
- Une zone **💬 Chat du duel** dans l'écran de duel (et l'écran d'attente) : tu peux écrire à ton adversaire pendant la partie.
- Les messages s'affichent en direct des deux côtés ; un petit son prévient quand l'adversaire écrit.

## Les 2 fichiers (méthode habituelle → Railway redéploie)

### 1. `index.js` → à la RACINE
Racine du dépôt → **Add file → Upload files** → dépose **`index.js`** (remplace l'ancien) → **Commit**.
*(Il contient la nouvelle route du chat de duel.)*

### 2. `index.html` → dans le dossier `public`
Dossier **`public`** → **Add file → Upload files** → dépose **`index.html`** → **Commit**.

## Tester
1. Attends le redéploiement vert.
2. **Le son tout de suite** : ouvre le site, clique le bouton **🔊** en bas à droite (tu entends un petit bip), puis fais un quiz ou un duel → tu entends les sons.
   - *Astuce navigateur : le son a parfois besoin d'un premier clic sur la page pour s'activer (sécurité des navigateurs). Le bouton 🔊 sert justement à ça.*
3. **Le chat** : lance un duel à deux → la zone 💬 apparaît sous les réponses → écris un message → il apparaît chez ton adversaire en 1–2 secondes (avec un petit bip).

## Remarque
Si le bouton 🔊 gêne visuellement (position), dis-le moi, je le déplace. Et si tu veux d'autres sons (compte à rebours, applaudissements…), on peut les ajouter.

Teste, et dis-moi : tu entends bien les sons ? le chat fonctionne entre les deux joueurs ?
