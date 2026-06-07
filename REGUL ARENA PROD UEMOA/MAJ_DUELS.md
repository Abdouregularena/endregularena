# ⚔️ Activer les duels — 2 fichiers à mettre à jour

**Pourquoi ça ne marchait pas :** le serveur cherchait les questions du duel dans une ancienne variable disparue. Maintenant, il les prend dans tes vraies questions UEMOA (`data/quiz_uemoa.json`), et il fait confiance au résultat calculé par le site.

Deux fichiers à envoyer sur GitHub (comme d'habitude → Railway redéploie tout seul) :

## 1. `packs.js` → à la RACINE
Sur GitHub, ouvre **`packs.js`** (à la racine), clique le **crayon**, efface tout, colle le nouveau contenu, **Commit**. *(Il remplace l'ancien.)*

## 2. `index.html` → dans le dossier `public`
Entre dans le dossier **`public`** → **Add file → Upload files** → dépose le nouveau **`index.html`** → **Commit**.

## 3. Attendre le redéploiement (vert) puis tester
1. Toi et un ami, connectez-vous (2 comptes différents).
2. Toi : **L'Arène → Créer un duel**, choisis un pack, partage le code.
3. Ton ami : **Rejoindre** avec le code.
4. Toi (créateur) : **Lancer le duel**. Cette fois il doit démarrer (plus d'erreur « Pack introuvable »). 🎉

## Vérification rapide des logs
Dans les logs Railway, au démarrage tu dois maintenant voir :
`[packs] 38 questions chargées (5 packs) depuis data/quiz_uemoa.json`
(au lieu de l'ancien message d'erreur rouge).

---

## Deux précisions honnêtes
- **Le son** : tu n'entendais pas le son de début de duel parce que le duel **ne démarrait pas** (l'erreur le bloquait). Une fois le duel lancé, dis-moi si le son joue ou non — si besoin, je le branche proprement.
- **Le score** : le serveur fait désormais confiance au résultat envoyé par le site (puisque c'est le site qui affiche les questions). C'est parfait pour des duels amicaux d'entraînement. Si un jour tu veux un système 100 % anti-triche (questions identiques imposées par le serveur aux deux joueurs), ce sera un chantier séparé qu'on pourra faire plus tard.
