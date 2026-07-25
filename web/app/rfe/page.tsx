import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, FileText, ArrowRight, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Bibliothèque RFE",
  description:
    "Ressources sur le nouveau Règlement 06/2024/CM/UEMOA relatif aux relations financières extérieures.",
};

const RESOURCES = [
  {
    icon: FileText,
    title: "Règlement 06/2024/CM/UEMOA",
    desc: "Le nouveau cadre applicable aux relations financières extérieures, remplaçant le règlement 09/2010.",
    tag: "Texte officiel",
    href: "#",
  },
  {
    icon: BookOpen,
    title: "Note synthétique",
    desc: "Les 12 changements clés du RFE 2024 par rapport au RFE 2010, en un tableau.",
    tag: "Fiche",
    href: "#",
  },
  {
    icon: FileText,
    title: "Note BCEAO 013-04/2026",
    desc: "Traitement des paiements extérieurs des non-résidents ayant acquis le statut de résident.",
    tag: "Instruction",
    href: "#",
  },
  {
    icon: BookOpen,
    title: "Cas pratiques résident/non-résident",
    desc: "10 situations concrètes, avec la qualification retenue et le fondement juridique.",
    tag: "Cas pratiques",
    href: "#",
  },
];

export default function RfePage() {
  return (
    <>
      <PageHeader
        eyebrow="Bibliothèque"
        title="Relations financières extérieures UEMOA"
        subtitle="Textes officiels, notes de synthèse et cas pratiques sur le nouveau règlement 06/2024."
      />
      <section className="container-app py-16">
        <div className="grid gap-5 md:grid-cols-2">
          {RESOURCES.map((r) => (
            <Link
              key={r.title}
              href={r.href}
              className="group card-surface flex gap-4 hover:-translate-y-0.5 hover:border-primary/40"
            >
              <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <r.icon className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {r.tag}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-semibold">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary transition group-hover:gap-2">
                  Consulter <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="text-sm font-medium">
            Prêt à mettre ces ressources à l'épreuve ?
          </p>
          <Link href="/quiz/rfe-uemoa" className="mt-4 inline-flex btn-primary">
            Lancer le pack RFE UEMOA
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
