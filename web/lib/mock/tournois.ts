export type Tournament = {
  id: string;
  name: string;
  zone: "UEMOA" | "CEMAC" | "Panafricain";
  status: "inscriptions" | "en-cours" | "termine";
  pack: string;
  participants: number;
  maxParticipants: number;
  startDate: string;
  prize: string;
  format: "1v1" | "3v3" | "solo";
};

export const TOURNAMENTS: Tournament[] = [
  {
    id: "t-1",
    name: "Championnat RFE 2026",
    zone: "UEMOA",
    status: "inscriptions",
    pack: "RFE UEMOA",
    participants: 47,
    maxParticipants: 64,
    startDate: "15 juil. 2026",
    prize: "Certificat officiel + 500 000 XOF",
    format: "1v1",
  },
  {
    id: "t-2",
    name: "Trophée Bâle & Prudentiel",
    zone: "UEMOA",
    status: "en-cours",
    pack: "Bâle & Prudentiel",
    participants: 32,
    maxParticipants: 32,
    startDate: "5 juil. 2026",
    prize: "Certificat + place à la conférence BCEAO",
    format: "1v1",
  },
  {
    id: "t-3",
    name: "Coupe COBAC",
    zone: "CEMAC",
    status: "inscriptions",
    pack: "CEMAC / COBAC",
    participants: 21,
    maxParticipants: 32,
    startDate: "22 juil. 2026",
    prize: "Certificat COBAC + badge platine",
    format: "1v1",
  },
  {
    id: "t-4",
    name: "LBC-FT Cup",
    zone: "Panafricain",
    status: "termine",
    pack: "LBC-FT",
    participants: 64,
    maxParticipants: 64,
    startDate: "10 juin 2026",
    prize: "Certificat + kit formateur",
    format: "1v1",
  },
];
