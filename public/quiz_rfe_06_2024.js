/* ============================================================
   QUIZ — Règlement n°06/2024/CM/UEMOA (Relations Financières
   Extérieures). Adopté à Bamako le 20/12/2024. Abroge le 09/2010.
   100% sourcé sur le texte intégral (articles + annexes).
   Format : startQ(QUIZ_RFE_06_2024, "RFE — Règlement 06/2024");
   Objet : { type, q, options, correct(index), exp, ref }
   Abdou valide le fond (Claude n'est pas juriste).
   ============================================================ */

const QUIZ_RFE_06_2024 = [

/* ===== TITRE I — OBJET & DÉFINITIONS (Art. 1-2) ===== */
{
  type:"qcm",
  q:"Le Règlement 06/2024 abroge et remplace :",
  options:["le Règlement 09/2010/CM/UEMOA","l'Instruction 013-04-2026","la Loi uniforme LBC/FT","le Traité UEMOA de 2003"],
  correct:0,
  exp:"L'article 35 abroge expressément le Règlement n°09/2010/CM/UEMOA du 1er octobre 2010.",
  ref:"Art. 35"
},
{
  type:"qcm",
  q:"Un investissement direct suppose une prise de participation d'au moins :",
  options:["5% du capital","10% du capital","25% du capital","50% du capital"],
  correct:1,
  exp:"L'investissement direct = acquisition d'actifs non financiers ou prise de participation d'au moins 10% du capital (déf. 43). En-dessous de 10% = investissement de portefeuille (déf. 44).",
  ref:"Art. 2, déf. 43-44"
},
{
  type:"qcm",
  q:"Le « centre d'intérêt économique prédominant » sert à déterminer :",
  options:["le taux de change applicable","la qualité de résident ou non-résident","le seuil de domiciliation","la devise du compte"],
  correct:1,
  exp:"C'est le lieu où une personne exerce sa principale activité économique ; nul ne peut en avoir plus d'un. Il fonde la distinction résident / non-résident (déf. 14, 51, 59).",
  ref:"Art. 2, déf. 14, 51, 59"
},
{
  type:"qcm",
  q:"Le négoce international désigne :",
  options:[
    "l'import puis la revente de biens dans le pays de résidence",
    "l'achat par un résident à un non-résident et la revente dans un pays tiers, sans entrée des biens dans le pays de l'acheteur",
    "toute exportation de services",
    "la vente de devises aux voyageurs"
  ],
  correct:1,
  exp:"Le négoce international : achat de biens par un résident à un non-résident et revente dans un pays autre que celui de résidence, sans que les biens entrent dans le pays de l'acheteur (déf. 50).",
  ref:"Art. 2, déf. 50"
},
{
  type:"qcm",
  q:"Un agréé de change manuel est nécessairement :",
  options:["une personne physique","une personne morale agréée par le Ministre des Finances","une succursale de la BCEAO","un service des Douanes"],
  correct:1,
  exp:"L'agréé de change manuel est une personne morale installée dans un État UEMOA et agréée par le Ministre des Finances (déf. 1 ; Annexe I art. 11-13).",
  ref:"Art. 2, déf. 1 ; Annexe I, art. 11-13"
},

/* ===== TITRE II — INTERMÉDIATION & CESSION (Art. 3-8) ===== */
{
  type:"vf",
  q:"Les mouvements de capitaux entre États membres de l'UEMOA sont libres et sans restriction.",
  options:["Vrai","Faux"],
  correct:0,
  exp:"VRAI. L'article 3 pose la liberté des mouvements de capitaux au sein de l'UEMOA, sans préjudice de la réglementation LBC/FT/P.",
  ref:"Art. 3"
},
{
  type:"qcm",
  q:"Les opérations de change avec l'étranger ou avec un non-résident ne peuvent être exécutées que par :",
  options:[
    "n'importe quel commerçant",
    "la BCEAO, l'Administration/Office des Postes, un intermédiaire agréé ou un agréé de change manuel",
    "le Trésor public uniquement",
    "les compagnies d'assurance"
  ],
  correct:1,
  exp:"L'article 4 réserve ces opérations à la BCEAO, à l'Administration/Office des Postes, aux intermédiaires agréés et aux agréés de change manuel, dans la limite de leurs attributions.",
  ref:"Art. 4"
},
{
  type:"vf",
  q:"Un résident doit céder à un intermédiaire agréé tous les revenus en devises encaissés hors UEMOA ou versés par un non-résident.",
  options:["Vrai","Faux"],
  correct:0,
  exp:"VRAI. L'article 5 impose la cession des devises encaissées hors UEMOA ou versées par un non-résident.",
  ref:"Art. 5"
},
{
  type:"qcm",
  q:"L'ouverture d'un compte étranger au profit d'un non-résident est soumise à :",
  options:[
    "l'autorisation préalable de la BCEAO",
    "l'autorisation du Ministre des Finances",
    "aucune autorisation",
    "l'accord de la Commission Bancaire"
  ],
  correct:0,
  exp:"L'article 6 (et Annexe II art. 55) soumet l'ouverture des comptes étrangers de non-résidents à l'autorisation préalable de la BCEAO.",
  ref:"Art. 6 ; Annexe II, art. 55"
},
{
  type:"qcm",
  q:"L'ouverture par un résident d'un compte en devises (intérieur ou à l'étranger) requiert :",
  options:[
    "l'autorisation préalable de la BCEAO seule",
    "l'autorisation préalable du Ministre des Finances, après avis conforme de la BCEAO",
    "aucune formalité",
    "l'accord de l'AMF-UMOA"
  ],
  correct:1,
  exp:"L'article 7 exige l'autorisation préalable du Ministre des Finances après avis conforme de la BCEAO. Exception : les comptes des représentations diplomatiques nationales ne sont soumis à aucune restriction.",
  ref:"Art. 7"
},

/* ===== TITRE III — OPÉRATIONS COURANTES (Art. 9-11) ===== */
{
  type:"vf",
  q:"Les paiements au titre des opérations courantes sont librement exécutés par l'entremise d'un intermédiaire agréé.",
  options:["Vrai","Faux"],
  correct:0,
  exp:"VRAI. L'article 9 pose la libre exécution des opérations courantes, sur pièces justificatives (sauf sous le seuil fixé par la BCEAO), via un intermédiaire agréé.",
  ref:"Art. 9"
},
{
  type:"qcm",
  q:"Quelles opérations courantes les résidents doivent-ils obligatoirement domicilier ?",
  options:[
    "tous les paiements de loyers",
    "les importations et exportations de biens, ainsi que les exportations temporaires d'or",
    "uniquement les envois de fonds des migrants",
    "les dividendes reçus"
  ],
  correct:1,
  exp:"L'article 10 impose la domiciliation des importations et exportations de biens et des exportations temporaires d'or.",
  ref:"Art. 10"
},
{
  type:"vf",
  q:"L'exportateur résident doit encaisser et rapatrier l'intégralité des recettes d'exportation.",
  options:["Vrai","Faux"],
  correct:0,
  exp:"VRAI. L'article 11 impose l'encaissement et le rapatriement intégral des recettes d'exportation de biens et services.",
  ref:"Art. 11"
},

/* ===== TITRE IV — OPÉRATIONS EN CAPITAL (Art. 12-19) ===== */
{
  type:"qcm",
  q:"Un investissement à l'étranger par un résident doit être financé, par un emprunt ou une mobilisation de ressources à l'étranger, à hauteur d'au moins :",
  options:["25%","50%","75%","100%"],
  correct:2,
  exp:"L'article 12 exige un financement extérieur d'au moins 75% (la quote-part de 25% restante peut être payée par débit d'un compte en FCFA). Même règle aux Art. 13, 14 et 17.",
  ref:"Art. 12 ; voir aussi Art. 13, 14, 17"
},
{
  type:"qcm",
  q:"L'investissement à l'étranger d'un résident est subordonné à :",
  options:[
    "l'autorisation préalable du Ministre des Finances",
    "une simple déclaration",
    "l'accord de la BRVM",
    "rien"
  ],
  correct:0,
  exp:"L'article 12 subordonne l'investissement à l'étranger à l'autorisation préalable du Ministre des Finances (demande via le modèle de l'Annexe VI).",
  ref:"Art. 12 ; Annexe VI"
},
{
  type:"vf",
  q:"La constitution d'un investissement direct étranger DANS un État de l'UEMOA est libre.",
  options:["Vrai","Faux"],
  correct:0,
  exp:"VRAI. L'article 15 pose la liberté de constitution des investissements directs étrangers ou de portefeuille dans l'UEMOA ; le produit est toutefois domicilié et cédé à la BCEAO.",
  ref:"Art. 15"
},
{
  type:"vf",
  q:"Un résident peut librement contracter un emprunt auprès d'un non-résident.",
  options:["Vrai","Faux"],
  correct:0,
  exp:"VRAI. L'article 16 autorise librement l'emprunt auprès d'un non-résident, mais impose déclaration statistique, domiciliation et cession du produit à la BCEAO.",
  ref:"Art. 16"
},
{
  type:"qcm",
  q:"L'émission ou la mise en vente dans l'UEMOA de titres d'États ou de sociétés étrangères est soumise à :",
  options:[
    "l'autorisation préalable de la BCEAO, avant le visa de l'AMF-UMOA",
    "l'accord des Douanes",
    "aucune autorisation",
    "l'autorisation du Trésor"
  ],
  correct:0,
  exp:"L'article 17 soumet ces opérations à l'autorisation préalable de la BCEAO, avant le visa de l'AMF-UMOA en matière d'appel public à l'épargne.",
  ref:"Art. 17"
},
{
  type:"qcm",
  q:"Les instruments dérivés de change utilisés par les résidents servent à :",
  options:[
    "spéculer librement sur le marché",
    "couvrir le risque de change, adossé à une opération commerciale ou financière",
    "remplacer la domiciliation",
    "éviter la cession de devises"
  ],
  correct:1,
  exp:"L'article 18 autorise les dérivés de change pour la couverture du risque de change ; les transactions doivent être adossées à des opérations commerciales ou financières.",
  ref:"Art. 18"
},

/* ===== TITRE V — OPÉRATIONS SUR L'OR (Art. 20-21) ===== */
{
  type:"qcm",
  q:"Un voyageur peut transporter, sans autorisation préalable, des objets en or dans la limite de :",
  options:["100 grammes","250 grammes","500 grammes","1 kilogramme"],
  correct:2,
  exp:"L'article 20 dispense de l'autorisation préalable l'import/export par voyageurs d'objets en or jusqu'à 500 grammes.",
  ref:"Art. 20, 3°"
},
{
  type:"vf",
  q:"L'importation et l'exportation d'or à destination/en provenance de l'étranger sont, en principe, soumises à autorisation préalable.",
  options:["Vrai","Faux"],
  correct:0,
  exp:"VRAI. L'article 20 soumet l'import/export d'or à l'autorisation préalable du Ministre des Finances ou de l'Autorité compétente (sauf dispenses : Trésor/BCEAO, faible quantité, voyageurs ≤ 500 g).",
  ref:"Art. 20"
},

/* ===== TITRE VI — POSITION DES BANQUES (Art. 22-23) ===== */
{
  type:"qcm",
  q:"Les créances et engagements des banques sur l'étranger sont soumis au contrôle de :",
  options:["la Commission de l'UEMOA","la BCEAO","l'AMF-UMOA","la BRVM"],
  correct:1,
  exp:"L'article 22 soumet les créances et engagements en FCFA et en devises des banques sur l'étranger au contrôle de la BCEAO.",
  ref:"Art. 22"
},

/* ===== TITRE VII — SANCTIONS (Art. 24-28) ===== */
{
  type:"qcm",
  q:"Les infractions au Règlement commises par un établissement agréé sont sanctionnées par :",
  options:[
    "la BCEAO et la Commission Bancaire de l'UMOA",
    "le tribunal de commerce uniquement",
    "l'AMF-UMOA",
    "le Ministre du Commerce"
  ],
  correct:0,
  exp:"L'article 28 prévoit la sanction par la BCEAO et la Commission Bancaire de l'UMOA ; les infractions peuvent entraîner le retrait de l'agrément.",
  ref:"Art. 28"
},

/* ===== ANNEXE II — PROCÉDURES PRATIQUES (le cœur métier) ===== */
{
  type:"qcm",
  q:"Pour domicilier une importation de biens, l'importateur soumet à l'intermédiaire agréé :",
  options:[
    "deux copies de la facture du fournisseur étranger (ou du contrat)",
    "uniquement une déclaration fiscale",
    "un engagement de change",
    "une autorisation de la BCEAO"
  ],
  correct:0,
  exp:"Annexe II, art. 4 : l'importateur remet deux copies de la facture du fournisseur étranger ou du contrat commercial ; l'intermédiaire ouvre alors le dossier de domiciliation (art. 5).",
  ref:"Annexe II, art. 4-5"
},
{
  type:"qcm",
  q:"Après dédouanement, le Bureau des Douanes transmet un exemplaire de l'attestation d'importation à la BCEAO et à la Structure des finances extérieures dans un délai de :",
  options:["48 heures","8 jours","15 jours","30 jours"],
  correct:1,
  exp:"Annexe II, art. 9 : transmission dans les 8 jours suivant la réalisation de l'opération d'importation.",
  ref:"Annexe II, art. 9"
},
{
  type:"qcm",
  q:"L'exportateur s'engage à rapatrier les recettes dans quel délai ?",
  options:[
    "immédiatement à l'expédition",
    "un (1) mois à compter de la date d'exigibilité du paiement",
    "trois (3) mois après la facture",
    "un an"
  ],
  correct:1,
  exp:"Annexes IX-1 et IX-3 : l'engagement de change porte sur un rapatriement dans le délai d'un mois à compter de la date d'exigibilité du paiement.",
  ref:"Annexe IX-1 et IX-3"
},
{
  type:"qcm",
  q:"La déclaration statistique d'un investissement direct étranger ou d'un emprunt à l'étranger doit être faite dans :",
  options:["8 jours","30 jours","60 jours","90 jours"],
  correct:1,
  exp:"Annexe VII-1 : déclaration dans un délai maximum de 30 jours à compter de la mise à disposition de tout ou partie des fonds.",
  ref:"Annexe VII-1"
},
{
  type:"qcm",
  q:"Toute exportation/importation matérielle de billets par un intermédiaire agréé est déclarée à la douane à la valeur de :",
  options:["50 000 FCFA par colis","100 000 FCFA par colis","500 000 FCFA par colis","1 000 000 FCFA par colis"],
  correct:1,
  exp:"Annexe II, art. 53 : déclaration à la douane et au transporteur à la valeur de 100 000 FCFA par colis.",
  ref:"Annexe II, art. 53"
},
{
  type:"vf",
  q:"L'exportation de billets de banque étrangers est réservée exclusivement aux intermédiaires agréés.",
  options:["Vrai","Faux"],
  correct:0,
  exp:"VRAI. Annexe II, art. 53 : l'exportation de billets/pièces étrangers est exclusivement réservée aux intermédiaires agréés.",
  ref:"Annexe II, art. 53"
},
{
  type:"vf",
  q:"Un résident peut envoyer par la poste des billets en FCFA à un correspondant situé hors de l'UEMOA.",
  options:["Vrai","Faux"],
  correct:1,
  exp:"FAUX. Annexe II, art. 53 : les envois de billets/pièces émis par la BCEAO entre un résident et ses correspondants hors UEMOA sont interdits.",
  ref:"Annexe II, art. 53"
},
{
  type:"vf",
  q:"Un compte étranger de non-résident peut être alimenté par des versements en billets émis par la BCEAO.",
  options:["Vrai","Faux"],
  correct:1,
  exp:"FAUX. Annexe II, art. 55 : les comptes de non-résidents ne peuvent pas être alimentés par des versements en billets et pièces émis par la BCEAO ; ils sont crédités dans la monnaie de tenue du compte.",
  ref:"Annexe II, art. 55"
},
{
  type:"qcm",
  q:"Les intermédiaires agréés peuvent octroyer des sous-délégations de reprise de devises notamment à :",
  options:[
    "tout particulier",
    "des hôtels, commerces d'aéroports détaxés et agences de voyage",
    "des entreprises minières",
    "des SGI uniquement"
  ],
  correct:1,
  exp:"Annexe II, art. 52 : sous-délégations possibles aux hôtels, commerces détaxés (aéroports) et agences de voyage recevant régulièrement des devises de voyageurs étrangers.",
  ref:"Annexe II, art. 52"
},

/* ===== CAS PRATIQUES ===== */
{
  type:"cas",
  q:"Cas — Un client importe une machine d'Allemagne pour 60 000 EUR. Première formalité à ouvrir dans vos livres ?",
  options:[
    "un engagement de change",
    "un dossier de domiciliation d'importation (sur facture/contrat)",
    "une autorisation de change du Ministre",
    "aucune, le règlement est libre"
  ],
  correct:1,
  exp:"L'importation de biens est soumise à domiciliation (Art. 10 ; Annexe II art. 3-5), sur la base de deux copies de la facture du fournisseur ou du contrat.",
  ref:"Art. 10 ; Annexe II, art. 3-5"
},
{
  type:"cas",
  q:"Cas — Un résident veut prendre une participation de 30% dans une société à Dubaï pour 500 M FCFA. Quelles conditions clés ?",
  options:[
    "Aucune autorisation, opération libre",
    "Autorisation préalable du Ministre des Finances + financement extérieur ≥ 75% + domiciliation",
    "Simple déclaration a posteriori",
    "Accord de la BRVM"
  ],
  correct:1,
  exp:"Investissement direct (≥10%) à l'étranger : autorisation préalable du Ministre des Finances, financement extérieur d'au moins 75%, et domiciliation auprès d'un intermédiaire agréé (Art. 12 ; Annexe VI).",
  ref:"Art. 12 ; Annexe VI ; Annexe II art. 34"
},
{
  type:"cas",
  q:"Cas — Un exportateur de produits halieutiques a expédié sa marchandise mais n'a pas encaissé les devises 2 mois après l'exigibilité. Quel est le manquement ?",
  options:[
    "aucun, le délai est de 6 mois",
    "non-respect de l'obligation de rapatriement (1 mois à compter de l'exigibilité)",
    "défaut d'autorisation de la BCEAO",
    "absence d'agrément de change manuel"
  ],
  correct:1,
  exp:"L'engagement de change porte sur un rapatriement dans le délai d'un mois à compter de l'exigibilité du paiement ; le dépassement compromet l'apurement (Art. 11 ; Annexe IX-1).",
  ref:"Art. 11 ; Annexe IX-1"
},
{
  type:"cas",
  q:"Cas — Un non-résident souhaite ouvrir un compte chez vous pour ses opérations dans l'UEMOA. Que vérifiez-vous d'abord ?",
  options:[
    "rien, ouverture libre",
    "l'autorisation préalable de la BCEAO pour le compte étranger de non-résident",
    "l'accord du Ministre du Commerce",
    "le visa de l'AMF-UMOA"
  ],
  correct:1,
  exp:"L'ouverture d'un compte étranger de non-résident est soumise à l'autorisation préalable de la BCEAO (Art. 6 ; Annexe II art. 55).",
  ref:"Art. 6 ; Annexe II, art. 55"
},
{
  type:"cas",
  q:"Cas — Un voyageur résident part à Dubaï avec 1 kg de bijoux en or personnels. Position réglementaire ?",
  options:[
    "Dispensé : la limite voyageur est de 500 g, donc le surplus n'est pas couvert par la dispense",
    "Totalement libre quelle que soit la quantité",
    "Interdit absolument",
    "Soumis au visa de l'AMF-UMOA"
  ],
  correct:0,
  exp:"La dispense d'autorisation pour les voyageurs s'arrête à 500 g d'objets en or (Art. 20, 3°). Au-delà, l'autorisation préalable redevient nécessaire.",
  ref:"Art. 20, 3°"
},
{
  type:"cas",
  q:"Cas — Une agence demande à envoyer par colis postal des billets en FCFA à un partenaire à Paris. Que répondez-vous ?",
  options:[
    "C'est possible si déclaré à la douane",
    "C'est interdit : les envois de billets FCFA vers des correspondants hors UEMOA sont prohibés",
    "C'est libre jusqu'à 100 000 FCFA",
    "Il faut l'accord du Trésor"
  ],
  correct:1,
  exp:"Annexe II, art. 53 : les envois de billets et pièces émis par la BCEAO entre un résident et ses correspondants hors UEMOA sont interdits.",
  ref:"Annexe II, art. 53"
}

];

/* Lancement : startQ(QUIZ_RFE_06_2024, "RFE — Règlement 06/2024"); */
