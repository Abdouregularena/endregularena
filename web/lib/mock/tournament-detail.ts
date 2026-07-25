import { TOURNAMENTS } from "./tournois";

export type BracketMatch = {
  id: string;
  round: "1/8" | "1/4" | "1/2" | "Finale";
  p1?: { name: string; countryFlag: string; score?: number };
  p2?: { name: string; countryFlag: string; score?: number };
  winner?: 0 | 1;
  status: "a-venir" | "en-cours" | "termine";
};

export type TournamentDetail = (typeof TOURNAMENTS)[number] & {
  description: string;
  rules: string[];
  schedule: { phase: string; date: string }[];
  bracket: BracketMatch[];
  currentPhase: string;
};

const BRACKET_T2: BracketMatch[] = [
  { id: "m1", round: "1/4", p1: { name: "Aminata D.", countryFlag: "🇸🇳", score: 9 }, p2: { name: "Paul M.", countryFlag: "🇨🇲", score: 6 }, winner: 0, status: "termine" },
  { id: "m2", round: "1/4", p1: { name: "Kouassi K.", countryFlag: "🇨🇮", score: 8 }, p2: { name: "Awa S.", countryFlag: "🇸🇳", score: 7 }, winner: 0, status: "termine" },
  { id: "m3", round: "1/4", p1: { name: "Fatoumata B.", countryFlag: "🇲🇱", score: 9 }, p2: { name: "Aïcha T.", countryFlag: "🇧🇫", score: 8 }, winner: 0, status: "termine" },
  { id: "m4", round: "1/4", p1: { name: "Jean-Marc N.", countryFlag: "🇬🇦", score: 7 }, p2: { name: "Serge O.", countryFlag: "🇬🇶", score: 9 }, winner: 1, status: "termine" },
  { id: "m5", round: "1/2", p1: { name: "Aminata D.", countryFlag: "🇸🇳", score: 7 }, p2: { name: "Kouassi K.", countryFlag: "🇨🇮", score: 6 }, status: "en-cours" },
  { id: "m6", round: "1/2", p1: { name: "Fatoumata B.", countryFlag: "🇲🇱" }, p2: { name: "Serge O.", countryFlag: "🇬🇶" }, status: "a-venir" },
  { id: "m7", round: "Finale", status: "a-venir" },
];

export function getTournamentDetail(id: string): TournamentDetail | null {
  const base = TOURNAMENTS.find((t) => t.id === id);
  if (!base) return null;
  return {
    ...base,
    description:
      "Championnat éliminatoire à match unique. Les questions sont tirées du pack officiel et figées côté serveur au démarrage de chaque match, pour un jeu 100 % équitable.",
    rules: [
      "10 questions par match, meilleur score l'emporte",
      "En cas d'égalité, mort subite sur 3 questions supplémentaires",
      "Un joueur qui abandonne avant la fin est déclaré perdant 0-10",
      "Les certificats sont émis dans les 48 h après la finale",
    ],
    schedule: [
      { phase: "Inscriptions", date: "1 - 5 juillet 2026" },
      { phase: "Quarts de finale", date: "6 juillet 2026" },
      { phase: "Demi-finales", date: "8 juillet 2026" },
      { phase: "Finale", date: "10 juillet 2026" },
    ],
    bracket: base.id === "t-2" ? BRACKET_T2 : BRACKET_T2.map((m) => ({ ...m, status: base.status === "termine" ? "termine" : "a-venir" })),
    currentPhase: base.status === "en-cours" ? "Demi-finales" : base.status === "inscriptions" ? "Inscriptions" : "Terminé",
  };
}
