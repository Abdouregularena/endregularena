import { DUELS } from "./duels";

export type DuelRound = {
  index: number;
  theme: string;
  question: string;
  correctChoice: string;
  playerAnswers: { player: number; choice: string; correct: boolean; timeMs: number }[];
};

export type DuelDetail = (typeof DUELS)[number] & {
  spectators: number;
  startedAt: string;
  rounds: DuelRound[];
  chat: { author: string; text: string; time: string; role: "player" | "spectator" }[];
};

const ROUNDS_LIVE_1024: DuelRound[] = [
  { index: 1, theme: "Opérations courantes", question: "Quel règlement UEMOA remplace le 09/2010 ?", correctChoice: "06/2024/CM/UEMOA", playerAnswers: [
    { player: 0, choice: "06/2024/CM/UEMOA", correct: true, timeMs: 4200 },
    { player: 1, choice: "06/2024/CM/UEMOA", correct: true, timeMs: 5100 },
  ]},
  { index: 2, theme: "Résident / Non-résident", question: "Un étranger vivant à Dakar depuis 3 ans est-il résident au sens du RFE ?", correctChoice: "Oui, si centre d'intérêt UEMOA", playerAnswers: [
    { player: 0, choice: "Oui, si centre d'intérêt UEMOA", correct: true, timeMs: 6800 },
    { player: 1, choice: "Oui, dès son arrivée", correct: false, timeMs: 4400 },
  ]},
  { index: 3, theme: "Capitaux", question: "Autorité qui valide les IDE au-dessus du seuil ?", correctChoice: "BCEAO + ministère des Finances", playerAnswers: [
    { player: 0, choice: "BCEAO + ministère des Finances", correct: true, timeMs: 3900 },
    { player: 1, choice: "BCEAO + ministère des Finances", correct: true, timeMs: 4200 },
  ]},
  { index: 4, theme: "Change manuel", question: "Seuil de déclaration change manuel pour un résident ?", correctChoice: "500 000 FCFA", playerAnswers: [
    { player: 0, choice: "500 000 FCFA", correct: true, timeMs: 5500 },
    { player: 1, choice: "1 000 000 FCFA", correct: false, timeMs: 4900 },
  ]},
  { index: 5, theme: "Investissement direct", question: "Une prise de participation à 12 % est-elle un IDE ?", correctChoice: "Oui", playerAnswers: [
    { player: 0, choice: "Oui", correct: true, timeMs: 3200 },
    { player: 1, choice: "Oui", correct: true, timeMs: 3800 },
  ]},
  { index: 6, theme: "Résident / Non-résident", question: "Un diplomate en poste à Dakar est-il résident ?", correctChoice: "Non", playerAnswers: [
    { player: 0, choice: "Non", correct: true, timeMs: 4800 },
    { player: 1, choice: "Non", correct: true, timeMs: 5100 },
  ]},
  { index: 7, theme: "Opérations courantes", question: "Le paiement d'une formation à l'étranger est-il libre ?", correctChoice: "Oui, opération courante", playerAnswers: [
    { player: 0, choice: "Oui, opération courante", correct: true, timeMs: 5900 },
    { player: 1, choice: "Non, autorisation BCEAO", correct: false, timeMs: 6100 },
  ]},
];

export function getDuelDetail(id: string): DuelDetail | null {
  const base = DUELS.find((d) => d.id === id);
  if (!base) return null;
  const rounds = id === "duel-1024" ? ROUNDS_LIVE_1024 : ROUNDS_LIVE_1024.slice(0, Math.min(base.round, 3));
  return {
    ...base,
    spectators: base.status === "live" ? 34 : base.status === "termine" ? 87 : 5,
    startedAt: base.status === "live" ? "il y a 5 min" : base.status === "termine" ? "il y a 20 min" : "en attente",
    rounds,
    chat: [
      { author: "Fatoumata B.", text: "Question 2 était piégeuse 👀", time: "il y a 3 min", role: "spectator" },
      { author: "Paul M.", text: "Aminata en très grande forme sur le RFE", time: "il y a 2 min", role: "spectator" },
      { author: "Kouassi K.", text: "Rematch après cette manche ?", time: "il y a 1 min", role: "player" },
    ],
  };
}
