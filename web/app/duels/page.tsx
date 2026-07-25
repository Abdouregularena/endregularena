import type { Metadata } from "next";
import Link from "next/link";
import { Radio, Clock, Trophy, Swords } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DUELS } from "@/lib/mock/duels";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Duels",
  description: "Duels PvP en direct sur la régulation bancaire UEMOA et CEMAC.",
};

const STATUS = {
  live: {
    label: "En direct",
    icon: Radio,
    className: "bg-danger/10 text-danger border-danger/20",
    dot: "bg-danger animate-pulse",
  },
  "en-attente": {
    label: "En attente",
    icon: Clock,
    className: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
  },
  termine: {
    label: "Terminé",
    icon: Trophy,
    className: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
};

export default function DuelsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Duels"
        title="Duels PvP en direct"
        subtitle="Suis les duels en cours, rejoins une partie en attente ou lance ton propre défi."
      />
      <section className="container-app py-12">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {["Tous", "En direct", "En attente", "Terminés"].map((f, i) => (
              <button
                key={f}
                className={cn(
                  "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition",
                  i === 0
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <Link href="#" className="btn-primary !py-2 !px-5">
            <Swords className="h-4 w-4" />
            Lancer un défi
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {DUELS.map((d) => {
            const s = STATUS[d.status];
            return (
              <Link
                key={d.id}
                href={`/duels/${d.id}`}
                className="card-surface hover:-translate-y-0.5 hover:border-primary/40"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                        s.className
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                      {s.label}
                    </span>
                    <p className="mt-3 text-sm font-medium text-primary">{d.pack}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{d.updatedAt}</span>
                </div>

                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  {d.players.map((p, i) => (
                    <div key={i} className={cn("text-center", i === 2 && "hidden")}>
                      <p className="text-2xl">{p.countryFlag}</p>
                      <p className="mt-1 text-sm font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.country}</p>
                      <p className="mt-2 text-3xl font-bold text-primary">{p.score}</p>
                    </div>
                  ))}
                  {d.players.length === 2 && (
                    <>
                      <div className="text-center">
                        <p className="text-2xl">{d.players[0].countryFlag}</p>
                        <p className="mt-1 text-sm font-semibold">{d.players[0].name}</p>
                        <p className="text-xs text-muted-foreground">{d.players[0].country}</p>
                        <p className="mt-2 text-3xl font-bold text-primary">{d.players[0].score}</p>
                      </div>
                      <span className="text-xs font-semibold uppercase text-muted-foreground">
                        VS
                      </span>
                      <div className="text-center">
                        <p className="text-2xl">{d.players[1].countryFlag}</p>
                        <p className="mt-1 text-sm font-semibold">{d.players[1].name}</p>
                        <p className="text-xs text-muted-foreground">{d.players[1].country}</p>
                        <p className="mt-2 text-3xl font-bold text-primary">{d.players[1].score}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-5 border-t border-border pt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Manche {d.round} / {d.totalRounds}</span>
                    <span>{Math.round((d.round / d.totalRounds) * 100)}%</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(d.round / d.totalRounds) * 100}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
