import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Layers } from "lucide-react";
import type { Pack } from "@/lib/mock/packs";
import { cn } from "@/lib/utils";

const COLOR_MAP: Record<Pack["color"], { icon: string; badge: string }> = {
  violet: { icon: "from-violet-500 to-fuchsia-500", badge: "bg-violet-500/10 text-violet-600 dark:text-violet-300" },
  blue: { icon: "from-blue-500 to-sky-500", badge: "bg-blue-500/10 text-blue-600 dark:text-blue-300" },
  emerald: { icon: "from-emerald-500 to-teal-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" },
  amber: { icon: "from-amber-500 to-orange-500", badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  rose: { icon: "from-rose-500 to-pink-500", badge: "bg-rose-500/10 text-rose-600 dark:text-rose-300" },
  cyan: { icon: "from-cyan-500 to-teal-500", badge: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" },
};

export function PackCard({ pack }: { pack: Pack }) {
  const c = COLOR_MAP[pack.color];
  return (
    <Link
      href={`/quiz/${pack.slug}`}
      className="group card-surface flex flex-col hover:-translate-y-1 hover:border-primary/40"
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg",
            c.icon
          )}
        >
          <BookOpen className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", c.badge)}>
          {pack.zone}
        </span>
      </div>

      <h3 className="mt-5 text-lg font-semibold tracking-tight">{pack.title}</h3>
      <p className="mt-1 text-sm font-medium text-primary/80">{pack.subtitle}</p>
      <p className="mt-3 text-sm text-muted-foreground line-clamp-3 flex-1">
        {pack.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {pack.themes.slice(0, 3).map((t) => (
          <span
            key={t}
            className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" />
          {pack.questions} questions
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {pack.duration}
        </span>
        <span className="text-primary transition group-hover:translate-x-0.5">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
