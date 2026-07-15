// Pack "Tournoi du Royaume" — thème fantasy original (noms non-IP, inspiré du genre, pas de HBO/GRRM)
// À insérer dans const QN=[ ... ]; avant la fermeture du tableau
// cat: "Royaume" permet de router ces questions vers un tournoi événementiel dédié

const QN_ROYAUME_AJOUT = [

  // NIVEAU 1 — Vrai/Faux (garde du royaume)
  {
    q: "Le Grand Régent du royaume peut prononcer seul le retrait d'agrément d'une Maison bancaire, sans consulter le Conseil des Sages.",
    choices: ["Vrai", "Faux"],
    answer: 1,
    expl: "C'est la Commission Bancaire de l'UMOA qui détient ce pouvoir disciplinaire, ou le Ministre des Finances sur avis conforme de la Commission.",
    source: "Convention régissant la Commission Bancaire de l'UMOA",
    cat: "Royaume"
  },
  {
    q: "Les Maisons de microfinance du royaume sont exemptées des règles de lutte contre le blanchiment car elles servent les petites gens.",
    choices: ["Vrai", "Faux"],
    answer: 1,
    expl: "Les SFD sont strictement assujettis au dispositif LBC/FT au même titre que les banques classiques.",
    source: "Loi uniforme LBC/FT/FP 2023",
    cat: "Royaume"
  },
  {
    q: "Une Maison ne peut accorder à un seul seigneur un prêt dépassant 25 % de ses fonds propres effectifs.",
    choices: ["Vrai", "Faux"],
    answer: 0,
    expl: "Ratio de division des risques : l'engagement global sur un même bénéficiaire est plafonné à 25 % des fonds propres effectifs.",
    source: "Dispositif prudentiel BCEAO",
    cat: "Royaume"
  },

  // NIVEAU 2 — Texte à trous
  {
    q: "Pour fonder une nouvelle Maison bancaire dans le royaume, le ______ minimum exigé est fixé à 20 milliards de FCFA.",
    choices: ["capital social", "fonds de réserve", "trésor de guerre", "impôt royal"],
    answer: 0,
    expl: "Le capital social minimum requis pour l'agrément d'une banque est de 20 milliards FCFA.",
    source: "Dispositif capital minimum BCEAO",
    cat: "Royaume"
  },
  {
    q: "Chaque Maison doit nommer un correspondant ______ pour lutter contre le blanchiment et le financement du terrorisme.",
    choices: ["LBC/FT", "diplomatique", "fiscal", "notarial"],
    answer: 0,
    expl: "Le correspondant LBC/FT est une obligation réglementaire pour chaque établissement assujetti.",
    source: "Loi uniforme LBC/FT/FP 2023",
    cat: "Royaume"
  },
  {
    q: "Le coût du crédit dans le royaume est plafonné par le taux d'______, au-delà duquel la Maison commet un crime financier.",
    choices: ["usure", "escompte", "change", "épargne"],
    answer: 0,
    expl: "Le taux d'usure est le plafond légal du coût du crédit ; le dépasser constitue une infraction.",
    source: "Réglementation sur l'usure UMOA",
    cat: "Royaume"
  },

  // NIVEAU 3 — Cas pratique
  {
    q: "Le seigneur d'une Maison en crise de liquidité utilise secrètement les dépôts à vue des paysans pour acheter des terres à très long terme, et refuse depuis 6 mois de recapitaliser malgré des fonds propres sous le minimum requis. Quelles infractions prudentielles majeures commet-il ?",
    choices: [
      "Rupture de la transformation (liquidité) et sous-capitalisation / défaut de gouvernance",
      "Simple erreur comptable sans gravité réglementaire",
      "Infraction fiscale uniquement",
      "Aucune infraction, décision de gestion discrétionnaire"
    ],
    answer: 0,
    expl: "Financer des emplois longs avec des ressources à très court terme viole les ratios de liquidité ; ne pas reconstituer les fonds propres viole le dispositif prudentiel et expose à un plan de redressement imposé par la Commission Bancaire.",
    source: "Dispositif prudentiel BCEAO — ratios de liquidité et fonds propres",
    cat: "Royaume"
  },

  // NIVEAU 4 — Énigmes
  {
    q: "Charade : mon premier est la 3e lettre de l'alphabet ; mon deuxième est une onomatopée pour demander le silence ; mon troisième est le contraire de la mort ; mon quatrième est la 1re lettre de l'alphabet. Mon tout est une institution ouest-africaine qui veille sur l'épargne.",
    choices: ["CREPMF", "BCEAO", "COBAC", "UMOA"],
    answer: 0,
    expl: "C (3e lettre) + Chut + Vie + A = CREPMF, Conseil Régional de l'Épargne Publique et des Marchés Financiers.",
    source: "Institutions régionales UEMOA",
    cat: "Royaume"
  },
  {
    q: "Avec les nombres 50, 10, 5, 2 et 1, obtenez le chiffre correspondant au ratio minimum de capital de base (Tier 1) exigé dans l'UMOA (Bâle II/III).",
    choices: ["8 → (50/10)+(5-2)", "8 → (50-10)/5", "8 → (10+5)-(2+1)", "8 → 50/(10-2-1)"],
    answer: 0,
    expl: "(50 / 10) + (5 - 2) = 5 + 3 = 8 %, le ratio Tier 1 minimum exigé.",
    source: "Bâle II/III — ratio de solvabilité UMOA",
    cat: "Royaume"
  }

];

if (typeof module !== 'undefined' && module.exports) module.exports = QN_ROYAUME_AJOUT;
