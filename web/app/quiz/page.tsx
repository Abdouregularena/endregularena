import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { PackCard } from "@/components/ui/pack-card";
import { PACKS } from "@/lib/mock/packs";

export const metadata: Metadata = {
  title: "Packs de quiz",
  description:
    "Choisis ton pack de quiz sur la régulation bancaire UEMOA et CEMAC.",
};

export default function QuizIndexPage() {
  return (
    <>
      <PageHeader
        eyebrow="Quiz"
        title="Choisis ton pack"
        subtitle="6 domaines réglementaires, 650+ questions avec sources citées."
      />
      <section className="container-app py-16">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PACKS.map((p) => (
            <PackCard key={p.slug} pack={p} />
          ))}
        </div>
      </section>
    </>
  );
}
