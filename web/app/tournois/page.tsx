import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, Users, Calendar, Award, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { TOURNAMENTS } from "@/lib/mock/tournois";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tournois",
  description: "Championnats mensuels UEMOA, CEMAC et panafricains.",
};

const STATUS = {
  inscriptions: { label: "Inscriptions ouvertes", cls: "bg-success/10 text-success border-success/20" },
  "en-cours": { label: "En cours", cls: "bg-primary/10 text-primary border-primary/20" },
  termine: { label: "Terminé", cls: "bg-muted text-muted-foreground border-border" },
};

export default function TournoisPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tournois"
        title="Championnats en cours"
        subtitle="Inscris-toi aux prochains tournois par zone. Certificats officiels pour les finalistes."
      />
      <section className="container-app py-12">
        <div className="grid gap-5 lg:grid-cols-2">
          {TOURNAMENTS.map((t) => {
            const s = STATUS[t.status];
            const pct = (t.participants / t.maxParticipants) * 100;
            return (
              <div key={t.id} className="card-surface hover:-translate-y-0.5 hover:border-primary/40">
                <div className="flex items-start justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
                    <Trophy className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                  <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", s.cls)}>
                    {s.label}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-semibold tracking-tight">{t.name}</h3>
                <p className="mt-1 text-sm font-medium text-primary">{t.pack} - {t.zone}</p>

                <dl className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/60 p-3">
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" /> Début
                    </dt>
                    <dd className="mt-1 text-sm font-semibold">{t.startDate}</dd>
                  </div>
                  <div className="rounded-xl bg-muted/60 p-3">
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> Format
                    </dt>
                    <dd className="mt-1 text-sm font-semibold">{t.format}</dd>
                  </div>
                </dl>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Participants</span>
                    <span>{t.participants} / {t.maxParticipants}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary/5 p-3 text-xs">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="text-primary font-medium">{t.prize}</span>
                </div>

                <Link
                  href={`/tournois/${t.id}`}
                  className="mt-5 btn-primary w-full !py-2.5"
                >
                  {t.status === "inscriptions" ? "S'inscrire" : t.status === "en-cours" ? "Voir le bracket" : "Résultats"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
