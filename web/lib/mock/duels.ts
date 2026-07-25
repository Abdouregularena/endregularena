export type Duel = {
  id: string;
  status: "live" | "en-attente" | "termine";
  pack: string;
  packSlug: string;
  players: {
    name: string;
    score: number;
    country: string;
    countryFlag: string;
  }[];
  round: number;
  totalRounds: number;
  updatedAt: string;
};

export const DUELS: Duel[] = [
  {
    id: "duel-1024",
    status: "live",
    pack: "RFE UEMOA",
    packSlug: "rfe-uemoa",
    players: [
      { name: "Aminata D.", score: 7, country: "Sénégal", countryFlag: "🇸🇳" },
      { name: "Kouassi K.", score: 6, country: "Côte d'Ivoire", countryFlag: "🇨🇮" },
    ],
    round: 8,
    totalRounds: 10,
    updatedAt: "à l'instant",
  },
  {
    id: "duel-1025",
    status: "live",
    pack: "Bâle & Prudentiel",
    packSlug: "bale-prudentiel",
    players: [
      { name: "Fatoumata B.", score: 5, country: "Mali", countryFlag: "🇲🇱" },
      { name: "Paul M.", score: 5, country: "Cameroun", countryFlag: "🇨🇲" },
    ],
    round: 7,
    totalRounds: 10,
    updatedAt: "il y a 30s",
  },
  {
    id: "duel-1023",
    status: "en-attente",
    pack: "CEMAC / COBAC",
    packSlug: "cemac-cobac",
    players: [
      { name: "Serge O.", score: 0, country: "Guinée équatoriale", countryFlag: "🇬🇶" },
      { name: "En attente…", score: 0, country: "", countryFlag: "❔" },
    ],
    round: 0,
    totalRounds: 10,
    updatedAt: "il y a 2 min",
  },
  {
    id: "duel-1020",
    status: "termine",
    pack: "LBC-FT",
    packSlug: "lbc-ft",
    players: [
      { name: "Nadia M.", score: 9, country: "Togo", countryFlag: "🇹🇬" },
      { name: "Ibrahim D.", score: 6, country: "Bénin", countryFlag: "🇧🇯" },
    ],
    round: 10,
    totalRounds: 10,
    updatedAt: "il y a 15 min",
  },
];
