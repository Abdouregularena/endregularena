import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Trophy, Calendar, Users, Award, ArrowRight, BookOpen } from "lucide-react";
import { TOURNAMENTS } from "@/lib/mock/tournois";
import { getTournamentDetail } from "@/lib/mock/tournament-detail";
import { Bracket } from "@/components/tournois/bracket";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return TOURNAMENTS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const t = getTournamentDetail(id);
  if (!t) return { title: "Tournoi introuvable" };
  return { title: t.name, description: t.description };
}

const STATUS_LABEL = {
  inscriptions: { text: "Inscriptions ouvertes", cls: "bg-success/10 text-success border-success/20" },
  "en-cours": { text: "En cours", cls: "bg-primary/10 text-primary border-primary/20" },
  termine: { text: "Terminé", cls: "bg-muted text-muted-foreground border-border" },
} as const;

export default async function TournamentDetailPage({ params }: Props) {
  const { id } = await params;
  const t = getTournamentDetail(id);
  if (!t) notFound();

  const s = STATUS_LABEL[t.status];
  const pct = (t.participants / t.maxParticipants) * 100;

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-muted/30 py-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-20 left-1/2 h-72 w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="container-app">
          <Link href="/tournois" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Tous les tournois
          </Link>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl">
                  <Trophy className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <div>
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", s.cls)}>
                    {s.text}
                  </span>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                    {t.name}
                  </h1>
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-primary">
                {t.pack} - Zone {t.zone} - Format {t.format}
              </p>
            </div>

            {t.status === "inscriptions" && (
              <button className="btn-primary">
                S'inscrire au tournoi <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="container-app py-10">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="card-surface">
              <h2 className="text-lg font-semibold">
                Bracket - <span className="text-primary">{t.currentPhase}</span>
              </h2>
              <div className="mt-6">
                <Bracket matches={t.bracket} />
              </div>
            </div>

            <div className="card-surface">
              <h2 className="text-lg font-semibold">Règles du tournoi</h2>
              <p className="mt-3 text-sm text-muted-foreground">{t.description}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {t.rules.map((r) => (
                  <li key={r} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-surface">
              <h2 className="text-lg font-semibold">Participants</h2>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t.participants} inscrits</span>
                  <span>{t.maxParticipants} places</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> Complet à {Math.round(pct)}%
              </p>
            </div>

            <div className="card-surface">
              <h2 className="text-lg font-semibold">Calendrier</h2>
              <ul className="mt-4 space-y-3">
                {t.schedule.map((p) => (
                  <li key={p.phase} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-primary" /> {p.phase}
                    </span>
                    <span className="text-xs text-muted-foreground">{p.date}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-center gap-2 text-primary">
                <Award className="h-5 w-5" />
                <p className="text-sm font-semibold">Récompense</p>
              </div>
              <p className="mt-2 text-sm">{t.prize}</p>
            </div>

            <Link href={`/quiz/${t.pack.toLowerCase().replace(/[^a-z]/g, "-").replace(/-+/g, "-")}`} className="btn-ghost w-full !py-2.5">
              <BookOpen className="h-4 w-4" /> Réviser le pack
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
