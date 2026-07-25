import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function CTA() {
  return (
    <section className="py-20 lg:py-24">
      <div className="container-app">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary via-primary to-accent px-6 py-14 text-primary-foreground sm:px-12 lg:px-16">
          <div className="absolute inset-0 -z-0 opacity-30">
            <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          </div>

          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Prêt à mettre ta connaissance de la régulation à l'épreuve ?
              </h2>
              <p className="mt-4 max-w-xl text-white/80">
                Crée ton compte gratuit, choisis ton premier pack et défie tes
                collègues dès aujourd'hui. Aucune carte bancaire requise.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary shadow-lg transition hover:-translate-y-0.5"
                >
                  Créer mon compte
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/quiz"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Découvrir les quiz
                </Link>
              </div>
            </div>

            <ul className="grid gap-3 text-sm">
              {[
                "Accès immédiat aux 6 packs de questions",
                "Duels PvP et tournois inclus",
                "Certificats officiels au format PDF",
                "Analyse personnalisée forces / faiblesses",
                "Zones UEMOA et CEMAC couvertes",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-white" />
                  <span className="text-white/90">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
