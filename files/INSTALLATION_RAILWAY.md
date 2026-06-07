# 🚂 Mettre le salon en ligne — méthode GitHub → Railway

Tu as **3 fichiers** :
- `server.js` — le moteur
- `package.json` — la liste des outils dont le moteur a besoin
- `index.html` — ton site (mis à jour, avec le menu **Communauté**)

Et **une seule case à cliquer** dans Railway pour la base de données.

---

## Étape 1 — Ajouter une base de données dans Railway
1. Va sur **railway.app**, ouvre ton projet RegulArena.
2. Clique sur **`+ New`** (ou « Create ») → **Database** → **Add PostgreSQL**.
3. C'est tout : Railway crée la base et la relie automatiquement au serveur (variable `DATABASE_URL`).
✅ Tu n'as **aucune** ligne de base de données à écrire : la table se crée toute seule au démarrage.

## Étape 2 — Mettre les 3 fichiers dans ton dépôt GitHub
Place **`server.js`** et **`package.json`** au **même endroit que ton `index.html`** (la racine de ton dépôt), puis remplace ton ancien `index.html` par le nouveau.

Comme d'habitude : tu envoies (push) ces fichiers sur GitHub.

## Étape 3 — Laisser Railway se mettre à jour
Dès que GitHub reçoit les fichiers, Railway redéploie tout seul :
- il installe les outils (`express`, `pg`),
- il lance `server.js`,
- il crée la table du salon automatiquement.

Tu peux suivre ça dans Railway → onglet **Deployments / Logs**. Tu devrais voir :
`RegulArena en écoute sur le port ...`

## Étape 4 — Tester
1. Ouvre ton site → menu **Communauté 💬**.
2. Écris un message → il apparaît.
3. Ouvre le site sur un **autre téléphone** : le message s'affiche en quelques secondes. 🎉

Tu peux aussi vérifier que le moteur tourne en ouvrant l'adresse :
`https://ton-site/api/health` → doit afficher `{"ok":true}`.

---

## Si ça ne marche pas
- **Le site s'affiche mais le salon dit « erreur »** → la base PostgreSQL n'est pas reliée. Refais l'étape 1, puis dans Railway clique **Redeploy**.
- **Le déploiement échoue** → vérifie que `server.js` et `package.json` sont bien à la racine (au même niveau que `index.html`).
- **`/api/health` ne répond pas** → le serveur n'a pas démarré ; regarde les **Logs** Railway, l'erreur y est écrite.

## Ensuite
Quand le salon marche entre deux téléphones, on ajoute sur le même serveur :
1. les **messages privés** (entre deux membres),
2. le **suivi des tournois en direct**.
