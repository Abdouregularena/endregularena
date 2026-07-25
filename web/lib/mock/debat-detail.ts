import { DEBATS } from "./debats";

export type DebatAnswer = {
  id: string;
  author: string;
  authorRole: string;
  authorCountry: string;
  countryFlag: string;
  text: string;
  votes: number;
  createdAt: string;
  isJury: boolean;
};

export type DebatDetail = (typeof DEBATS)[number] & {
  context: string;
  sources: string[];
  answersList: DebatAnswer[];
  verdict?: { text: string; author: string; role: string; date: string };
};

const BASE_ANSWERS: DebatAnswer[] = [
  {
    id: "a1",
    author: "Kouassi Konan",
    authorRole: "Conformité - SGBCI",
    authorCountry: "Côte d'Ivoire",
    countryFlag: "🇨🇮",
    text: "Le nouveau règlement conserve la logique du 09/2010 sur le change manuel pour les résidents : les opérations restent libres jusqu'à un seuil déclaré. Ce qui change vraiment, c'est le renforcement des obligations documentaires et la traçabilité digitale.",
    votes: 42,
    createdAt: "il y a 2 h",
    isJury: false,
  },
  {
    id: "a2",
    author: "Fatoumata Bah",
    authorRole: "Trade Finance - Ecobank",
    authorCountry: "Mali",
    countryFlag: "🇲🇱",
    text: "Sur le terrain, la différence perceptible pour un client résident est nulle en pratique courante. Les banques appliquent déjà les diligences renforcées depuis 2019 via la circulaire BCEAO 003.",
    votes: 27,
    createdAt: "il y a 1 h",
    isJury: false,
  },
  {
    id: "a3",
    author: "Jean-Marc Nkurunziza",
    authorRole: "Régulateur - BEAC",
    authorCountry: "Gabon",
    countryFlag: "🇬🇦",
    text: "Attention à distinguer résident au sens fiscal (centre des intérêts économiques) et résident au sens du RFE (concept juridique dédié). Sur ce dernier, le 06/2024 clarifie les cas des étrangers ayant acquis le statut, ce qui est nouveau.",
    votes: 68,
    createdAt: "il y a 30 min",
    isJury: true,
  },
];

export function getDebatDetail(id: string): DebatDetail | null {
  const base = DEBATS.find((d) => d.id === id);
  if (!base) return null;
  return {
    ...base,
    context:
      "Cette question a été posée dans le cadre d'un débat structurant sur les évolutions apportées par le règlement 06/2024/CM/UEMOA, comparées au régime précédent (09/2010).",
    sources: [
      "Règlement 06/2024/CM/UEMOA, titre II",
      "Règlement 09/2010/CM/UEMOA, chapitre 3",
      "Circulaire BCEAO 003-06/2019 relative aux diligences renforcées",
    ],
    answersList: BASE_ANSWERS,
    verdict:
      base.status === "clos"
        ? {
            text: "Après examen des arguments, le jury retient qu'il existe une différence de forme (obligations documentaires renforcées) mais pas de bouleversement du régime applicable au change manuel des résidents. La qualification de la clientèle étrangère résidente est en revanche substantiellement clarifiée par le 06/2024.",
            author: "Comité RFE - Regul Arena",
            role: "Jury académique",
            date: "5 juillet 2026",
          }
        : undefined,
  };
}
