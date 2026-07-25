export type LeaderboardEntry = {
  rank: number;
  name: string;
  country: string;
  countryFlag: string;
  org: string;
  role: string;
  score: number;
  duelsWon: number;
  tournamentsWon: number;
  badge?: "or" | "argent" | "bronze";
};

export const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Aminata Diop", country: "Sénégal", countryFlag: "🇸🇳", org: "BCEAO", role: "Régulateur", score: 12480, duelsWon: 42, tournamentsWon: 5, badge: "or" },
  { rank: 2, name: "Kouassi Konan", country: "Côte d'Ivoire", countryFlag: "🇨🇮", org: "SGBCI", role: "Conformité", score: 11720, duelsWon: 39, tournamentsWon: 4, badge: "argent" },
  { rank: 3, name: "Fatoumata Bah", country: "Mali", countryFlag: "🇲🇱", org: "Ecobank", role: "Trade Finance", score: 10890, duelsWon: 35, tournamentsWon: 3, badge: "bronze" },
  { rank: 4, name: "Jean-Marc Nkurunziza", country: "Gabon", countryFlag: "🇬🇦", org: "BEAC", role: "Régulateur", score: 10240, duelsWon: 32, tournamentsWon: 2 },
  { rank: 5, name: "Awa Sow", country: "Sénégal", countryFlag: "🇸🇳", org: "UBA", role: "Audit interne", score: 9880, duelsWon: 30, tournamentsWon: 2 },
  { rank: 6, name: "Paul Mbeki", country: "Cameroun", countryFlag: "🇨🇲", org: "Afriland First Bank", role: "Crédit", score: 9450, duelsWon: 28, tournamentsWon: 1 },
  { rank: 7, name: "Aïcha Traoré", country: "Burkina Faso", countryFlag: "🇧🇫", org: "Coris Bank", role: "Conformité", score: 8990, duelsWon: 26, tournamentsWon: 1 },
  { rank: 8, name: "Serge Ondo", country: "Guinée équatoriale", countryFlag: "🇬🇶", org: "BGFI Bank", role: "Comptabilité", score: 8640, duelsWon: 24, tournamentsWon: 1 },
  { rank: 9, name: "Nadia Mensah", country: "Togo", countryFlag: "🇹🇬", org: "Orabank", role: "Étudiante finance", score: 8210, duelsWon: 22, tournamentsWon: 0 },
  { rank: 10, name: "Ibrahim Diarra", country: "Bénin", countryFlag: "🇧🇯", org: "BOA", role: "Formateur", score: 7980, duelsWon: 21, tournamentsWon: 0 },
];
