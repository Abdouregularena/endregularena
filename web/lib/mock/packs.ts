export type Pack = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  zone: "UEMOA" | "CEMAC" | "Transverse";
  questions: number;
  duration: string;
  level: "Débutant" | "Intermédiaire" | "Avancé";
  color: "violet" | "blue" | "emerald" | "amber" | "rose" | "cyan";
  themes: string[];
};

export const PACKS: Pack[] = [
  {
    slug: "rfe-uemoa",
    title: "RFE UEMOA",
    subtitle: "Relations financières extérieures",
    description:
      "Le règlement 06/2024 CM/UEMOA remplace le 09/2010. Maîtrisez opérations courantes et capitaux, résident vs non-résident, autorisations BCEAO.",
    zone: "UEMOA",
    questions: 120,
    duration: "45 min",
    level: "Intermédiaire",
    color: "violet",
    themes: [
      "Opérations courantes",
      "Capitaux",
      "Investissement direct",
      "Change manuel",
    ],
  },
  {
    slug: "bale-prudentiel",
    title: "Bâle & Prudentiel",
    subtitle: "Dispositif prudentiel UMOA",
    description:
      "Décisions 013 et 014 de 2016. Fonds propres, ratio de solvabilité, liquidité LCR/NSFR, supervision consolidée.",
    zone: "UEMOA",
    questions: 145,
    duration: "50 min",
    level: "Avancé",
    color: "blue",
    themes: ["Fonds propres", "Ratio de solvabilité", "LCR / NSFR", "Grands risques"],
  },
  {
    slug: "cemac-cobac",
    title: "CEMAC / COBAC",
    subtitle: "Régulation zone CEMAC",
    description:
      "Règlements COBAC, régime de change de la CEMAC, obligations déclaratives BEAC, spécificités par pays.",
    zone: "CEMAC",
    questions: 98,
    duration: "40 min",
    level: "Intermédiaire",
    color: "emerald",
    themes: ["COBAC", "BEAC", "Change CEMAC", "Contrôle interne"],
  },
  {
    slug: "nouveaux-textes",
    title: "Nouveaux textes 2024-2026",
    subtitle: "Actualité réglementaire",
    description:
      "RFE 2024, cadre SFD révisé, monnaie électronique, marché financier régional. Restez à jour sur les 24 derniers mois.",
    zone: "Transverse",
    questions: 100,
    duration: "40 min",
    level: "Intermédiaire",
    color: "amber",
    themes: ["RFE 2024", "SFD", "Monnaie électronique", "Marché financier"],
  },
  {
    slug: "lbc-ft",
    title: "LBC-FT",
    subtitle: "Lutte anti-blanchiment",
    description:
      "GAFI, obligations de vigilance, PEP, filtrage sanctions, déclaration de soupçon CENTIF.",
    zone: "Transverse",
    questions: 85,
    duration: "35 min",
    level: "Débutant",
    color: "rose",
    themes: ["GAFI", "KYC", "Sanctions", "CENTIF"],
  },
  {
    slug: "sysco-comptable",
    title: "Plan comptable bancaire",
    subtitle: "PCB révisé UMOA",
    description:
      "Classes du PCB, opérations courantes, provisionnement, états DEC réglementaires.",
    zone: "UEMOA",
    questions: 110,
    duration: "45 min",
    level: "Avancé",
    color: "cyan",
    themes: ["Classes PCB", "Provisions", "États DEC", "Consolidation"],
  },
];
