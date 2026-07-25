import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, Swords, MessagesSquare, TrendingUp, Award, Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PACKS } from "@/lib/mock/packs";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mon profil",
  description: "Ton profil Regul Arena : progression, forces et faiblesses, certificats.",
};

const MOCK_USER = {
  name: "Aminata Diop",
  country: "Sénégal",
  countryFlag: "🇸🇳",
  org: "BCEAO",
  role: "Régulateur",
  since: "Membre depuis mars 2026",
  score: 12480,
  rank: 1,
  duelsWon: 42,
  duelsTotal: 58,
  tournamentsWon: 5,
  certificates: 4,
};

const PROGRESS = [
  { theme: "RFE UEMOA", value: 92, questions: 110 },
  { theme: "Bâle & Prudentiel", value: 84, questions: 128 },
  { theme: "CEMAC / COBAC", value: 67, questions: 72 },
  { theme: "LBC-FT", value: 78, questions: 65 },
  { theme: "Monnaie électronique", value: 45, questions: 34 },
  { theme: "Plan comptable bancaire", value: 61, questions: 88 },
];

const CERTIFICATES = [
  { title: "RFE UEMOA - Expert", date: "12 juin 2026", pack: "rfe-uemoa" },
  { title: "Bâle & Prudentiel - Confirmé", date: "3 mai 2026", pack: "bale-prudentiel" },
  { title: "Trophée LBC-FT Cup", date: "20 juin 2026", pack: "lbc-ft" },
];

export default function ProfilPage() {
  return (
    <>
      <PageHeader
        eyebrow="Profil"
        title={MOCK_USER.name}
        subtitle={`${MOCK_USER.org} - ${MOCK_USER.role} - ${MOCK_USER.country}`}
      />
      <section className="container-app py-12">
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Trophy, label: "Rang global", value: `#${MOCK_USER.rank}`, color: "from-amber-400 to-orange-500" },
            { icon: TrendingUp, label: "Score total", value: MOCK_USER.score.toLocaleString("fr-FR"), color: "from-violet-500 to-fuchsia-500" },
            { icon: Swords, label: "Duels gagnés", value: `${MOCK_USER.duelsWon}/${MOCK_USER.duelsTotal}`, color: "from-blue-500 to-sky-500" },
            { icon: Award, label: "Certificats", value: MOCK_USER.certificates, color: "from-emerald-500 to-teal-500" },
          ].map((s) => (
            <div key={s.label} className="card-surface">
              <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg ${s.color}`}>
                <s.icon className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <p className="mt-4 text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="card-surface">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Progression par thème</h2>
                <Link href="/quiz" className="text-xs font-semibold text-primary hover:underline">
                  Continuer
                </Link>
              </div>
              <ul className="mt-6 space-y-4">
                {PROGRESS.map((p) => (
                  <li key={p.theme}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{p.theme}</span>
                      <span className="text-muted-foreground">{p.questions} questions - {p.value}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          p.value >= 80 ? "bg-success" : p.value >= 60 ? "bg-primary" : "bg-warning"
                        )}
                        style={{ width: `${p.value}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-surface">
              <h2 className="text-lg font-semibold">Suggestions</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Ton thème le plus fragile est <strong>Monnaie électronique (45%)</strong>.
                On te recommande de réviser ces packs pour progresser.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {PACKS.slice(3, 5).map((p) => (
                  <Link
                    key={p.slug}
                    href={`/quiz/${p.slug}`}
                    className="rounded-xl border border-border p-4 transition hover:border-primary/40 hover:bg-muted/40"
                  >
                    <p className="text-sm font-semibold">{p.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{p.questions} questions - {p.duration}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-surface">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Certificats</h2>
                <Award className="h-5 w-5 text-primary" />
              </div>
              <ul className="mt-4 space-y-3">
                {CERTIFICATES.map((c) => (
                  <li key={c.title} className="rounded-xl border border-border p-3">
                    <p className="text-sm font-semibold">{c.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Obtenu le {c.date}</p>
                    <button className="mt-2 text-xs font-semibold text-primary hover:underline">
                      Télécharger PDF
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-surface">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Activité récente</h2>
                <MessagesSquare className="h-5 w-5 text-primary" />
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-success" />
                  <div>
                    <p><strong>Duel remporté</strong> contre Kouassi K.</p>
                    <p className="text-xs text-muted-foreground">il y a 15 min</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <div>
                    <p><strong>Pack RFE UEMOA</strong> complété à 92%</p>
                    <p className="text-xs text-muted-foreground">hier</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-warning" />
                  <div>
                    <p><strong>Nouveau débat</strong> ouvert sur le RFE</p>
                    <p className="text-xs text-muted-foreground">il y a 3 j</p>
                  </div>
                </li>
              </ul>
            </div>

            <Link href="#" className="btn-ghost w-full !py-2.5">
              <Settings className="h-4 w-4" /> Paramètres du compte
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
