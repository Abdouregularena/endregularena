import type { Metadata } from "next";
import Link from "next/link";
import { MessagesSquare, ThumbsUp, Plus, Gavel, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DEBATS } from "@/lib/mock/debats";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Débats",
  description:
    "Questions ouvertes sur la régulation bancaire, argumentées et arbitrées par un jury d'experts.",
};

const STATUS_ICON = {
  ouvert: MessagesSquare,
  jury: Gavel,
  clos: CheckCircle2,
};

const STATUS_CLASS = {
  ouvert: "bg-primary/10 text-primary border-primary/20",
  jury: "bg-warning/10 text-warning border-warning/20",
  clos: "bg-success/10 text-success border-success/20",
};

export default function DebatsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Débats à jury"
        title="Les questions qu'on n'ose plus poser"
        subtitle="Des questions ouvertes soumises par la communauté, argumentées et modérées par un jury d'experts."
      />
      <section className="container-app py-12">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {["Tous", "Ouverts", "En jury", "Clos"].map((f, i) => (
              <button
                key={f}
                className={cn(
                  "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium",
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
            <Plus className="h-4 w-4" /> Ouvrir un débat
          </Link>
        </div>

        <div className="space-y-4">
          {DEBATS.map((d) => {
            const Icon = STATUS_ICON[d.status];
            return (
              <Link
                key={d.id}
                href={`/debats/${d.id}`}
                className="card-surface flex flex-col gap-4 hover:-translate-y-0.5 hover:border-primary/40 sm:flex-row sm:items-start"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {d.category}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                        STATUS_CLASS[d.status]
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {d.status === "ouvert" ? "Ouvert" : d.status === "jury" ? "En délibération" : "Clos"}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold leading-snug sm:text-lg">
                    {d.question}
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Posée par <strong className="font-semibold text-foreground/80">{d.author}</strong> ({d.authorRole}) - {d.createdAt}
                  </p>
                </div>

                <div className="flex items-center gap-4 border-t border-border pt-4 sm:flex-col sm:items-end sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                  <div className="text-center">
                    <p className="text-lg font-bold">{d.answers}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">réponses</p>
                  </div>
                  <div className="text-center">
                    <p className="inline-flex items-center gap-1 text-lg font-bold text-primary">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {d.votes}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">votes</p>
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
