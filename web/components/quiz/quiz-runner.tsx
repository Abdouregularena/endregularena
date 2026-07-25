"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight, RefreshCcw, Home, BookOpen } from "lucide-react";
import type { Question } from "@/lib/mock/questions";
import type { Pack } from "@/lib/mock/packs";
import { cn } from "@/lib/utils";

export function QuizRunner({ pack, questions }: { pack: Pack; questions: Question[] }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [validated, setValidated] = useState(false);
  const [answers, setAnswers] = useState<{ correct: boolean; theme: string }[]>([]);
  const [done, setDone] = useState(false);

  const q = questions[index];

  function validate() {
    if (selected == null) return;
    setValidated(true);
    setAnswers((prev) => [
      ...prev,
      { correct: selected === q.correct, theme: q.theme },
    ]);
  }

  function next() {
    if (index === questions.length - 1) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setValidated(false);
  }

  function reset() {
    setIndex(0);
    setSelected(null);
    setValidated(false);
    setAnswers([]);
    setDone(false);
  }

  if (done) {
    const correct = answers.filter((a) => a.correct).length;
    const pct = Math.round((correct / questions.length) * 100);
    const byTheme = answers.reduce<Record<string, { c: number; t: number }>>((acc, a) => {
      acc[a.theme] ??= { c: 0, t: 0 };
      acc[a.theme].t++;
      if (a.correct) acc[a.theme].c++;
      return acc;
    }, {});

    return (
      <div className="mx-auto max-w-2xl">
        <div className="card-surface !p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-lg">
            <CheckCircle2 className="h-8 w-8" strokeWidth={2.5} />
          </div>
          <h2 className="mt-6 text-2xl font-bold">Quiz terminé</h2>
          <p className="mt-2 text-muted-foreground">
            Tu as répondu à {questions.length} questions sur le pack {pack.title}.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4 rounded-2xl bg-muted/60 p-6">
            <div>
              <p className="text-3xl font-bold text-primary">{correct}</p>
              <p className="mt-1 text-xs text-muted-foreground">Bonnes réponses</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{questions.length - correct}</p>
              <p className="mt-1 text-xs text-muted-foreground">Erreurs</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{pct}%</p>
              <p className="mt-1 text-xs text-muted-foreground">Score</p>
            </div>
          </div>

          <div className="mt-6 text-left">
            <h3 className="text-sm font-semibold">Par thème</h3>
            <ul className="mt-3 space-y-2">
              {Object.entries(byTheme).map(([theme, { c, t }]) => {
                const p = Math.round((c / t) * 100);
                return (
                  <li key={theme}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{theme}</span>
                      <span className="text-muted-foreground">{c}/{t}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                        style={{ width: `${p}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={reset} className="btn-ghost">
              <RefreshCcw className="h-4 w-4" /> Recommencer
            </button>
            <Link href="/quiz" className="btn-primary">
              <Home className="h-4 w-4" /> Autres packs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pct = ((index + (validated ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          {pack.title}
        </span>
        <span>
          Question {index + 1} / {questions.length}
        </span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-6 card-surface !p-8">
        <span className="badge">{q.theme}</span>
        <h2 className="mt-4 text-xl font-semibold leading-snug">{q.statement}</h2>

        <div className="mt-6 space-y-3">
          {q.choices.map((c, i) => {
            const isSelected = selected === i;
            const isCorrect = validated && i === q.correct;
            const isWrong = validated && isSelected && i !== q.correct;
            return (
              <button
                key={i}
                disabled={validated}
                onClick={() => setSelected(i)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left text-sm transition",
                  !validated && "hover:border-primary/40 hover:bg-primary/5",
                  isSelected && !validated && "border-primary bg-primary/5",
                  !isSelected && !validated && "border-border",
                  isCorrect && "border-success bg-success/10",
                  isWrong && "border-danger bg-danger/10",
                  validated && !isSelected && !isCorrect && "border-border opacity-60"
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-xs font-semibold",
                    isCorrect && "bg-success text-white",
                    isWrong && "bg-danger text-white",
                    !isCorrect && !isWrong && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isWrong ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    String.fromCharCode(65 + i)
                  )}
                </span>
                <span className="flex-1 font-medium">{c}</span>
              </button>
            );
          })}
        </div>

        {validated && (
          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-semibold">
              {selected === q.correct ? "Bonne réponse" : "Réponse incorrecte"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{q.explanation}</p>
            <p className="mt-2 text-xs font-medium text-primary">Source : {q.source}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          {validated ? (
            <button onClick={next} className="btn-primary">
              {index === questions.length - 1 ? "Voir le résultat" : "Question suivante"}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={validate}
              disabled={selected == null}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Valider ma réponse
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
