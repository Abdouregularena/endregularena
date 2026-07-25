import { Trophy } from "lucide-react";
import type { BracketMatch } from "@/lib/mock/tournament-detail";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<BracketMatch["status"], string> = {
  "a-venir": "border-border bg-background text-muted-foreground",
  "en-cours": "border-primary bg-primary/5 shadow-lg shadow-primary/10",
  termine: "border-border bg-card",
};

function MatchCard({ m }: { m: BracketMatch }) {
  return (
    <div className={cn("rounded-xl border-2 p-3 text-xs transition", STATUS_STYLE[m.status])}>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {m.round}
        {m.status === "en-cours" && <span className="ml-2 text-danger">EN DIRECT</span>}
      </p>
      <PlayerRow p={m.p1} score={m.p1?.score} winner={m.winner === 0} />
      <div className="my-1 h-px bg-border" />
      <PlayerRow p={m.p2} score={m.p2?.score} winner={m.winner === 1} />
    </div>
  );
}

function PlayerRow({ p, score, winner }: { p?: { name: string; countryFlag: string }; score?: number; winner: boolean }) {
  if (!p) {
    return (
      <div className="flex items-center justify-between py-1 text-muted-foreground/50">
        <span>À déterminer</span>
        <span>-</span>
      </div>
    );
  }
  return (
    <div className={cn("flex items-center justify-between py-1", winner && "text-primary font-semibold")}>
      <span className="flex items-center gap-1.5 truncate">
        <span>{p.countryFlag}</span>
        <span className="truncate">{p.name}</span>
      </span>
      <span className={cn("font-mono", winner && "text-primary")}>{score ?? "-"}</span>
    </div>
  );
}

export function Bracket({ matches }: { matches: BracketMatch[] }) {
  const quarters = matches.filter((m) => m.round === "1/4");
  const semis = matches.filter((m) => m.round === "1/2");
  const final = matches.find((m) => m.round === "Finale");

  const columns: { title: string; items: BracketMatch[] }[] = [];
  if (quarters.length) columns.push({ title: "Quarts", items: quarters });
  if (semis.length) columns.push({ title: "Demi-finales", items: semis });
  if (final) columns.push({ title: "Finale", items: [final] });

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[720px] gap-6 py-4">
        {columns.map((col) => (
          <div key={col.title} className="flex flex-1 flex-col justify-around gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {col.title}
            </p>
            <div className="flex flex-1 flex-col justify-around gap-4">
              {col.items.map((m) => (
                <MatchCard key={m.id} m={m} />
              ))}
            </div>
          </div>
        ))}
        <div className="flex flex-col items-center justify-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl">
            <Trophy className="h-7 w-7" />
          </div>
          <p className="mt-2 text-xs font-semibold">Vainqueur</p>
        </div>
      </div>
    </div>
  );
}
