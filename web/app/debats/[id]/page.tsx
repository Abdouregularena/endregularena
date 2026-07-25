import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, MessagesSquare, ThumbsUp, Gavel, CheckCircle2, FileText } from "lucide-react";
import { DEBATS } from "@/lib/mock/debats";
import { getDebatDetail } from "@/lib/mock/debat-detail";
import { AnswerForm } from "@/components/debats/answer-form";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return DEBATS.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const d = getDebatDetail(id);
  if (!d) return { title: "Débat introuvable" };
  return { title: d.question.slice(0, 60), description: d.context };
}

const STATUS_STYLE = {
  ouvert: { text: "Ouvert", cls: "bg-primary/10 text-primary border-primary/20", icon: MessagesSquare },
  jury: { text: "En délibération", cls: "bg-warning/10 text-warning border-warning/20", icon: Gavel },
  clos: { text: "Clos", cls: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
} as const;

export default async function DebatDetailPage({ params }: Props) {
  const { id } = await params;
  const d = getDebatDetail(id);
  if (!d) notFound();

  const s = STATUS_STYLE[d.status];
  const Icon = s.icon;
  const sortedAnswers = [...d.answersList].sort((a, b) => (b.isJury ? 1 : 0) - (a.isJury ? 1 : 0) || b.votes - a.votes);

  return (
    <section className="container-app py-10">
      <Link href="/debats" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour aux débats
      </Link>

      <article className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-lg sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {d.category}
          </span>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", s.cls)}>
            <Icon className="h-3 w-3" /> {s.text}
          </span>
        </div>
        <h1 className="mt-4 text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
          {d.question}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Posée par <strong className="font-semibold text-foreground/90">{d.author}</strong> ({d.authorRole}) - {d.createdAt}
        </p>

        <div className="mt-6 rounded-2xl bg-muted/50 p-5">
          <h2 className="text-sm font-semibold">Contexte</h2>
          <p className="mt-2 text-sm text-muted-foreground">{d.context}</p>
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sources citées</h3>
          <ul className="mt-2 space-y-1.5">
            {d.sources.map((src) => (
              <li key={src} className="flex items-start gap-2 text-xs text-foreground/80">
                <FileText className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                {src}
              </li>
            ))}
          </ul>
        </div>
      </article>

      {d.verdict && (
        <div className="mt-6 rounded-3xl border-2 border-success/40 bg-success/5 p-6 sm:p-8">
          <div className="flex items-center gap-2 text-success">
            <Gavel className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Verdict du jury</h2>
          </div>
          <p className="mt-4 text-sm leading-relaxed">{d.verdict.text}</p>
          <div className="mt-4 flex items-center justify-between border-t border-success/20 pt-4 text-xs text-muted-foreground">
            <span>
              <strong className="text-foreground/80">{d.verdict.author}</strong> - {d.verdict.role}
            </span>
            <span>{d.verdict.date}</span>
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {d.answers} réponses <span className="text-muted-foreground">- {d.votes} votes</span>
          </h2>
          <select className="rounded-full border border-input bg-background px-3 py-1.5 text-xs">
            <option>Plus voté</option>
            <option>Plus récent</option>
            <option>Jury en premier</option>
          </select>
        </div>

        <div className="mt-6 space-y-4">
          {sortedAnswers.map((a) => (
            <article
              key={a.id}
              className={cn(
                "rounded-2xl border p-5 transition",
                a.isJury ? "border-primary/40 bg-primary/5 shadow-sm" : "border-border bg-card"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-muted text-lg">
                    {a.countryFlag}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      {a.author}
                      {a.isJury && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          <Gavel className="h-3 w-3" /> Jury
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{a.authorRole} - {a.authorCountry}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{a.createdAt}</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed">{a.text}</p>
              <div className="mt-4 flex items-center gap-3 border-t border-border pt-4 text-xs">
                <button className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-medium transition hover:border-primary hover:text-primary">
                  <ThumbsUp className="h-3.5 w-3.5" /> {a.votes}
                </button>
                <button className="text-muted-foreground hover:text-foreground">Répondre</button>
                <button className="text-muted-foreground hover:text-foreground">Signaler</button>
              </div>
            </article>
          ))}
        </div>

        {d.status !== "clos" && <AnswerForm />}
      </div>
    </section>
  );
}
