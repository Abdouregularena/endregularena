import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PACKS } from "@/lib/mock/packs";
import { QUESTIONS } from "@/lib/mock/questions";
import { QuizRunner } from "@/components/quiz/quiz-runner";

type Props = { params: Promise<{ pack: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pack } = await params;
  const p = PACKS.find((x) => x.slug === pack);
  if (!p) return { title: "Pack introuvable" };
  return {
    title: p.title,
    description: p.description,
  };
}

export function generateStaticParams() {
  return PACKS.map((p) => ({ pack: p.slug }));
}

export default async function QuizPlayPage({ params }: Props) {
  const { pack } = await params;
  const p = PACKS.find((x) => x.slug === pack);
  const questions = QUESTIONS[pack] ?? [];
  if (!p || questions.length === 0) notFound();

  return (
    <section className="container-app py-10 lg:py-14">
      <QuizRunner pack={p} questions={questions} />
    </section>
  );
}
