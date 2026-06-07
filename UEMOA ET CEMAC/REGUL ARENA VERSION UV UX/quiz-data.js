/**
 * REGUL ARENA - Banque de questions réglementaires UMOA/BCEAO
 * Source: Dispositif prudentiel UMOA - Décision N°013/24/06/2016/CM/UMOA
 *
 * Structure de chaque question:
 *  - id: identifiant unique pour tracker côté serveur
 *  - category: pour filtrage/thématique
 *  - difficulty: 1=Novice, 2=Junior, 3=Confirmé, 4=Senior, 5=Expert
 *  - xp: récompense XP (corrélée à la difficulté)
 *  - question: l'énoncé
 *  - options: tableau de 4 réponses
 *  - correctIndex: 0-3, index de la bonne réponse
 *  - explanation: explication pédagogique post-quiz
 *  - source: référence réglementaire précise (paragraphe + titre)
 *  - tags: pour recherche/clustering
 */

window.QUIZ_BANK = [
  // ═══════════════════════════════════════════════════════
  //  CATÉGORIE 1 : FONDS PROPRES (CET1, T1, FPE)
  // ═══════════════════════════════════════════════════════
  {
    id: 'UMOA-FP-001',
    category: 'Fonds propres',
    difficulty: 1,
    xp: 50,
    question: "Quel est le ratio minimum de fonds propres de base durs (CET1) qu'un établissement de crédit UMOA doit respecter, avant application du coussin de conservation ?",
    options: ["3 % des risques pondérés", "5 % des risques pondérés", "7,5 % des risques pondérés", "9 % des risques pondérés"],
    correctIndex: 1,
    explanation: "Les fonds propres de base durs (CET1) doivent représenter au moins 5 % des risques pondérés de l'établissement, avant prise en compte du coussin de conservation de 2,5 %. Avec le coussin, l'exigence cible passe à 7,5 %.",
    source: "Dispositif prudentiel UMOA 2016, §91(a) - Titre III",
    tags: ['CET1', 'fonds propres', 'Bâle III', 'ratio minimum']
  },
  {
    id: 'UMOA-FP-002',
    category: 'Fonds propres',
    difficulty: 1,
    xp: 50,
    question: "À combien s'élève l'exigence minimale de fonds propres effectifs (FPE = T1 + T2) en pourcentage des risques pondérés ?",
    options: ["6 %", "8 %", "9 %", "11,5 %"],
    correctIndex: 2,
    explanation: "Les fonds propres effectifs, composés du T1 (CET1 + AT1) et du T2, doivent couvrir au moins 9 % des risques pondérés. Avec le coussin de conservation de 2,5 %, l'exigence totale atteint 11,5 %.",
    source: "Dispositif prudentiel UMOA 2016, §91(c) - Titre III",
    tags: ['FPE', 'T1', 'T2', 'solvabilité']
  },
  {
    id: 'UMOA-FP-003',
    category: 'Fonds propres',
    difficulty: 2,
    xp: 100,
    question: "Le coussin de conservation des fonds propres exigé dans l'UMOA est fixé à :",
    options: ["1,5 % du CET1", "2,5 % des risques pondérés, composé exclusivement de CET1", "5 % des fonds propres totaux", "2,5 % des FPE, indépendamment de la composition"],
    correctIndex: 1,
    explanation: "Le coussin de conservation est fixé à 2,5 % des risques pondérés et doit être constitué EXCLUSIVEMENT d'éléments de CET1. Il est constitué AU-DELÀ des exigences minimales et vise à absorber les pertes hors période de tension.",
    source: "Dispositif prudentiel UMOA 2016, §92 - Titre III",
    tags: ['coussin conservation', 'CET1', 'tampon']
  },
  {
    id: 'UMOA-FP-004',
    category: 'Fonds propres',
    difficulty: 3,
    xp: 200,
    question: "Quel est le taux de prélèvement annuel sur les bénéfices nets imposé aux banques UMOA pour constituer leur réserve spéciale ?",
    options: ["5 %", "10 %", "15 %", "20 %"],
    correctIndex: 2,
    explanation: "Les banques et établissements financiers à caractère bancaire sont tenus de constituer une réserve spéciale via un prélèvement de 15 % des bénéfices nets annuels. Cette dotation cesse d'être obligatoire lorsque (a) les ratios cibles sont respectés ET (b) la réserve atteint 1/5 du capital social.",
    source: "Dispositif prudentiel UMOA 2016, §16 - Titre II",
    tags: ['réserve spéciale', 'bénéfices', 'CET1']
  },
  {
    id: 'UMOA-FP-005',
    category: 'Fonds propres',
    difficulty: 4,
    xp: 300,
    question: "Une banque affiche un ratio CET1 de 6,5 %. Selon le tableau de conservation des fonds propres, quel pourcentage MAXIMUM de ses bénéfices distribuables peut-elle verser en dividendes ?",
    options: ["0 % (interdit)", "40 %", "60 %", "100 % (libre)"],
    correctIndex: 1,
    explanation: "Un établissement avec un ratio CET1 entre 6,25 % et 6,875 % doit conserver au moins 60 % de ses bénéfices distribuables — donc ne peut verser que 40 % maximum en dividendes, rachats d'actions et primes discrétionnaires. Ces restrictions visent à reconstituer le coussin de conservation.",
    source: "Dispositif prudentiel UMOA 2016, §96-97 - Tableau 1",
    tags: ['dividendes', 'CET1', 'restrictions', 'coussin']
  },
  {
    id: 'UMOA-FP-006',
    category: 'Fonds propres',
    difficulty: 3,
    xp: 200,
    question: "Concernant le coussin contracyclique, quelle est la plage maximale fixée par la Banque Centrale ?",
    options: ["0,5 % des risques pondérés", "1,5 % des risques pondérés", "2,5 % des risques pondérés en CET1", "5 % des FPE"],
    correctIndex: 2,
    explanation: "La BCEAO peut exiger un coussin contracyclique composé d'éléments de CET1 représentant AU PLUS 2,5 % du total des risques pondérés. Il vise à tenir compte de l'environnement macrofinancier et de la répartition géographique des portefeuilles de crédit.",
    source: "Dispositif prudentiel UMOA 2016, §98 - Titre III",
    tags: ['coussin contracyclique', 'macroprudentiel']
  },

  // ═══════════════════════════════════════════════════════
  //  CATÉGORIE 2 : LIQUIDITÉ (RLCT, RLLT)
  // ═══════════════════════════════════════════════════════
  {
    id: 'UMOA-LIQ-001',
    category: 'Liquidité',
    difficulty: 1,
    xp: 50,
    question: "Le ratio de liquidité à court terme (RLCT / LCR) impose à un établissement UMOA de couvrir ses sorties nettes de trésorerie sur quelle période de crise ?",
    options: ["7 jours calendaires", "30 jours calendaires", "90 jours calendaires", "1 an"],
    correctIndex: 1,
    explanation: "Le RLCT vise à conserver des coussins de liquidité suffisants pour faire face à un déséquilibre éventuel entre entrées et sorties de trésorerie sur une période de crise de 30 jours calendaires. Il doit être au moins égal à 100 %.",
    source: "Dispositif prudentiel UMOA 2016, §582 - Titre XIII",
    tags: ['RLCT', 'LCR', 'liquidité court terme', 'Bâle III']
  },
  {
    id: 'UMOA-LIQ-002',
    category: 'Liquidité',
    difficulty: 2,
    xp: 100,
    question: "Quelle est l'exigence minimale du Ratio Structurel de Liquidité à Long Terme (RLLT / NSFR) ?",
    options: ["≥ 75 %", "≥ 90 %", "≥ 100 %", "≥ 120 %"],
    correctIndex: 2,
    explanation: "Le RLLT doit être au moins égal à 100 %. Il correspond au rapport entre le montant de financement stable DISPONIBLE et le montant de financement stable EXIGÉ. Il garantit que la banque maintient un profil de financement stable adapté à la composition de ses actifs.",
    source: "Dispositif prudentiel UMOA 2016, §583 - Titre XIII",
    tags: ['RLLT', 'NSFR', 'liquidité long terme']
  },
  {
    id: 'UMOA-LIQ-003',
    category: 'Liquidité',
    difficulty: 3,
    xp: 200,
    question: "Le ratio RLCT se calcule comme :",
    options: [
      "Total actifs / Total passifs",
      "Actifs liquides de haute qualité non grevés / Sorties nettes de trésorerie sur 30 jours",
      "Dépôts clientèle / Crédits clientèle",
      "Fonds propres / Dépôts à court terme"
    ],
    correctIndex: 1,
    explanation: "Le RLCT = (Encours d'actifs liquides de haute qualité NON GREVÉS) / (Sorties nettes de trésorerie sur 30 jours en scénario de crise). Le mot 'non grevés' est crucial : les actifs déjà donnés en garantie sont exclus.",
    source: "Dispositif prudentiel UMOA 2016, §582 - Titre XIII",
    tags: ['RLCT', 'calcul', 'HQLA']
  },

  // ═══════════════════════════════════════════════════════
  //  CATÉGORIE 3 : DIVISION DES RISQUES & GRANDS RISQUES
  // ═══════════════════════════════════════════════════════
  {
    id: 'UMOA-DR-001',
    category: 'Division des risques',
    difficulty: 1,
    xp: 50,
    question: "Quel est le coefficient maximum de division des risques imposé à un établissement UMOA sur un même client ou groupe de clients liés ?",
    options: ["10 % des fonds propres T1", "15 % des FPE", "25 % des fonds propres de base T1", "50 % du capital social"],
    correctIndex: 2,
    explanation: "Un établissement doit respecter un coefficient maximum de 25 %, défini comme le rapport entre les actifs pondérés sur un client (ou groupe de clients liés) et le T1. Au-delà, la Commission Bancaire peut accorder une dérogation exceptionnelle temporaire.",
    source: "Dispositif prudentiel UMOA 2016, §451 - Titre VIII",
    tags: ['division des risques', 'grand risque', 'T1']
  },
  {
    id: 'UMOA-DR-002',
    category: 'Division des risques',
    difficulty: 2,
    xp: 100,
    question: "Une exposition est qualifiée de « grand risque » lorsque les actifs pondérés sur un client (ou groupe lié) atteignent au moins :",
    options: ["5 % du T1", "10 % du T1", "15 % du CET1", "25 % des FPE"],
    correctIndex: 1,
    explanation: "Un grand risque représente un client ou groupe de clients liés dont la somme des APR au titre du risque de crédit atteint AU MOINS 10 % du T1. Ces expositions doivent être identifiées et déclarées séparément à la Commission Bancaire.",
    source: "Dispositif prudentiel UMOA 2016, §452 - Titre VIII",
    tags: ['grand risque', 'seuil', 'reporting']
  },
  {
    id: 'UMOA-DR-003',
    category: 'Division des risques',
    difficulty: 4,
    xp: 300,
    question: "Concernant l'interdiction de crédits aux personnes liées : à partir de quel seuil de détention en droits de vote (ou capital indirect via fonctions de direction) une personne est-elle visée ?",
    options: ["5 % des droits de vote", "10 % des droits de vote ou >25 % du capital social via fonctions exécutives", "20 % des droits de vote", "33 % des droits de vote"],
    correctIndex: 1,
    explanation: "Les personnes (physiques/morales) détenant ≥10 % des droits de vote dans la banque sont concernées. L'interdiction s'étend aussi aux crédits consentis aux entreprises où ces personnes exercent des fonctions de direction/administration/gérance OU détiennent >25 % du capital social.",
    source: "Dispositif prudentiel UMOA 2016, §494 - Titre VIII",
    tags: ['personnes liées', 'conflit intérêts', 'gouvernance']
  },

  // ═══════════════════════════════════════════════════════
  //  CATÉGORIE 4 : DÉFINITIONS & CHAMP D'APPLICATION
  // ═══════════════════════════════════════════════════════
  {
    id: 'UMOA-DEF-001',
    category: 'Définitions',
    difficulty: 1,
    xp: 50,
    question: "Qui est l'autorité de supervision de l'UMOA selon le dispositif prudentiel ?",
    options: ["La BCEAO directement", "Le Conseil des Ministres de l'UMOA", "La Commission Bancaire de l'UMOA", "Le CREPMF"],
    correctIndex: 2,
    explanation: "L'autorité de supervision de l'UMOA est la Commission Bancaire de l'UMOA. La BCEAO publie les instructions techniques, et le CREPMF supervise les marchés financiers, mais c'est bien la Commission Bancaire qui exerce la supervision prudentielle des établissements de crédit.",
    source: "Décision N°014/24/06/2016 CM/UMOA, Article 1(b)",
    tags: ['gouvernance', 'autorités', 'Commission Bancaire']
  },
  {
    id: 'UMOA-DEF-002',
    category: 'Définitions',
    difficulty: 3,
    xp: 200,
    question: "Selon la définition d'« activités à dominante bancaire », un groupe est qualifié comme tel si le rapport entre le total du bilan des entités du secteur financier et le total du bilan du groupe dépasse :",
    options: ["25 %", "33 %", "40 %", "50 %"],
    correctIndex: 2,
    explanation: "Un groupe a des activités à dominante bancaire si (i) les activités s'exercent principalement dans le secteur financier — le rapport bilan secteur financier / bilan groupe doit dépasser 40 % — ET (ii) le secteur bancaire pèse plus que les autres entités financières.",
    source: "Décision N°014/24/06/2016 CM/UMOA, Article 1(a)",
    tags: ['groupe bancaire', 'supervision consolidée', 'seuil']
  },
  {
    id: 'UMOA-DEF-003',
    category: 'Définitions',
    difficulty: 2,
    xp: 100,
    question: "Une « société affiliée » au sens du dispositif prudentiel UMOA est une société dont :",
    options: [
      "Plus de 50 % des actions sont détenues par une autre société",
      "Moins de 50 % des actions et droits de vote sont détenus par une autre société",
      "Exactement 25 % du capital est détenu par une autre société",
      "Plus de 10 % des actions ordinaires sont détenues sans contrôle"
    ],
    correctIndex: 1,
    explanation: "Une société affiliée est définie comme une société dont MOINS de 50 % des actions ET droits de vote sont détenus par une autre société. À l'inverse, au-delà de 50 %, on parle de contrôle exclusif de droit (filiale).",
    source: "Dispositif prudentiel UMOA 2016, §14(h) - Titre II",
    tags: ['affiliée', 'filiale', 'consolidation']
  },

  // ═══════════════════════════════════════════════════════
  //  CATÉGORIE 5 : PILIER 2 & 3 (SURVEILLANCE & TRANSPARENCE)
  // ═══════════════════════════════════════════════════════
  {
    id: 'UMOA-PIL-001',
    category: 'Piliers Bâle',
    difficulty: 2,
    xp: 100,
    question: "Le dispositif prudentiel UMOA 2016 s'appuie sur les trois piliers de Bâle. Quel pilier porte sur les exigences minimales de fonds propres ?",
    options: ["Pilier 1 (Titres I à X)", "Pilier 2 (Titre XI)", "Pilier 3 (Titre XII)", "Pilier 4 (Liquidité - Titre XIII)"],
    correctIndex: 0,
    explanation: "Le Pilier 1 (Titres I à X) couvre les exigences minimales de fonds propres pour les risques de crédit, opérationnel et de marché — incluant les normes connexes (division des risques, ratio de levier). Le Pilier 2 = surveillance prudentielle. Le Pilier 3 = discipline de marché / transparence.",
    source: "Dispositif prudentiel UMOA 2016, Introduction",
    tags: ['piliers', 'Bâle II', 'Bâle III', 'architecture']
  },
  {
    id: 'UMOA-PIL-002',
    category: 'Piliers Bâle',
    difficulty: 3,
    xp: 200,
    question: "Que désigne l'acronyme PIEAFP (ou ICAAP) dans le dispositif prudentiel UMOA ?",
    options: [
      "Plan d'Investissement des Établissements Agréés en Fonds Propres",
      "Processus Interne d'Évaluation de l'Adéquation des Fonds Propres",
      "Programme d'Inspection Externe et d'Audit des Fonds Propres",
      "Procédure d'Identification des Engagements à Forte Pondération"
    ],
    correctIndex: 1,
    explanation: "PIEAFP = Processus Interne d'Évaluation de l'Adéquation des Fonds Propres (Internal Capital Adequacy Assessment Process). C'est le processus que l'établissement met en place pour évaluer l'adéquation GLOBALE de ses fonds propres face à TOUS les risques (Pilier 1 + risques non couverts par le Pilier 1).",
    source: "Dispositif prudentiel UMOA 2016, §505(b) - Titre XI",
    tags: ['ICAAP', 'PIEAFP', 'Pilier 2', 'gouvernance risques']
  },
  {
    id: 'UMOA-PIL-003',
    category: 'Piliers Bâle',
    difficulty: 4,
    xp: 300,
    question: "Le PSPER (ou SREP) désigne :",
    options: [
      "Le programme statistique des engagements à risque",
      "Le processus interne d'évaluation des fonds propres par l'établissement lui-même",
      "Le processus de surveillance prudentielle et d'évaluation des risques mis en œuvre par la Commission Bancaire",
      "Le plan stratégique d'expansion et de répartition des risques"
    ],
    correctIndex: 2,
    explanation: "PSPER = Processus de Surveillance Prudentielle et d'Évaluation des Risques (Supervisory Review and Evaluation Process). C'est le processus mis en œuvre par la COMMISSION BANCAIRE pour examiner et évaluer le PIEAFP de chaque établissement, ainsi que la solidité de sa gouvernance et de son contrôle interne.",
    source: "Dispositif prudentiel UMOA 2016, §505(c) - Titre XI",
    tags: ['SREP', 'PSPER', 'supervision', 'Pilier 2']
  },

  // ═══════════════════════════════════════════════════════
  //  CATÉGORIE 6 : RATIO DE LEVIER & TRANSITION
  // ═══════════════════════════════════════════════════════
  {
    id: 'UMOA-LEV-001',
    category: 'Ratio de levier',
    difficulty: 1,
    xp: 50,
    question: "Quel est le ratio de levier minimum applicable aux établissements de crédit UMOA ?",
    options: ["1 %", "3 %", "5 %", "9 %"],
    correctIndex: 1,
    explanation: "Le ratio de levier minimum est fixé à 3 %, conformément aux dispositions transitoires de 2018-2022. Ce ratio (T1 / Exposition totale non pondérée) sert de filet de sécurité simple face aux ratios pondérés sophistiqués.",
    source: "Dispositif prudentiel UMOA 2016, Tableau 22 - Titre X",
    tags: ['ratio levier', 'Bâle III', 'backstop']
  },
  {
    id: 'UMOA-LEV-002',
    category: 'Ratio de levier',
    difficulty: 3,
    xp: 200,
    question: "Selon les dispositions transitoires UMOA, en quelle année le ratio minimal de solvabilité avec coussin de conservation a atteint sa cible finale de 11,5 % ?",
    options: ["2018", "2020", "2021", "2022"],
    correctIndex: 3,
    explanation: "Le tableau de transition prévoit une montée progressive : 8,625 % en 2018 → 9,5 % en 2019 → 10,375 % en 2020 → 11,25 % en 2021 → 11,5 % en 2022 (cible finale). Le coussin de conservation seul passe de 0,625 % en 2018 à 2,5 % en 2022.",
    source: "Dispositif prudentiel UMOA 2016, Tableau 22 - §496",
    tags: ['transition', 'phasing', 'Bâle III', '2022']
  },

  // ═══════════════════════════════════════════════════════
  //  CATÉGORIE 7 : APR & PONDÉRATION
  // ═══════════════════════════════════════════════════════
  {
    id: 'UMOA-APR-001',
    category: 'APR & Pondération',
    difficulty: 4,
    xp: 300,
    question: "Pour le calcul du ratio de solvabilité, les APR résultant des risques opérationnel et de marché représentent quel multiple des exigences de fonds propres correspondantes ?",
    options: ["8 fois", "10 fois", "12,5 fois", "20 fois"],
    correctIndex: 2,
    explanation: "Les APR de risque opérationnel et de marché représentent 12,5 fois les exigences de fonds propres correspondantes. Cela vient du fait que 1/8 % = 12,5 (l'ancien ratio minimum de 8 % de Bâle I sert de pivot mathématique). Le dénominateur du ratio de solvabilité = APR crédit + (12,5 × Risque opérationnel) + (12,5 × Risque marché).",
    source: "Dispositif prudentiel UMOA 2016, §89 - Titre III",
    tags: ['APR', 'calcul', 'pondération', 'risque marché', 'risque opérationnel']
  }
];

// ═══════════════════════════════════════════════════════════
//  HELPERS pour le module quiz
// ═══════════════════════════════════════════════════════════

window.QuizDataHelpers = {

  /** Filtre par catégorie */
  byCategory(cat) {
    return window.QUIZ_BANK.filter(q => q.category === cat);
  },

  /** Filtre par niveau de difficulté (1 à 5) */
  byDifficulty(min, max = min) {
    return window.QUIZ_BANK.filter(q => q.difficulty >= min && q.difficulty <= max);
  },

  /** Liste des catégories disponibles */
  categories() {
    return [...new Set(window.QUIZ_BANK.map(q => q.category))];
  },

  /** Tirage aléatoire de N questions adaptées au niveau du joueur */
  randomSet(count = 10, playerLevel = 1) {
    // Adapter la difficulté au niveau joueur : Lvl 1-3 = diff 1-2, Lvl 4-6 = diff 2-3, etc.
    const minDiff = Math.max(1, Math.floor(playerLevel / 3));
    const maxDiff = Math.min(5, Math.ceil(playerLevel / 2) + 1);
    const pool = this.byDifficulty(minDiff, maxDiff);
    const sourcePool = pool.length >= count ? pool : window.QUIZ_BANK;

    // Mélange Fisher-Yates puis on prend les N premières
    const shuffled = [...sourcePool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },

  /** Statistiques rapides sur la banque */
  stats() {
    const cats = this.categories();
    const byCat = cats.map(c => ({
      category: c,
      count: this.byCategory(c).length,
      avgXp: Math.round(this.byCategory(c).reduce((s, q) => s + q.xp, 0) / this.byCategory(c).length)
    }));
    return {
      total: window.QUIZ_BANK.length,
      categories: byCat,
      totalXpAvailable: window.QUIZ_BANK.reduce((s, q) => s + q.xp, 0)
    };
  }
};

console.log('[Regul Arena] Banque de questions chargée :', window.QuizDataHelpers.stats());
