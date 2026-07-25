import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Radio, Trophy, Users, MessagesSquare, CheckCircle2, XCircle, Timer, Swords } from "lucide-react";
import { DUELS } from "@/lib/mock/duels";
import { getDuelDetail } from "@/lib/mock/duel-detail";
import { ChatForm } from "@/components/duels/chat-form";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return DUELS.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const d = getDuelDetail(id);
  if (!d) return { title: "Duel introuvable" };
  return {
    title: `Duel ${d.players[0]?.name} vs ${d.players[1]?.name}`,
    description: `Duel ${d.pack} - ${d.round}/${d.totalRounds}`,
  };
}

const STATUS_LABEL = {
  live: { text: "En direct", cls: "bg-danger/10 text-danger border-danger/20", dot: "bg-danger animate-pulse" },
  "en-attente": { text: "En attente d'un joueur", cls: "bg-warning/10 text-warning border-warning/20", dot: "bg-warning" },
  termine: { text: "Terminé", cls: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
} as const;

export default async function DuelDetailPage({ params }: Props) {
  const { id } = await params;
  const d = getDuelDetail(id);
  if (!d) notFound();

  const s = STATUS_LABEL[d.status];
  const [p1, p2] = d.players;
  const leader = p1.score === p2.score ? null : p1.score > p2.score ? 0 : 1;

  return (
    <section className="container-app py-10">
      <Link href="/duels" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour aux duels
      </Link>

      <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-lg sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium", s.cls)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
            {s.text}
          </span>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {d.spectators} spectateurs</span>
            <span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5" /> Débuté {d.startedAt}</span>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium text-primary">{d.pack}</p>

        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <PlayerBadge player={p1} highlight={leader === 0} />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">VS</span>
          <PlayerBadge player={p2} highlight={leader === 1} />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Manche {d.round} / {d.totalRounds}</span>
            <span>{Math.round((d.round / d.totalRounds) * 100)}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${(d.round / d.totalRounds) * 100}%` }} />
          </div>
        </div>

        {d.status === "termine" && leader !== null && (
          <div className="mt-6 rounded-2xl border border-success/20 bg-success/5 p-4 text-center">
            <Trophy className="mx-auto h-6 w-6 text-success" />
            <p className="mt-2 text-sm font-semibold">
              Victoire de {d.players[leader].name}
            </p>
          </div>
        )}

        {d.status === "en-attente" && (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-warning/20 bg-warning/5 p-6 text-center">
            <Radio className="h-6 w-6 text-warning" />
            <p className="text-sm font-semibold">En attente d'un adversaire</p>
            <button className="btn-primary">
              <Swords className="h-4 w-4" /> Rejoindre le duel
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="card-surface">
          <h2 className="text-lg font-semibold">Historique des manches</h2>
          <ol className="mt-6 space-y-4">
            {d.rounds.map((r) => (
              <li key={r.index} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="badge">{r.theme}</span>
                  <span className="text-xs text-muted-foreground">Manche {r.index}</span>
                </div>
                <p className="mt-3 text-sm font-medium">{r.question}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Bonne réponse : <span className="font-semibold text-foreground">{r.correctChoice}</span>
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {r.playerAnswers.map((a) => {
                    const player = d.players[a.player];
                    return (
                      <div
                        key={a.player}
                        className={cn(
                          "rounded-xl border p-3",
                          a.correct ? "border-success/40 bg-success/5" : "border-danger/40 bg-danger/5"
                        )}
                      >
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <span>{player.countryFlag}</span> {player.name}
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">{a.choice}</p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          {a.correct ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-danger" />
                          )}
                          <span className="font-mono text-muted-foreground">{(a.timeMs / 1000).toFixed(1)}s</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </li>
            ))}
            {d.rounds.length === 0 && (
              <p className="text-sm text-muted-foreground">La partie n'a pas encore commencé.</p>
            )}
          </ol>
        </div>

        <div className="card-surface">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Chat</h2>
            <MessagesSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <ul className="mt-6 space-y-4">
            {d.chat.map((m, i) => (
              <li key={i} className="text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold">{m.author}</span>
                  {m.role === "player" && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">joueur</span>
                  )}
                  <span className="text-xs text-muted-foreground">{m.time}</span>
                </div>
                <p className="mt-1 text-muted-foreground">{m.text}</p>
              </li>
            ))}
          </ul>
          <ChatForm />
        </div>
      </div>
    </section>
  );
}

function PlayerBadge({ player, highlight }: { player: { name: string; score: number; country: string; countryFlag: string }; highlight: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border-2 p-5 text-center",
        highlight ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border bg-background"
      )}
    >
      <p className="text-3xl">{player.countryFlag}</p>
      <p className="mt-2 text-base font-semibold">{player.name}</p>
      <p className="text-xs text-muted-foreground">{player.country || " "}</p>
      <p className={cn("mt-3 text-4xl font-bold", highlight ? "text-primary" : "text-foreground")}>
        {player.score}
      </p>
    </div>
  );
}
