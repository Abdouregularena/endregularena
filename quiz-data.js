'use strict';
/* ================================================================
   REGUL ARENA — Banques de quiz & jeux (extrait de index.html)
   Contient : mots croisés (CW_BANK), chaîne logique (CLL_BANK),
   Vrai/Faux (VF_BANK), chronologie (CH_BANK), et les enrichissements
   auto-évaluation UEMOA/CEMAC (AE_EXTRA_UEMOA / AE_EXTRA_CEMAC).
   Ce fichier doit être chargé AVANT le script principal de index.html
   (il déclare des variables globales `var` consommées plus loin).
================================================================ */

/* ── CW_BANK ── */
var CW_BANK = {
  U:[
    {word:'BCEAO', clue:"Banque centrale de l'UMOA"},
    {word:'AGREMENT', clue:"Autorisation préalable requise pour exercer une activité bancaire"},
    {word:'CONFORMITE', clue:"Fonction chargée de veiller au respect des règles internes et externes"},
    {word:'GOUVERNANCE', clue:"Ensemble des règles d'organisation et de contrôle interne d'une banque"},
    {word:'DEONTOLOGIE', clue:"Ensemble des règles éthiques encadrant la profession bancaire"},
    {word:'PLAFOND', clue:"Limite maximale fixée pour une opération ou un poste"},
    {word:'CAPITAL', clue:"Ressources propres minimales exigées pour obtenir l'agrément"},
    {word:'BLANCHIMENT', clue:"Opération visant à dissimuler l'origine illicite de fonds"}
  ],
  C:[
    {word:'COBAC', clue:"Organe de supervision bancaire de la zone CEMAC"},
    {word:'BEAC', clue:"Banque centrale des États de l'Afrique Centrale"},
    {word:'GABAC', clue:"Groupe d'action contre le blanchiment en Afrique Centrale"},
    {word:'ANIF', clue:"Agence Nationale d'Investigation Financière"},
    {word:'TIAO', clue:"Taux d'Intérêt des Appels d'Offres, fixé par le Comité de Politique Monétaire"},
    {word:'COSUMAF', clue:"Régulateur du marché financier de l'Afrique Centrale"},
    {word:'SANCTION', clue:"Mesure disciplinaire prononcée par l'autorité de supervision"},
    {word:'MICROFINANCE', clue:"Établissement de petite taille finançant particuliers et TPE"}
  ]
};

/* ── CLL_BANK ── */
var CLL_BANK = {
  U:[
    {word:'BCEAO', clue:"Banque centrale de l'UMOA"},
    {word:'PARMEC', clue:"Loi-cadre régissant les systèmes financiers décentralisés (SFD) de l'UEMOA"},
    {word:'CENTIF', clue:"Cellule nationale de traitement des informations financières (déclarations LBC/FT)"},
    {word:'CRAEF', clue:"Plateforme BCEAO de collecte automatisée des états financiers des établissements de crédit"},
    {word:'AGREMENT', clue:"Autorisation préalable requise pour exercer une activité bancaire"},
    {word:'CONFORMITE', clue:"Fonction chargée de veiller au respect des règles internes et externes"},
    {word:'GOUVERNANCE', clue:"Ensemble des règles d'organisation et de contrôle interne d'une banque"},
    {word:'BLANCHIMENT', clue:"Opération visant à dissimuler l'origine illicite de fonds"},
    {word:'PLAFOND', clue:"Limite maximale fixée pour une opération ou un poste"}
  ],
  C:[
    {word:'COBAC', clue:"Organe de supervision bancaire de la zone CEMAC"},
    {word:'BEAC', clue:"Banque centrale des États de l'Afrique Centrale"},
    {word:'GABAC', clue:"Groupe d'action contre le blanchiment en Afrique Centrale"},
    {word:'ANIF', clue:"Agence Nationale d'Investigation Financière"},
    {word:'TIAO', clue:"Taux d'Intérêt des Appels d'Offres, fixé par le Comité de Politique Monétaire"},
    {word:'COSUMAF', clue:"Régulateur du marché financier de l'Afrique Centrale"},
    {word:'MICROFINANCE', clue:"Établissement de petite taille finançant particuliers et TPE"},
    {word:'SANCTION', clue:"Mesure disciplinaire prononcée par l'autorité de supervision"}
  ]
};

/* ── VF_BANK ── */
var VF_BANK = { // À VALIDER PAR AMADOU SALL avant prod
  U:[
    {q:"Le capital social minimum d'une banque dans l'UEMOA est fixé par la Commission Bancaire.", a:false, source:"BCEAO fixe le capital minimum, pas la Commission Bancaire"},
    {q:"Un établissement de microfinance doit obtenir un agrément avant tout démarrage d'activité.", a:true, source:"Loi portant réglementation des SFD"},
    {q:"La déclaration de soupçon LBC/FT doit être adressée à la CENTIF.", a:true, source:"Loi uniforme LBC/FT UMOA 2023"},
    {q:"Le ratio de solvabilité minimum exigé dans l'UEMOA est de 5%.", a:false, source:"Le ratio minimum est de 8% (dispositif Bâle)"},
    {q:"Un virement transfrontalier au sein de l'UEMOA est dispensé de tout formulaire de change.", a:false, source:"Instruction RFE — formulaire de change requis"}
  ],
  C:[
    {q:"La COBAC est l'organe de supervision bancaire de la zone CEMAC.", a:true, source:"Convention régissant la COBAC"},
    {q:"Un commissaire aux comptes peut cumuler ce mandat avec la tenue des livres comptables de l'établissement.", a:false, source:"Instruction COBAC I-2004/01, art. 3"},
    {q:"La désignation d'un administrateur nécessite un extrait de casier judiciaire de moins de 3 mois.", a:true, source:"Instruction COBAC I-2009/02, art. 1er"},
    {q:"Le BEAC est la banque centrale commune des six États de la CEMAC.", a:true, source:"Statuts de la BEAC"},
    {q:"Les établissements de la CEMAC ne sont pas soumis à des obligations LBC/FT spécifiques.", a:false, source:"Règlement COBAC LBC/FT 2024 / GABAC"}
  ]
};

/* ── CH_BANK ── */
var CH_BANK = [
  {id:'cession', titre:'Cession de devises à l\'export (RFE UEMOA)', steps:[
    'Expédition des marchandises par l\'exportateur',
    'Exigibilité du paiement (max 120 jours après expédition)',
    'Encaissement des devises par le résident',
    'Cession des devises à un intermédiaire agréé (max 1 mois après exigibilité)',
    'Compte rendu à la Direction des Finances Extérieures et à la BCEAO'
  ]},
  {id:'investEtranger', titre:'Investissement à l\'étranger par un résident UEMOA', steps:[
    'Constitution du dossier (lettre selon modèle Annexe VII)',
    'Autorisation préalable du Ministre chargé des Finances',
    'Financement à 75% minimum par emprunts étrangers',
    'Réalisation de l\'investissement',
    'Déclaration de liquidation et rapatriement sous 1 mois si non réinvesti'
  ]},
  {id:'depart', titre:'Départ définitif d\'un étranger résident (Note BCEAO 2026)', steps:[
    'Constitution du dossier d\'avoirs justifiés',
    'Demande d\'autorisation à la Structure Finances Extérieures',
    'Instruction de la demande par la Structure',
    'Transfert intégral du solde des comptes FCFA'
  ]},
  {id:'fodep', titre:'Déclaration prudentielle FODEP (UMOA)', steps:[
    'Arrêté des comptes (31/12 ou 30/06)',
    'Élaboration du FODEP sur la plate-forme dédiée',
    'Transmission à la BCEAO (30 avril ou 31 octobre)'
  ]},
  {id:'pilier', titre:'Cycle de surveillance prudentielle (Piliers Bâle UMOA)', steps:[
    'Calcul des ratios minimums de fonds propres (Pilier 1)',
    'Auto-évaluation ICAAP par l\'établissement (Pilier 2)',
    'Évaluation SREP par la Commission Bancaire (Pilier 2)',
    'Publication des informations — discipline de marché (Pilier 3)'
  ]}
];

/* ── AE_EXTRA_UEMOA ── */
var AE_EXTRA_UEMOA = {
  cas_pratique:[
    {scenario:"Une banque de l'UMOA dégage un bénéfice net de 8 milliards FCFA. Son capital social est de 50 milliards FCFA et sa réserve spéciale s'élève déjà à 6 milliards FCFA.",
     questions:["Quel prélèvement doit-elle opérer au titre de la réserve spéciale ?","Jusqu'à quel niveau cette dotation se poursuit-elle ?"],
     correction:[
       {a:"Un prélèvement obligatoire de 15 % du bénéfice net, soit 1,2 milliard FCFA.",ref:"Annexe Décision N°013/2016/CM/UMOA — §16 (prélèvement 15 %)"},
       {a:"Jusqu'à ce que la réserve atteigne 20 % (1/5) du capital social — ici 10 Mds — et que les ratios cibles soient respectés.",ref:"Annexe Décision N°013/2016 — §16 (plafond 20 % du capital)"}
     ]}
  ],
  vrai_faux:[
    {affirmation:"Le ratio de levier minimum dans l'UMOA est de 3 % (Tier 1 rapporté à l'exposition totale non pondérée).",reponse:true,
     justification:"Exact : le ratio de levier minimum est de 3 %.",ref:"Annexe Décision N°013/2016 — Titre VIII"},
    {affirmation:"La périodicité minimale de publication des informations au titre du Pilier 3 est annuelle.",reponse:false,
     justification:"Faux : la périodicité minimale est semestrielle.",ref:"Annexe Décision N°013/2016 — Titre XII"},
    {affirmation:"Pour le calcul du risque opérationnel, les années où le Produit Net Bancaire est négatif ou nul sont exclues de la moyenne.",reponse:true,
     justification:"Exact : seules les années à PNB positif entrent dans la moyenne sur 3 ans.",ref:"Annexe Décision N°013/2016 — Titre V"}
  ],
  texte_trous:[
    {texte:"Le FODEP est transmis à la BCEAO de manière semestrielle, au plus tard le ___ avril et le ___ octobre.",
     reponses:["30","31"],
     ref:"Instruction N°005-08-2017 BCEAO — Art. 4"},
    {texte:"Au titre de la division des risques, le seuil de déclaration d'un grand risque est de ___ % des FPE et la limite individuelle sur un même bénéficiaire de ___ %.",
     reponses:["10","25"],
     ref:"Annexe Décision N°013/2016 — Titre VII"}
  ],
  calcul_prudentiel:[
    {enonce:"Le ratio de liquidité à court terme (LCR) de la banque est-il respecté ?",
     donnees:{"Actifs liquides de haute qualité (HQLA)":"100 Mds FCFA","Sorties nettes 30 jours (stress)":"80 Mds FCFA","Minimum LCR":"100 %"},
     etapes:["LCR = HQLA / sorties nettes 30j","= 100 / 80 = 125 %","Comparer à 100 %"],
     resultat:"125 % ≥ 100 % → conforme.",conforme:true,
     ref:"Instruction n°009-09-2017 BCEAO ; Annexe Décision N°013/2016 — Titre XIII"},
    {enonce:"Le ratio de liquidité à long terme (NSFR) de la banque est-il respecté ?",
     donnees:{"Financement stable disponible (ASF)":"600 Mds FCFA","Financement stable exigé (RSF)":"550 Mds FCFA","Minimum NSFR":"100 %"},
     etapes:["NSFR = ASF / RSF","= 600 / 550 = 109 %","Comparer à 100 %"],
     resultat:"109 % ≥ 100 % → conforme.",conforme:true,
     ref:"Annexe Décision N°013/2016 — Titre XIII"}
  ],
  audit:[
    {rapport:"Rapport — Banque V : le risque opérationnel a été calculé en incluant une année à PNB négatif ; le FODEP n'a été transmis qu'une seule fois dans l'année ; les états du Pilier 3 ne mentionnent pas les APR par catégorie.",
     irregularites:[
       {t:"Inclusion d'une année à PNB négatif dans le calcul du risque opérationnel : ces années doivent être exclues.",ref:"Annexe Décision N°013/2016 — Titre V"},
       {t:"FODEP transmis une seule fois : deux transmissions par an sont requises (30 avril et 31 octobre).",ref:"Instruction N°005-08-2017 BCEAO — Art. 4"},
       {t:"Absence des APR par catégorie dans le Pilier 3 : information obligatoire.",ref:"Annexe Décision N°013/2016 — Titre XII"}
     ]}
  ],
  examen:[
    {q:"Quelle est la périodicité de transmission du FODEP à la BCEAO ?",
     choices:["Trimestrielle","Semestrielle (30 avril et 31 octobre)","Annuelle","Mensuelle"],answer:1,
     ref:"Instruction N°005-08-2017 BCEAO — Art. 4"},
    {q:"Quel est le ratio de levier minimum exigé dans l'UMOA ?",
     choices:["2 %","3 %","5 %","8 %"],answer:1,
     ref:"Annexe Décision N°013/2016 — Titre VIII"},
    {q:"Quel coefficient est appliqué au PNB moyen pour le risque opérationnel ?",
     choices:["8 %","12 %","15 %","20 %"],answer:2,
     ref:"Annexe Décision N°013/2016 — Titre V"}
  ]
};

/* ── AE_EXTRA_CEMAC ── */
var AE_EXTRA_CEMAC = {   // MODIFIÉ
  cas_pratique:[
    {scenario:"Une banque agréée au Gabon souhaite ouvrir des succursales au Cameroun et au Congo sans repasser par une procédure d'agrément complète dans chaque pays.",
     questions:["Un dispositif facilite-t-il cette expansion régionale ?","Quel texte le prévoit ?"],
     correction:[
       {a:"Oui. L'agrément unique permet à une banque déjà agréée dans un État CEMAC d'ouvrir des succursales dans les autres États de la zone, sans nouvel agrément complet.",ref:"Règlement n°01/24/CEMAC/UMAC/COBAC (session du 20 décembre 2024)"},
       {a:"La banque reste soumise à la supervision de la COBAC et doit notifier l'ouverture selon la procédure prévue par le texte.",ref:"Règlement n°01/24/CEMAC/UMAC/COBAC — agrément unique"}
     ]},
    {scenario:"Une holding qui détient le contrôle de deux banques de la CEMAC estime ne pas être soumise au contrôle de la COBAC car elle n'exerce pas elle-même d'activité bancaire.",
     questions:["Cette holding échappe-t-elle à la supervision ?","Depuis quand ?"],
     correction:[
       {a:"Non. Les compagnies financières (holdings financières) sont assujetties à la supervision de la COBAC.",ref:"Règlement n°01/15/CEMAC/UMAC/COBAC/CM du 27 mars 2015"},
       {a:"Cet assujettissement des holdings financières est en vigueur depuis 2015.",ref:"Règlement n°01/15/CEMAC/UMAC/COBAC/CM (2015)"}
     ]},
    {scenario:"Une banque CEMAC détient au bilan des comptes clients sans aucun mouvement depuis plusieurs années et ne sait pas comment traiter ces avoirs en déshérence.",
     questions:["Un cadre récent encadre-t-il ces comptes ?","Quelle en est la nature ?"],
     correction:[
       {a:"Oui. Le traitement des comptes inactifs et des avoirs en déshérence est désormais encadré par un règlement communautaire dédié.",ref:"Règlement n°02/25/CEMAC/UMAC/CM/COBAC du 12 juillet 2025"},
       {a:"Ce règlement impose des diligences spécifiques de recensement, d'information et de traitement de ces avoirs.",ref:"Règlement n°02/25/CEMAC/UMAC/CM/COBAC (2025)"}
     ]}
  ],
  vrai_faux:[
    {affirmation:"La BEAC a été créée en 1972 et son siège est situé à Yaoundé.",reponse:true,
     justification:"Exact : la BEAC date de 1972 et son siège est à Yaoundé (la COBAC, elle, siège à Libreville).",ref:"Statuts BEAC — historique institutionnel"},
    {affirmation:"Le système monétique interbancaire GIMACPAY est administré par la COBAC.",reponse:false,
     justification:"Faux : GIMACPAY est administré par le GIMAC (Groupement Interbancaire Monétique de l'Afrique Centrale), non par la COBAC.",ref:"BEAC — GIMAC / GIMACPAY"},
    {affirmation:"Le capital social minimum d'un établissement financier dans la CEMAC est de 4 milliards FCFA depuis janvier 2026.",reponse:true,
     justification:"Exact : 4 milliards FCFA pour les établissements financiers (contre 25 milliards pour les banques).",ref:"Règlement COBAC R-2025/02 du 10 décembre 2025"}
  ],
  texte_trous:[
    {texte:"L'agrément unique permettant à une banque CEMAC d'ouvrir des succursales dans tous les pays de la zone résulte du Règlement n°___/CEMAC/UMAC/COBAC, adopté le ___ décembre 2024.",
     reponses:["01/24","20"],
     ref:"Règlement n°01/24/CEMAC/UMAC/COBAC du 20 décembre 2024"},
    {texte:"Le système monétique interbancaire de la CEMAC s'appelle ___ et est administré par le ___.",
     reponses:["GIMACPAY","GIMAC"],
     ref:"BEAC — Groupement Interbancaire Monétique de l'Afrique Centrale"},
    {texte:"Le capital minimum d'un établissement financier dans la CEMAC est de ___ milliards FCFA, et la lutte anti-blanchiment régionale est coordonnée par le ___.",
     reponses:["4","GABAC"],
     ref:"Règlement COBAC R-2025/02 ; GABAC (Afrique Centrale)"}
  ],
  calcul_prudentiel:[
    {enonce:"Cet établissement financier (non bancaire) atteint-il le capital social minimum en vigueur ?",
     donnees:{"Capital social libéré":"3 Mds FCFA","Capital minimum requis (établissement financier, ≥ 01/01/2026)":"4 Mds FCFA"},
     etapes:["Comparer 3 Mds au minimum de 4 Mds","Déficit = 4 − 3 = 1 Md"],
     resultat:"3 < 4 Mds → NON conforme (déficit de 1 Md à combler).",conforme:false,
     ref:"Règlement COBAC R-2025/02 du 10 décembre 2025 (établissements financiers : 4 Mds)"},
    {enonce:"Le ratio de couverture des risques de cette banque atteint-il tout juste l'exigence COBAC ?",
     donnees:{"Fonds propres effectifs":"42 Mds FCFA","APR":"400 Mds FCFA","Minimum COBAC requis":"10,5 %"},
     etapes:["Ratio = 42 / 400 = 10,5 %","Comparer à 10,5 %"],
     resultat:"10,5 % = 10,5 % → conforme (au seuil exact).",conforme:true,
     ref:"Normes prudentielles COBAC — Rapport annuel COBAC 2024 (10,5 %)"},
    {enonce:"Cet EMF de 3ème catégorie atteint-il le capital social minimum exigé ?",
     donnees:{"Capital social de l'EMF":"120 M FCFA","Capital minimum 3ème catégorie":"150 M FCFA"},
     etapes:["Comparer 120 M au minimum de 150 M","Déficit = 150 − 120 = 30 M"],
     resultat:"120 < 150 M → NON conforme.",conforme:false,
     ref:"COBAC — relèvement progressif du capital EMF 3ème catégorie (2018-2021)"}
  ],
  audit:[
    {rapport:"Rapport — Banque E (CEMAC) : holding de contrôle non déclarée à la COBAC ; détention de crypto-actifs pour compte propre ; aucun plan de relèvement du capital transmis au 30 juin 2026.",
     irregularites:[
       {t:"Holding financière de contrôle non assujettie/non déclarée à la COBAC alors qu'elle est supervisée depuis 2015.",ref:"Règlement n°01/15/CEMAC/UMAC/COBAC/CM (2015)"},
       {t:"Détention de crypto-actifs : interdite dans la CEMAC.",ref:"Lettre circulaire COBAC — crypto-actifs"},
       {t:"Absence de plan de relèvement du capital au 30/06/2026 : échéance transitoire non respectée.",ref:"Règlement COBAC R-2025/02 — dispositions transitoires"}
     ]},
    {rapport:"Rapport — EMF F : agréé en 3ème catégorie avec un capital de 100 M FCFA ; emploie le terme « banque » sur sa devanture.",
     irregularites:[
       {t:"Capital de 100 M : inférieur au minimum de 150 M pour la 3ème catégorie.",ref:"COBAC — capital EMF 3ème catégorie (150 M)"},
       {t:"Usage du mot « banque » par un EMF : interdit.",ref:"Règlement microfinance CEMAC — Art. 5"}
     ]},
    {rapport:"Rapport — Établissement G : n'applique aucune diligence LBC/FT aux Organismes à But Non Lucratif (OBNL) clients ; conserve les pièces de vigilance 4 ans.",
     irregularites:[
       {t:"Absence de diligences LBC/FT sur les OBNL, désormais intégrés au périmètre d'assujettissement.",ref:"Règlement COBAC R-2023/01 du 19/12/2023 — périmètre OBNL"},
       {t:"Conservation des pièces de vigilance 4 ans : inférieure au minimum de 10 ans.",ref:"Règlement COBAC R-2023/01 — Art. 38"}
     ]},
    {rapport:"Rapport — Intermédiaire agréé H : a importé pour 60 M FCFA de devises sans autorisation préalable ; n'a pas vérifié la conformité d'une transaction avec l'extérieur avant exécution.",
     irregularites:[
       {t:"Importation de devises de 60 M FCFA sans autorisation UMAC (seuil de 40 M dépassé).",ref:"Règlement n°02/18/CEMAC/UMAC/CM — Art. 15"},
       {t:"Défaut de vérification de la conformité de l'opération à la réglementation des changes avant exécution.",ref:"Règlement n°02/18/CEMAC/UMAC/CM — Art. 25"}
     ]}
  ],
  examen:[
    {q:"Qui est le Gouverneur de la BEAC en exercice (2025-2026) ?",
     choices:["Abbas Mahamat Tolli","Lucas Abaga Nchama","Yvon Sana Bangui","Jean-Claude Masangu"],answer:2,
     ref:"BEAC — communiqués officiels 2025-2026"},
    {q:"Quel règlement a instauré l'agrément unique pour les succursales bancaires dans la CEMAC ?",
     choices:["R-2023/01","R-2025/02","Règlement n°01/24/CEMAC/UMAC/COBAC","Règlement n°02/18/CEMAC/UMAC/CM"],answer:2,
     ref:"Règlement n°01/24/CEMAC/UMAC/COBAC (20 décembre 2024)"},
    {q:"Quel organisme administre le système monétique interbancaire GIMACPAY ?",
     choices:["La BEAC","La COBAC","Le GIMAC","La COSUMAF"],answer:2,
     ref:"BEAC — GIMAC / GIMACPAY"},
    {q:"Quel est le capital social minimum d'un établissement financier (non bancaire) dans la CEMAC depuis janvier 2026 ?",
     choices:["1 milliard FCFA","2 milliards FCFA","4 milliards FCFA","10 milliards FCFA"],answer:2,
     ref:"Règlement COBAC R-2025/02 du 10 décembre 2025"}
  ]
};

