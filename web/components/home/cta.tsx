import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function CTA() {
  return (
    <section className="py-20 lg:py-24">
      <div className="container-app">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-[hsl(216,50%,9%)] px-6 py-14 text-white sm:px-12 lg:px-16">
          <div className="absolute inset-0 -z-0">
            <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary/40 blur-3xl" />
            <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
          </div>

          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
                Accès gratuit
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Prêt à mettre ta connaissance de la régulation à l'épreuve ?
              </h2>
              <p className="mt-4 max-w-xl text-white/70">
                Crée ton compte gratuit, choisis ton premier pack et défie tes
                collègues dès aujourd'hui. Aucune carte bancaire requise.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:-translate-y-0.5"
                >
                  Créer mon compte
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/quiz"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
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
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <span className="text-white/85">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
