import type { Metadata } from "next";
import { Trophy, Medal } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LEADERBOARD } from "@/lib/mock/leaderboard";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Classement",
  description: "Top des joueurs Regul Arena par score, duels et tournois remportés.",
};

const BADGE_STYLES: Record<string, string> = {
  or: "from-amber-400 to-yellow-500",
  argent: "from-slate-300 to-slate-400",
  bronze: "from-orange-400 to-amber-600",
};

export default function ClassementPage() {
  const [first, second, third, ...rest] = LEADERBOARD;
  return (
    <>
      <PageHeader
        eyebrow="Classement"
        title="Top joueurs Regul Arena"
        subtitle="Classement global toutes zones confondues, mis à jour en continu."
      />
      <section className="container-app py-12">
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {[second, first, third].map((p, i) => {
            const isFirst = i === 1;
            return (
              <div
                key={p.name}
                className={cn(
                  "card-surface text-center",
                  isFirst && "sm:-translate-y-4 border-primary/40 shadow-xl"
                )}
              >
                <div
                  className={cn(
                    "mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br text-white shadow-lg",
                    BADGE_STYLES[p.badge!]
                  )}
                >
                  <Trophy className="h-6 w-6" />
                </div>
                <p className="mt-4 text-2xl">{p.countryFlag}</p>
                <h3 className="mt-1 text-lg font-bold">{p.name}</h3>
                <p className="text-xs text-muted-foreground">{p.org} - {p.role}</p>
                <p className="mt-4 text-3xl font-bold text-primary">{p.score.toLocaleString("fr-FR")}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">points</p>
              </div>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 sm:px-6">#</th>
                <th className="px-4 py-3 sm:px-6">Joueur</th>
                <th className="hidden px-6 py-3 md:table-cell">Organisation</th>
                <th className="hidden px-6 py-3 lg:table-cell">Duels</th>
                <th className="hidden px-6 py-3 lg:table-cell">Tournois</th>
                <th className="px-4 py-3 text-right sm:px-6">Score</th>
              </tr>
            </thead>
            <tbody>
              {rest.map((p) => (
                <tr key={p.rank} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-4 font-semibold text-muted-foreground sm:px-6">
                    {p.rank}
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.countryFlag}</span>
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-6 py-4 text-muted-foreground md:table-cell">
                    {p.org}
                  </td>
                  <td className="hidden px-6 py-4 lg:table-cell">
                    <span className="inline-flex items-center gap-1">
                      <Medal className="h-3.5 w-3.5 text-primary" /> {p.duelsWon}
                    </span>
                  </td>
                  <td className="hidden px-6 py-4 lg:table-cell">
                    <span className="inline-flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5 text-warning" /> {p.tournamentsWon}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-primary sm:px-6">
                    {p.score.toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
