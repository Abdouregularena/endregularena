export type Question = {
  id: string;
  pack: string;
  theme: string;
  statement: string;
  choices: string[];
  correct: number;
  explanation: string;
  source: string;
  difficulty: 1 | 2 | 3;
};

export const QUESTIONS: Record<string, Question[]> = {
  "rfe-uemoa": [
    {
      id: "rfe-1",
      pack: "rfe-uemoa",
      theme: "Opérations courantes",
      statement:
        "Quel est le règlement qui régit désormais les relations financières extérieures des États membres de l'UEMOA ?",
      choices: [
        "Règlement 09/2010/CM/UEMOA",
        "Règlement 06/2024/CM/UEMOA",
        "Directive 04/2018/CM/UEMOA",
        "Instruction BCEAO 05/2022",
      ],
      correct: 1,
      explanation:
        "Le règlement 06/2024/CM/UEMOA remplace le règlement 09/2010 et actualise le dispositif applicable aux relations financières extérieures.",
      source: "Règlement 06/2024/CM/UEMOA, article 1",
      difficulty: 1,
    },
    {
      id: "rfe-2",
      pack: "rfe-uemoa",
      theme: "Résident / Non-résident",
      statement:
        "Un ressortissant étranger vivant et travaillant à Dakar depuis 3 ans est-il considéré comme résident au sens du RFE ?",
      choices: [
        "Non, jamais",
        "Oui, dès son arrivée",
        "Oui, à condition que son centre d'intérêt économique soit dans l'UEMOA",
        "Uniquement s'il détient la nationalité d'un État membre",
      ],
      correct: 2,
      explanation:
        "La qualité de résident dépend du centre des intérêts économiques et de la durée de séjour, pas de la nationalité.",
      source: "Règlement 06/2024, définitions",
      difficulty: 2,
    },
    {
      id: "rfe-3",
      pack: "rfe-uemoa",
      theme: "Capitaux",
      statement:
        "Quelle autorité valide les investissements directs étrangers supérieurs au seuil réglementaire ?",
      choices: [
        "Le ministère du Commerce du pays d'accueil",
        "La BCEAO en lien avec le ministère chargé des Finances",
        "La Commission de l'UEMOA seule",
        "Le trésor public du pays émetteur",
      ],
      correct: 1,
      explanation:
        "La BCEAO joue un rôle central dans le contrôle des opérations en capital, en coordination avec le ministère des Finances.",
      source: "Règlement 06/2024, titre III",
      difficulty: 2,
    },
  ],
  "bale-prudentiel": [
    {
      id: "bp-1",
      pack: "bale-prudentiel",
      theme: "Fonds propres",
      statement:
        "Quel est le ratio minimum de fonds propres CET1 exigé dans le dispositif prudentiel UMOA depuis 2018 ?",
      choices: ["4,5 %", "5,625 %", "7 %", "8 %"],
      correct: 2,
      explanation:
        "Le ratio CET1 minimum, coussin de conservation inclus, est fixé à 7 % au terme de la période de transition.",
      source: "Décision 013/24-06/2016 CM/UMOA",
      difficulty: 2,
    },
    {
      id: "bp-2",
      pack: "bale-prudentiel",
      theme: "Liquidité",
      statement:
        "Que mesure le ratio NSFR (Net Stable Funding Ratio) ?",
      choices: [
        "La liquidité disponible sur 30 jours",
        "La stabilité du financement sur un horizon d'un an",
        "Le rendement des fonds propres",
        "Le taux de créances douteuses",
      ],
      correct: 1,
      explanation:
        "Le NSFR mesure la couverture des besoins de financement stable sur 12 mois, complémentaire au LCR (30j).",
      source: "Bâle III, cadre liquidité",
      difficulty: 2,
    },
  ],
  "cemac-cobac": [
    {
      id: "cc-1",
      pack: "cemac-cobac",
      theme: "COBAC",
      statement:
        "Combien de pays composent la Communauté Économique et Monétaire de l'Afrique Centrale ?",
      choices: ["4", "5", "6", "8"],
      correct: 2,
      explanation:
        "La CEMAC réunit 6 pays : Cameroun, Centrafrique, Congo, Gabon, Guinée équatoriale, Tchad.",
      source: "Traité CEMAC",
      difficulty: 1,
    },
  ],
  "nouveaux-textes": [
    {
      id: "nt-1",
      pack: "nouveaux-textes",
      theme: "Monnaie électronique",
      statement:
        "Dans l'UEMOA, quel acteur est habilité à émettre de la monnaie électronique en dehors des banques ?",
      choices: [
        "Toute société commerciale",
        "Les Établissements de Monnaie Électronique (EME) agréés",
        "Les opérateurs télécoms sans agrément",
        "Uniquement La Poste",
      ],
      correct: 1,
      explanation:
        "Les EME agréés par la BCEAO peuvent émettre de la monnaie électronique, en plus des banques et SFD.",
      source: "Instruction 08-05-2015 BCEAO",
      difficulty: 1,
    },
  ],
  "lbc-ft": [
    {
      id: "lbc-1",
      pack: "lbc-ft",
      theme: "GAFI",
      statement: "Que signifie l'acronyme PEP en LBC-FT ?",
      choices: [
        "Petit Établissement de Paiement",
        "Personne Exposée Politiquement",
        "Programme d'Épargne Progressive",
        "Prêt à Éligibilité Prudentielle",
      ],
      correct: 1,
      explanation:
        "Une PEP est une Personne Exposée Politiquement, soumise à des mesures de vigilance renforcée.",
      source: "Recommandation GAFI 12",
      difficulty: 1,
    },
  ],
  "sysco-comptable": [
    {
      id: "sc-1",
      pack: "sysco-comptable",
      theme: "Classes PCB",
      statement: "Dans le PCB révisé UMOA, à quoi correspond la classe 2 ?",
      choices: [
        "Opérations avec la clientèle",
        "Opérations de trésorerie et interbancaires",
        "Immobilisations",
        "Comptes de produits",
      ],
      correct: 0,
      explanation:
        "La classe 2 du PCB regroupe les opérations avec la clientèle (crédits, dépôts).",
      source: "PCB révisé UMOA",
      difficulty: 2,
    },
  ],
};
