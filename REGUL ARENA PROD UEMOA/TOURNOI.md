# 🏆 Tournoi synchronisé + chat — mise à jour du site

Cette fois, **un seul fichier change : `index.html`** (le serveur sait déjà tout faire pour les tournois).

## Ce que ça apporte
Le tournoi devient un **vrai jeu synchronisé** (phase de qualification) :
- Tous les participants reçoivent les **mêmes questions, dans le même ordre** (tirage basé sur le code du tournoi).
- **Chrono** par question + **passage automatique** (comme le duel).
- **Classement en direct** : les scores de tous s'affichent et se mettent à jour en temps réel.
- **💬 Chat du tournoi** dans le salon d'attente et sur le classement.
- Les sons fonctionnent aussi (bonne/mauvaise réponse, fin).

## Déploiement
- **`index.html`** → dans le dossier **`public`** (remplace l'ancien).
- *(`index.js` : à ne déployer **que si** tu ne l'avais pas déjà fait à l'étape « son + chat » d'avant. Il contient le chat **du duel**. Pour le tournoi seul, il n'est pas nécessaire.)*

## Comment ça marche pour toi et tes amis
1. **Créer un tournoi** : L'Arène → onglet Tournois → Créer. (Choisis bien **8, 16 ou 32 joueurs** et ta **zone** — sinon le serveur refuse.)
2. Partage le **code** (bouton WhatsApp).
3. Tes amis **rejoignent** avec le code → ils apparaissent dans la liste.
4. Toi (organisateur) : bouton **⚡ Lancer les qualifications**.
5. Chacun clique **▶️ Commencer mon quiz** → répond aux 10 questions (mêmes pour tous, 25s chacune, enchaînement auto).
6. À la fin, le **classement en direct** montre qui mène. Vous pouvez **chatter** pendant tout ça.

## Honnêteté sur la suite
- Pour l'instant, le tournoi = une **qualification synchronisée** (quiz commun + classement + chat). C'est déjà très complet.
- Le **bracket** (matchs à élimination 1 contre 1 après la qualification) est une **phase suivante** qu'on pourra ajouter ensuite — c'est un autre morceau.
- Le **chrono** donne la même durée par question à tout le monde ; il démarre quand chacun lance son quiz (donc quasi en même temps si vous démarrez ensemble).

Quand tu pourras tester à plusieurs, dis-moi : mêmes questions pour tous ? classement qui bouge en direct ? chat OK ? Et on enchaînera sur le bracket si tu veux.
