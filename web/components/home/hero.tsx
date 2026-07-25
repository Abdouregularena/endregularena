import Link from "next/link";
import { ArrowRight, PlayCircle, Sparkles, Zap, Users, Trophy } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-40 right-0 h-[400px] w-[400px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="container-app grid gap-12 pt-14 pb-16 lg:grid-cols-2 lg:items-center lg:gap-16 lg:pt-24 lg:pb-24">
        <div className="animate-fade-in">
          <span className="badge">
            <Sparkles className="h-3.5 w-3.5" />
            Formation continue UEMOA & CEMAC
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Maîtrisez la <span className="hero-title">régulation bancaire</span> par le jeu
          </h1>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Quiz, duels en direct, tournois et débats à jury. Regul Arena transforme
            les textes prudentiels et le RFE en une expérience de progression concrète
            pour les banquiers, les régulateurs et les étudiants de la zone.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/quiz" className="btn-primary">
              Commencer un quiz
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/duels" className="btn-ghost">
              <PlayCircle className="h-4 w-4" />
              Voir un duel en direct
            </Link>
          </div>

          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-8">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Questions</dt>
              <dd className="mt-1 text-2xl font-bold">650+</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Pays couverts</dt>
              <dd className="mt-1 text-2xl font-bold">14</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Joueurs actifs</dt>
              <dd className="mt-1 text-2xl font-bold">2 400</dd>
            </div>
          </dl>
        </div>

        <div className="relative">
          <div className="relative rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-danger" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
              </div>
              <span className="rounded-full bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger">
                Duel en direct
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>🇸🇳</span> Aminata D.
                </div>
                <p className="mt-2 text-3xl font-bold">7</p>
                <p className="text-xs text-muted-foreground">BCEAO, régulateur</p>
              </div>
              <div className="rounded-2xl border-2 border-primary bg-primary/5 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>🇨🇮</span> Kouassi K.
                </div>
                <p className="mt-2 text-3xl font-bold text-primary">6</p>
                <p className="text-xs text-muted-foreground">SGBCI, conformité</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-muted/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Question 8 / 10 - RFE UEMOA
              </p>
              <p className="mt-2 text-sm font-medium">
                Un ressortissant étranger vivant depuis 3 ans à Dakar est-il résident au sens du RFE ?
              </p>
              <div className="mt-3 space-y-2">
                {["Non, jamais", "Oui, dès son arrivée", "Oui, si centre d'intérêt économique UEMOA"].map((c, i) => (
                  <div
                    key={c}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full border border-border text-[10px] font-semibold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {c}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3" /> 12 s</span>
                <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> 34 spectateurs</span>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 -right-6 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Trophée Bâle</p>
              <p className="text-xs text-muted-foreground">32 finalistes, en cours</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
