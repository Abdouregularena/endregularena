# ⚔️ Duel synchronisé en direct — 2 fichiers à mettre à jour

Cette mise à jour transforme le duel en **affrontement en direct** :
- **mêmes questions, même ordre** pour les deux joueurs ;
- dès qu'un joueur trouve la bonne réponse, la question se **verrouille** pour l'autre (« ⏱ Trop tard ! ») ;
- **passage automatique** à la question suivante (plus de bouton à cliquer) ;
- **même score** affiché des deux côtés (lu depuis le serveur) ;
- un écran **« En attente de l'adversaire »** si tu finis avant lui.

## Les 2 fichiers (méthode habituelle → Railway redéploie tout seul)

### 1. `index.js` → à la RACINE
Sur GitHub, entre à la racine → **Add file → Upload files** → dépose le nouveau **`index.js`** (il remplace l'ancien) → **Commit**.

### 2. `index.html` → dans le dossier `public`
Entre dans **`public`** → **Add file → Upload files** → dépose le nouveau **`index.html`** → **Commit**.

## Tester (le vrai test)
1. Attends le redéploiement vert.
2. Toi + un ami, **2 comptes différents, 2 téléphones**.
3. Toi : **L'Arène → Créer un duel** → partage le code → l'ami **Rejoint** → tu **Lances**.
4. Vérifie :
   - les **mêmes questions** apparaissent des deux côtés ;
   - quand l'un répond juste en premier, l'autre voit **« Trop tard »** et passe ;
   - ça **enchaîne tout seul** ;
   - à la fin, le **même score** des deux côtés (ex. 600–400 partout, plus de 600/400 vs 400/500).

## Précisions honnêtes
- **Le chrono** : chaque joueur a le **même nombre de secondes** par question. Il démarre quand le joueur arrive sur la question — donc c'est quasi simultané (à ~1 seconde près), pas une horloge unique au millième. Pour la plupart des duels c'est parfait. Une synchro à la seconde exacte serait un petit raffinement à part.
- **Le son et le chat du duel** : ce sont les **2 prochaines étapes** (le son n'existe pas encore dans le site, le chat de duel demande un petit ajout serveur). On les fait juste après, une fois ce duel synchronisé validé.

Teste un duel à deux et dis-moi : mêmes questions ? verrou « trop tard » ? score identique des deux côtés ?
