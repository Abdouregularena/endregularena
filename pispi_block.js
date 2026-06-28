/* ════════════════════════════════════════════════════════════════
   LOT PI-SPI — Paiement Instantané / Services de Paiement UEMOA   // MODIFIÉ
   Source : Instruction BCEAO n°001-01-2024 + Communiqué BCEAO 25/06/2026
   100% additif — calqué sur le pack BCB. À coller en fin de script (avant la fermeture).
   ⚠️ Seuils & n° d'articles à faire valider par Amadou Sall avant prod.
═══════════════════════════════════════════════════════════════════ */
(function lotPISPI(){
  try{
    /* 1) PACK BIBLIOTHÈQUE */
    var BP = {
      "pack_id":"pispi-uemoa",
      "titre":"Pack PI-SPI — Services de paiement UEMOA",
      "sous_titre":"Instruction BCEAO n°001-01-2024 · Paiement instantané (éch. 30/09/2026)",
      "icone":"⚡",
      "couleur":"#C9991A",
      "sources":[
        "Instruction n°001-01-2024 relative aux services de paiement dans l'UMOA (BCEAO)",
        "Communiqué BCEAO du 25/06/2026 — déploiement PI-SPI (interopérabilité)",
        "Règlement relatif aux systèmes de paiement dans l'UEMOA"
      ],
      "fiches_revision":[
        {"id":"f01","ordre":1,"titre":"Champ d'application & acteurs","icone":"🧩",
         "resume_court":"L'Instruction encadre tous les prestataires de services de paiement (PSP) et crée le statut d'établissement de paiement.",
         "points_cles":[
           "5 catégories visées (Art. 2) : banques, ét. financiers de crédit, ét. de paiement, institutions de microfinance, EME.",
           "Les PSP regroupent : ét. de crédit, IMF, EME et ét. de paiement (Art. 3.38).",
           "Deux statuts spécialisés : prestataire d'initiation de paiement (PSIP) et agrégateur de comptes (Art. 3.39-40).",
           "8 services de paiement listés (Art. 4), du versement/retrait jusqu'à l'agrégation de comptes."
         ],
         "a_retenir":"Tout ce qui touche au paiement passe par un PSP agréé ou enregistré ; nul ne peut s'en prévaloir sans agrément (Art. 9).",
         "exemple_concret":"Une fintech qui veut seulement « agréger » les comptes d'un client s'enregistre comme agrégateur (Art. 22-24), pas comme établissement complet.",
         "piege_frequent":"Un ét. de paiement n'est PAS une banque : il ne reçoit pas de dépôts rémunérés et n'octroie pas de crédit (Art. 8).",
         "source":"Instruction n°001-01-2024 — Art. 2, 3, 4, 9"},
        {"id":"f02","ordre":2,"titre":"Agrément, capital & forme juridique","icone":"🏛️",
         "resume_court":"L'accès au statut d'établissement de paiement est conditionné à un capital, une forme sociétaire et un délai d'instruction.",
         "points_cles":[
           "Capital minimum (Art. 11) : agrégation seule = 10 M ; initiation seule = 20 M ; initiation + agrégation = 30 M ; ≥ 1 service i)-vi) = 100 M FCFA.",
           "Forme juridique (Art. 13) : SA, SARL ou coopérative — JAMAIS unipersonnelle.",
           "Délai d'instruction agrément : 6 mois (9 mois si avis de non-objection requis) — Art. 18-19.",
           "Enregistrement agrégateur : 3 mois (Art. 23) ; immatriculation d'un agent : 30 jours (Art. 38)."
         ],
         "a_retenir":"Le capital varie selon le service : plus on touche aux fonds du client, plus l'exigence monte (100 M FCFA au maximum).",
         "exemple_concret":"Un acteur offrant virements + cartes (services i à vi) doit justifier 100 M FCFA de capital intégralement libéré.",
         "piege_frequent":"Le silence de la BCEAO pendant 6 mois vaut REFUS d'agrément (Art. 19), pas acceptation tacite.",
         "source":"Instruction n°001-01-2024 — Art. 11, 13, 18, 19, 23, 38"},
        {"id":"f03","ordre":3,"titre":"Opérations interdites & cantonnement des fonds","icone":"🚫",
         "resume_court":"L'établissement de paiement a un périmètre strict et doit protéger les fonds reçus de la clientèle.",
         "points_cles":[
           "Interdit (Art. 8) : accorder du crédit, verser des intérêts, traiter des moyens cambiaires (chèque, LdC, billet à ordre, crédoc), recourir à des distributeurs.",
           "Placements encadrés : dépôts à vue ≥ 30 % en permanence ; titres d'État ≤ 25 % (Art. 8).",
           "Cantonnement (Art. 48) : fonds non remis à la fin du jour ouvrable suivant → comptes de cantonnement dédiés en banque/IMF.",
           "Rapprochement quotidien obligatoire entre comptes de cantonnement et soldes des comptes de paiement."
         ],
         "a_retenir":"Les fonds des clients sont sanctuarisés : isolés de la trésorerie de l'établissement et protégés des autres créanciers en cas de liquidation.",
         "exemple_concret":"En fin de journée, l'argent non encore versé au bénéficiaire est logé sur un compte de cantonnement distinct, jamais mélangé aux fonds propres.",
         "piege_frequent":"Un ét. de paiement ne peut PAS rémunérer le solde du compte de paiement (Art. 8.2).",
         "source":"Instruction n°001-01-2024 — Art. 8, 48"},
        {"id":"f04","ordre":4,"titre":"Sécurité : authentification forte & risques","icone":"🔐",
         "resume_court":"Le paiement instantané étant irrévocable, la sécurité et la maîtrise des risques sont au cœur du dispositif.",
         "points_cles":[
           "Authentification forte (Art. 3.5) = combinaison d'au moins 2 des 3 facteurs : connaissance (code), possession (téléphone), inhérence (biométrie).",
           "Obligatoire (Art. 85) pour : accès en ligne au compte, initiation d'un paiement électronique, action à risque de fraude.",
           "Lien dynamique entre l'opération, le montant et le bénéficiaire lors de l'initiation (Art. 85).",
           "Dispositif de gestion des risques + tests d'intrusion au moins 1/an, rapports communiqués sous 30 jours (Art. 82-83)."
         ],
         "a_retenir":"2 facteurs minimum + lien dynamique : c'est l'exigence socle pour tout paiement électronique.",
         "exemple_concret":"Validation d'un virement = code secret (connaissance) + OTP sur le téléphone (possession), liés au montant exact et au bénéficiaire.",
         "piege_frequent":"Deux mots de passe ne suffisent PAS : il faut 2 facteurs de NATURES différentes.",
         "source":"Instruction n°001-01-2024 — Art. 3.5, 82, 83, 85"},
        {"id":"f05","ordre":5,"titre":"Droits de l'utilisateur & réclamations","icone":"🛡️",
         "resume_court":"Face à l'irrévocabilité, le texte protège fortement l'utilisateur via remboursement et recours encadrés.",
         "points_cles":[
           "Opération non autorisée (Art. 69) : remboursement IMMÉDIAT par le PSP du payeur + rétablissement du compte.",
           "Notification d'une opération non autorisée : au plus tard 9 mois après le débit (Art. 67).",
           "Remboursement d'une opération initiée par/via le bénéficiaire : demande sous 8 semaines, réponse du PSP sous 10 jours ouvrés (Art. 71-72).",
           "Réclamation : réponse sous 7 jours ouvrables, puis Commission Bancaire ou OQSF (Art. 51)."
         ],
         "a_retenir":"« Non autorisé » = remboursement immédiat ; la charge de la preuve de la fraude/négligence pèse sur le PSP (Art. 68).",
         "exemple_concret":"Un client conteste un débit qu'il n'a pas validé : le PSP le rembourse sans délai, puis devra prouver fraude ou négligence grave pour ne pas en supporter le coût.",
         "piege_frequent":"Modification du contrat = préavis 2 mois ; le client peut résilier sans frais avec 1 mois de préavis (Art. 57).",
         "source":"Instruction n°001-01-2024 — Art. 51, 57, 67, 68, 69, 71, 72"},
        {"id":"f06","ordre":6,"titre":"Irrévocabilité & responsabilité","icone":"⚡",
         "resume_court":"Instantané rime avec définitif : l'ordre reçu ne se révoque plus, ce qui déplace les responsabilités.",
         "points_cles":[
           "Irrévocabilité (Art. 75) : l'ordre ne peut plus être révoqué dès réception par le PSP du payeur.",
           "Exceptions (Art. 76) : prélèvement automatique et ordres programmés, révocables au plus tard la veille du jour convenu.",
           "Identifiant unique erroné (Art. 78) : PSP non responsable, mais il apporte son concours pour récupérer les fonds.",
           "Recours aux agents (Art. 39) : l'établissement de paiement reste pleinement responsable vis-à-vis des tiers."
         ],
         "a_retenir":"Une fois l'ordre reçu, plus de marche arrière : d'où le poids des contrôles fraude et de la lutte contre les réclamations.",
         "exemple_concret":"Un transfert instantané validé est définitif en quelques secondes ; en cas d'IBAN erroné saisi par le client, le PSP aide à récupérer mais n'est pas tenu responsable.",
         "piege_frequent":"Confirmer la disponibilité des fonds (Art. 61) ne permet PAS de bloquer/réserver ces fonds.",
         "source":"Instruction n°001-01-2024 — Art. 39, 61, 75, 76, 78"}
      ],
      "flash_cards":[
        {"categorie":"Champ d'application","recto":"Combien de catégories d'entités l'Instruction n°001-01-2024 vise-t-elle ?","verso":"5 : banques, ét. financiers de crédit, ét. de paiement, IMF, EME.","source":"Art. 2"},
        {"categorie":"Capital","recto":"Capital minimum pour fournir au moins un service i) à vi) (versement, virement, carte…) ?","verso":"100 millions FCFA, intégralement souscrits et libérés.","source":"Art. 11"},
        {"categorie":"Capital","recto":"Capital minimum pour fournir uniquement l'agrégation de comptes ?","verso":"10 millions FCFA (20 M pour l'initiation seule, 30 M pour les deux).","source":"Art. 11"},
        {"categorie":"Forme juridique","recto":"Quelle forme un ét. de paiement ne peut-il jamais revêtir ?","verso":"La société unipersonnelle (autorisé : SA, SARL, coopérative).","source":"Art. 13"},
        {"categorie":"Interdictions","recto":"Cite deux opérations interdites à un ét. de paiement.","verso":"Accorder du crédit et verser des intérêts sur le compte de paiement (aussi : moyens cambiaires, distributeurs).","source":"Art. 8"},
        {"categorie":"Cantonnement","recto":"Où vont les fonds clients non remis à la fin du jour ouvrable suivant ?","verso":"Sur des comptes de cantonnement dédiés ouverts en banque ou IMF, avec rapprochement quotidien.","source":"Art. 48"},
        {"categorie":"Sécurité","recto":"En quoi consiste l'authentification forte ?","verso":"Combinaison d'au moins 2 des 3 facteurs : connaissance, possession, inhérence (biométrie).","source":"Art. 3.5 & 85"},
        {"categorie":"Droits client","recto":"Que doit faire le PSP face à une opération non autorisée ?","verso":"Rembourser immédiatement le montant et rétablir le compte débité.","source":"Art. 69"},
        {"categorie":"Réclamation","recto":"Délai de réponse à une réclamation utilisateur ?","verso":"7 jours ouvrables, puis recours Commission Bancaire ou OQSF.","source":"Art. 51"},
        {"categorie":"Irrévocabilité","recto":"À partir de quand un ordre de paiement devient-il irrévocable ?","verso":"Dès sa réception par le PSP du payeur (sauf exceptions de l'Art. 76).","source":"Art. 75"},
        {"categorie":"Incident","recto":"Délai pour transmettre le rapport détaillé d'un incident opérationnel majeur ?","verso":"72 heures après la notification (notification elle-même : sans délai).","source":"Art. 84"},
        {"categorie":"Transitoire","recto":"Délai accordé aux PSP pour se conformer à l'Instruction ?","verso":"6 mois (disposition transitoire).","source":"Art. 96"}
      ],
      "mnemotechniques":[
        {"concept":"Les 3 facteurs d'authentification forte","moyen":"« C-P-I » : Connais · Possède · Incarne","explication":"Connaissance (code/mot de passe), Possession (téléphone/carte/token), Inhérence/Incarnation (biométrie : voix, visage, empreinte). Il faut au moins 2 des 3.","exemple":"Code secret (C) + OTP téléphone (P) = authentification forte valide.","source":"Art. 3.5"},
        {"concept":"Capitaux minimums (Art. 11)","moyen":"« 10-20-30-100 »","explication":"Agrégation seule = 10 M, Initiation seule = 20 M, Initiation+Agrégation = 30 M, au moins un service i)-vi) = 100 M FCFA.","exemple":"Acteur faisant des virements → 100 M FCFA.","source":"Art. 11"},
        {"concept":"Placements des fonds (Art. 8)","moyen":"« 30 dedans, 25 dehors »","explication":"Au moins 30 % en dépôts à vue (sécurité/liquidité), au plus 25 % en titres d'État.","exemple":"100 FCFA placés : ≥ 30 en DAV, ≤ 25 en titres d'État.","source":"Art. 8"},
        {"concept":"Délais clés du client","moyen":"« 7-9-8-2 »","explication":"7 jours ouvrables (réponse réclamation), 9 mois (notifier une op. non autorisée), 8 semaines (demande de remboursement op. via bénéficiaire), 2 mois (préavis de modif. de contrat).","exemple":"Contestation d'un débit non autorisé : jusqu'à 9 mois après le débit.","source":"Art. 51, 67, 72, 57"},
        {"concept":"Ce qu'un PSIP ne fait JAMAIS","moyen":"« Ni FONDS, ni STOCK, ni RETOUCHE »","explication":"Un prestataire d'initiation ne détient jamais les fonds, ne conserve pas les données sensibles, ne modifie ni le montant ni le bénéficiaire.","exemple":"Le PSIP déclenche l'ordre mais l'argent ne transite jamais par lui.","source":"Art. 30"},
        {"concept":"Instantané = irrévocable","moyen":"« Envoyé = Gravé »","explication":"Dès réception par le PSP du payeur, l'ordre ne se révoque plus : d'où l'importance de la lutte fraude et des réclamations.","exemple":"Un virement instantané validé est définitif en quelques secondes.","source":"Art. 75"}
      ],
      "glossaire":[
        {"terme":"Prestataire de services de paiement (PSP)","definition":"Ensemble formé par les établissements de crédit, les IMF, les établissements de monnaie électronique et les établissements de paiement.","source":"Art. 3.38"},
        {"terme":"Établissement de paiement","definition":"Personne morale (hors ét. de crédit/EME/IMF) qui fournit à titre de profession des services de paiement.","source":"Art. 3.19"},
        {"terme":"Établissement de monnaie électronique (EME)","definition":"Personne morale qui émet et distribue à titre de profession de la monnaie électronique.","source":"Art. 3.18"},
        {"terme":"Compte de paiement","definition":"Compte détenu par un ét. de paiement au nom d'utilisateurs, utilisé exclusivement pour exécuter des opérations de paiement.","source":"Art. 3.12"},
        {"terme":"Cantonnement","definition":"Dispositif qui dissocie les fonds de l'établissement de ceux reçus des utilisateurs pour l'exécution des opérations.","source":"Art. 3.11"},
        {"terme":"Authentification forte","definition":"Procédure combinant au moins 2 des 3 éléments : connaissance, possession, caractéristique personnelle (biométrie).","source":"Art. 3.5"},
        {"terme":"Service d'initiation de paiement","definition":"Service consistant à initier un ordre de paiement à la demande de l'utilisateur sur un compte détenu auprès d'un autre PSP.","source":"Art. 3.43"},
        {"terme":"Agrégateur de comptes","definition":"Établissement de paiement fournissant uniquement un service d'information consolidée sur un ou plusieurs comptes.","source":"Art. 3.39"},
        {"terme":"Identifiant unique","definition":"Combinaison de lettres/chiffres/symboles permettant l'identification certaine d'un utilisateur et/ou de son compte.","source":"Art. 3.25"},
        {"terme":"Incident opérationnel majeur","definition":"Événement entraînant notamment une interruption > 4 h, ou affectant ≥ 25 % du volume ou des utilisateurs.","source":"Art. 3.26"},
        {"terme":"Opération de paiement","definition":"Action de verser, transférer ou retirer des fonds, indépendamment de toute obligation sous-jacente.","source":"Art. 3.32"},
        {"terme":"Irrévocabilité","definition":"Caractère d'un ordre qui ne peut plus être révoqué une fois reçu par le PSP du payeur (sauf exceptions).","source":"Art. 75-76"}
      ]
    };
    window.BP = BP;

    /* 2) QUESTIONS (schéma QN standard : cat / q / choices / answer / source) */
    var BP_Q = [
      {"cat":"PI-SPI · Champ d'application","q":"À quelles entités l'Instruction n°001-01-2024 s'applique-t-elle ?","choices":["Uniquement aux banques","Banques, ét. financiers de crédit, ét. de paiement, IMF et EME","Uniquement aux fintech étrangères","Uniquement aux EME"],"answer":1,"source":"Instruction n°001-01-2024 — Art. 2"},
      {"cat":"PI-SPI · Agrément & capital","q":"Capital social minimum pour fournir au moins un service i) à vi) (versement, virement, carte…) ?","choices":["10 millions FCFA","20 millions FCFA","30 millions FCFA","100 millions FCFA"],"answer":3,"source":"Instruction n°001-01-2024 — Art. 11"},
      {"cat":"PI-SPI · Agrément & capital","q":"Capital minimum pour fournir uniquement le service d'agrégation de comptes ?","choices":["10 millions FCFA","20 millions FCFA","30 millions FCFA","100 millions FCFA"],"answer":0,"source":"Instruction n°001-01-2024 — Art. 11"},
      {"cat":"PI-SPI · Forme juridique","q":"Quelle forme un établissement de paiement ne peut-il PAS revêtir ?","choices":["Société anonyme","Société à responsabilité limitée","Société unipersonnelle","Société coopérative"],"answer":2,"source":"Instruction n°001-01-2024 — Art. 13"},
      {"cat":"PI-SPI · Opérations interdites","q":"Quelle opération est interdite à un établissement de paiement ?","choices":["Émettre des instruments de paiement","Accorder du crédit","Exécuter des virements","Acquérir des opérations de paiement"],"answer":1,"source":"Instruction n°001-01-2024 — Art. 8"},
      {"cat":"PI-SPI · Opérations interdites","q":"Parmi ces moyens, lequel un établissement de paiement ne peut-il PAS traiter ?","choices":["Le virement","La carte de paiement","Le chèque","Le prélèvement"],"answer":2,"source":"Instruction n°001-01-2024 — Art. 8"},
      {"cat":"PI-SPI · Protection des fonds","q":"Les dépôts à vue doivent représenter en permanence au moins quel % des fonds des comptes de paiement placés ?","choices":["10 %","25 %","30 %","50 %"],"answer":2,"source":"Instruction n°001-01-2024 — Art. 8"},
      {"cat":"PI-SPI · Authentification forte","q":"L'authentification forte combine au moins :","choices":["Deux des trois facteurs (connaissance, possession, inhérence)","Trois mots de passe distincts","Un seul code OTP","Deux mots de passe"],"answer":0,"source":"Instruction n°001-01-2024 — Art. 3.5 & 85"},
      {"cat":"PI-SPI · Authentification forte","q":"Dans quel cas l'authentification forte est-elle obligatoire ?","choices":["Pour consulter la grille tarifaire","Pour accéder en ligne au compte ou initier un paiement électronique","Uniquement au guichet physique","Jamais sur mobile"],"answer":1,"source":"Instruction n°001-01-2024 — Art. 85"},
      {"cat":"PI-SPI · Droits de l'utilisateur","q":"En cas d'opération non autorisée, le PSP du payeur doit :","choices":["Attendre 30 jours avant d'agir","Rembourser immédiatement et rétablir le compte","Ouvrir une enquête de 90 jours","Refuser tant que la fraude n'est pas prouvée"],"answer":1,"source":"Instruction n°001-01-2024 — Art. 69"},
      {"cat":"PI-SPI · Réclamations","q":"Délai maximum de réponse à une réclamation d'un utilisateur ?","choices":["48 heures","7 jours ouvrables","30 jours","2 mois"],"answer":1,"source":"Instruction n°001-01-2024 — Art. 51"},
      {"cat":"PI-SPI · Protection des fonds","q":"Les fonds clients non remis à la fin du jour ouvrable suivant doivent être :","choices":["Conservés en caisse","Déposés sur des comptes de cantonnement (banque/IMF)","Placés en actions cotées","Reversés à la BCEAO"],"answer":1,"source":"Instruction n°001-01-2024 — Art. 48"},
      {"cat":"PI-SPI · Irrévocabilité","q":"À partir de quand un ordre de paiement devient-il en principe irrévocable ?","choices":["Après 24 heures","Dès sa réception par le PSP du payeur","Seulement après confirmation du bénéficiaire","Jamais"],"answer":1,"source":"Instruction n°001-01-2024 — Art. 75"},
      {"cat":"PI-SPI · Initiation de paiement","q":"Un prestataire de services d'initiation de paiement (PSIP) ne doit jamais :","choices":["Communiquer de façon sécurisée","Détenir les fonds du payeur","Recueillir le consentement","S'authentifier auprès du gestionnaire de compte"],"answer":1,"source":"Instruction n°001-01-2024 — Art. 30"},
      {"cat":"PI-SPI · Gestion des incidents","q":"Après notification d'un incident opérationnel majeur, le rapport détaillé est transmis sous :","choices":["24 heures","48 heures","72 heures","7 jours"],"answer":2,"source":"Instruction n°001-01-2024 — Art. 84"},
      {"cat":"PI-SPI · Dispositions transitoires","q":"Délai accordé aux PSP pour se conformer à l'Instruction ?","choices":["1 mois","3 mois","6 mois","1 an"],"answer":2,"source":"Instruction n°001-01-2024 — Art. 96"},
      {"cat":"PI-SPI · Droits de l'utilisateur","q":"Délai maximum pour notifier une opération non autorisée au PSP ?","choices":["8 semaines","6 mois","9 mois suivant le débit","1 an"],"answer":2,"source":"Instruction n°001-01-2024 — Art. 67"},
      {"cat":"PI-SPI · Contrôle","q":"Qui est l'autorité de contrôle des établissements de paiement ?","choices":["La CENTIF","La Commission Bancaire de l'UMOA","L'OHADA","Le Trésor public"],"answer":1,"source":"Instruction n°001-01-2024 — Art. 45"}
    ];
    window.BP_Q = BP_Q;

    /* 3) Injection dans les moteurs de quiz / compétitions / auto-évaluation */
    if(typeof window!=='undefined'){
      if(!window.QN_U) window.QN_U = [];
      Array.prototype.push.apply(window.QN_U, BP_Q);   // zone UEMOA : quiz thématiques, duels, tournois
    }
    if(typeof QN!=='undefined' && QN && QN.push){
      Array.prototype.push.apply(QN, BP_Q);            // total master (examen, _allQ, packs 'qn'/'inter')
    }

    /* 3 bis) Thème dédié dans l'Arène (Quiz / Duel / Tournoi / Défi du jour) */
    if(typeof ARENA_THEMES!=='undefined' && ARENA_THEMES && !ARENA_THEMES.pispi){
      ARENA_THEMES.pispi = {
        l:'⚡ PI-SPI · Services de paiement',
        rx:/PI-?SPI|001-01-2024|service.?de paiement|paiement instantan|authentification forte|cantonnement|initiation de paiement|agr[ée]gat|irr[ée]vocab|[ée]tablissement de paiement/i
      };
    }

    /* 4) Ouverture du pack depuis la Bibliothèque (chaînage de openB) */
    if(typeof window.openB==='function'){
      var _origOpenB_PISPI = window.openB;
      window.openB = function(ds){
        if(ds==='BP'){
          try{ BA=BP; }catch(e){} try{ window.BA=BP; }catch(e){}
          try{ BT='fiches'; }catch(e){} try{ window.BT='fiches'; }catch(e){}
          try{ BF=null; }catch(e){} try{ window.BF=null; }catch(e){}
          render(); return;
        }
        return _origOpenB_PISPI.apply(this, arguments);
      };
    }

    /* 5) Carte du pack dans l'onglet "packs" de la Bibliothèque (chaînage de rBibMain) */
    if(typeof window.rBibMain==='function'){
      var _origRBibMain_PISPI = window.rBibMain;
      window.rBibMain = function(){
        var bibTab = (typeof _BPT==='undefined') ? 'packs' : _BPT;
        if(bibTab!=='packs') return _origRBibMain_PISPI.apply(this, arguments);
        var list = [['BR',BR,QR.length],['BB',BB,QB.length]];
        if(typeof window.BCB!=='undefined') list.push(['BCB',window.BCB,(window.BCB_Q||[]).length]);
        list.push(['BP',BP,BP_Q.length]);
        return '<div style="display:flex;flex-direction:column;gap:10px;">'+list.map(function(x){
          var ds=x[0], d=x[1], qs=x[2];
          return '<div class="card ch" onclick="openB(\''+ds+'\')">'+
          '<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;">'+
          '<div style="font-size:32px;flex-shrink:0;">'+d.icone+'</div>'+
          '<div style="flex:1;min-width:180px;">'+
          '<div style="font-weight:800;color:white;font-size:14px;margin-bottom:3px;">'+d.titre+'</div>'+
          '<div style="font-size:11px;color:var(--sub);margin-bottom:8px;">'+d.sous_titre+'</div>'+
          '<div style="display:flex;gap:6px;flex-wrap:wrap;">'+
          '<span class="badge">'+d.fiches_revision.length+' fiches</span>'+
          '<span class="badge">'+d.glossaire.length+' termes</span>'+
          '<span class="badge">'+qs+' questions</span></div></div>'+
          '<button class="btn btn-sm" onclick="event.stopPropagation();openB(\''+ds+'\')">Ouvrir →</button></div></div>';
        }).join('')+'</div>';
      };
    }
  }catch(e){ try{ console.warn('lotPISPI:', e); }catch(_){} }
})();
