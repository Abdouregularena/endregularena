import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PACKS } from "@/lib/mock/packs";
import { PackCard } from "@/components/ui/pack-card";

export function PacksPreview() {
  return (
    <section className="bg-muted/30 py-20 lg:py-28">
      <div className="container-app">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span className="badge">Packs de questions</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              6 domaines réglementaires, une progression claire
            </h2>
            <p className="mt-4 text-muted-foreground">
              Chaque pack est structuré par thème, avec sources citées et niveaux
              de difficulté. Commence par un test rapide pour situer ton niveau.
            </p>
          </div>
          <Link
            href="/quiz"
            className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-primary hover:underline sm:self-auto"
          >
            Tous les packs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PACKS.map((p) => (
            <PackCard key={p.slug} pack={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
