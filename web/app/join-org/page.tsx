import type { Metadata } from "next";
import { Building2, Users2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ContactForm } from "@/components/join-org/contact-form";

export const metadata: Metadata = {
  title: "Rejoindre une organisation",
  description:
    "Faites de Regul Arena l'outil de formation continue de votre banque, de votre régulateur ou de votre école.",
};

const BENEFITS = [
  {
    icon: Users2,
    title: "Comptes équipe",
    desc: "Rassemblez vos collaborateurs sous un même établissement, avec un tableau de bord dédié pour les managers.",
  },
  {
    icon: ShieldCheck,
    title: "Suivi de conformité",
    desc: "Attestez la formation continue de vos équipes avec des certificats officiels référencés QR.",
  },
  {
    icon: Building2,
    title: "Contenus sur mesure",
    desc: "Packs personnalisés reflétant vos procédures internes et vos textes prioritaires.",
  },
];

export default function JoinOrgPage() {
  return (
    <>
      <PageHeader
        eyebrow="Organisations"
        title="Regul Arena pour votre équipe"
        subtitle="Banques, régulateurs, écoles et cabinets, faites monter votre équipe en compétence à grande échelle."
      />

      <section className="container-app py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="card-surface">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg">
                <b.icon className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>

        <ContactForm />
      </section>
    </>
  );
}
