export type Debat = {
  id: string;
  question: string;
  category: string;
  author: string;
  authorRole: string;
  createdAt: string;
  answers: number;
  votes: number;
  status: "ouvert" | "jury" | "clos";
};

export const DEBATS: Debat[] = [
  {
    id: "d-1",
    question:
      "Le passage du règlement 09/2010 au 06/2024 change-t-il vraiment le régime applicable au change manuel pour les résidents ?",
    category: "RFE UEMOA",
    author: "Aminata Diop",
    authorRole: "BCEAO",
    createdAt: "il y a 3 h",
    answers: 12,
    votes: 87,
    status: "ouvert",
  },
  {
    id: "d-2",
    question:
      "Comment la BCEAO articule-t-elle les coussins contracycliques avec le stress test annuel des banques d'importance systémique ?",
    category: "Prudentiel",
    author: "Kouassi Konan",
    authorRole: "SGBCI",
    createdAt: "il y a 1 j",
    answers: 8,
    votes: 54,
    status: "jury",
  },
  {
    id: "d-3",
    question:
      "Faut-il un cadre unifié UEMOA-CEMAC pour la supervision des Établissements de Monnaie Électronique ?",
    category: "Transverse",
    author: "Serge Ondo",
    authorRole: "BGFI Bank",
    createdAt: "il y a 2 j",
    answers: 21,
    votes: 132,
    status: "ouvert",
  },
  {
    id: "d-4",
    question:
      "Le seuil de déclaration CENTIF de 5 M FCFA est-il encore adapté au contexte digital de 2026 ?",
    category: "LBC-FT",
    author: "Nadia Mensah",
    authorRole: "Orabank",
    createdAt: "il y a 5 j",
    answers: 34,
    votes: 210,
    status: "clos",
  },
];
