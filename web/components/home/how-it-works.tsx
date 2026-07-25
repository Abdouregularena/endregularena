import { UserPlus, Target, TrendingUp } from "lucide-react";

const STEPS = [
  {
    icon: UserPlus,
    step: "01",
    title: "Crée ton compte",
    desc: "En 30 secondes. Choisis ton pays, ton établissement et ton rôle (banquier, régulateur, étudiant, formateur).",
  },
  {
    icon: Target,
    step: "02",
    title: "Choisis ton pack",
    desc: "RFE, prudentiel, CEMAC, LBC-FT, PCB, nouveaux textes. Enchaine quiz solo, duels PvP ou tournois.",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "Progresse et te certifie",
    desc: "Ton profil affiche tes thèmes forts et faibles. Complète 80 % d'un pack pour débloquer ton certificat.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container-app">
        <div className="mx-auto max-w-2xl text-center">
          <span className="badge">En 3 étapes</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            De l'inscription au certificat en moins d'une semaine
          </h2>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3 lg:gap-8">
          {STEPS.map((s, i) => (
            <div key={s.step} className="relative card-surface">
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <span className="text-3xl font-bold text-primary/20">{s.step}</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <div className="absolute top-1/2 right-0 hidden h-px w-8 -translate-y-1/2 translate-x-full bg-gradient-to-r from-primary/40 to-transparent lg:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
