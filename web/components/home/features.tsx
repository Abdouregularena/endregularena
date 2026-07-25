import { BookOpen, Swords, Trophy, MessagesSquare, Award, Radar } from "lucide-react";

const FEATURES = [
  {
    icon: BookOpen,
    color: "from-blue-500 to-sky-500",
    title: "Quiz par thématique",
    desc: "6 packs qui couvrent RFE, prudentiel Bâle, CEMAC/COBAC, LBC-FT, monnaie électronique et plan comptable bancaire.",
    tags: ["650+ questions", "3 niveaux", "Sources citées"],
  },
  {
    icon: Swords,
    color: "from-violet-500 to-fuchsia-500",
    title: "Duels PvP en direct",
    desc: "Défie un collègue ou un joueur aléatoire. Questions figées côté serveur pour un jeu équitable, chrono par manche.",
    tags: ["1v1 temps réel", "Anti-triche", "10 manches"],
  },
  {
    icon: Trophy,
    color: "from-amber-500 to-orange-500",
    title: "Tournois à bracket",
    desc: "Championnats mensuels par zone (UEMOA, CEMAC) ou panafricains. Certificats officiels pour les finalistes.",
    tags: ["32 à 64 joueurs", "Bracket auto", "Prix"],
  },
  {
    icon: MessagesSquare,
    color: "from-emerald-500 to-teal-500",
    title: "Débats à jury",
    desc: "Questions ouvertes soumises par la communauté, réponses argumentées, vote pondéré et modération par experts.",
    tags: ["Vote pondéré", "Modération", "Argumentation"],
  },
  {
    icon: Radar,
    color: "from-rose-500 to-pink-500",
    title: "Analyse forces & faiblesses",
    desc: "Ton profil identifie tes thèmes maîtrisés et ceux à retravailler, pour cibler ton temps de révision efficacement.",
    tags: ["Par thème", "Progression", "Suggestions"],
  },
  {
    icon: Award,
    color: "from-cyan-500 to-teal-500",
    title: "Certificats PDF",
    desc: "Chaque tournoi remporté ou pack complété à 80 % débloque un certificat téléchargeable, référencé QR.",
    tags: ["PDF signé", "QR de vérification", "LinkedIn"],
  },
];

export function Features() {
  return (
    <section id="fonctionnalites" className="py-20 lg:py-28">
      <div className="container-app">
        <div className="mx-auto max-w-2xl text-center">
          <span className="badge">Une plateforme, six leviers</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            La formation réglementaire, mais en mieux
          </h2>
          <p className="mt-4 text-muted-foreground">
            Regul Arena remplace les fiches PDF et les journées de séminaire par
            une routine courte, ludique et mesurable, adaptée aux emplois du temps
            chargés des professionnels de la banque.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-surface">
              <div
                className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-lg`}
              >
                <f.icon className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {f.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
