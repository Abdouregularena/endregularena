import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Prose } from "@/components/ui/prose";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment Regul Arena collecte, utilise et protège tes données personnelles.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Confidentialité"
        title="Politique de confidentialité"
        subtitle="Comment nous collectons, utilisons et protégeons tes données."
      />
      <section className="container-app py-16">
        <Prose>
          <h2>Données collectées</h2>
          <ul>
            <li>Nom, prénom, email professionnel</li>
            <li>Pays, établissement, rôle déclaré</li>
            <li>Historique de réponses, scores, duels et tournois</li>
            <li>Données techniques (IP, navigateur) à des fins de sécurité</li>
          </ul>

          <h2>Utilisation</h2>
          <p>
            Tes données servent uniquement à faire fonctionner la plateforme, à
            personnaliser ta progression et à te permettre d'interagir avec
            d'autres joueurs. Aucune revente à des tiers.
          </p>

          <h2>Stockage et sécurité</h2>
          <p>
            Tes données sont hébergées chez un prestataire européen conforme au
            RGPD. Les mots de passe sont hashés (bcrypt), les communications
            sont chiffrées (TLS 1.3).
          </p>

          <h2>Tes droits</h2>
          <p>
            Tu peux à tout moment accéder à tes données, les rectifier ou
            demander leur suppression depuis ton profil, ou par email à
            <a href="mailto:dpo@regularena.com"> dpo@regularena.com</a>.
          </p>

          <h2>Cookies</h2>
          <p>
            Nous utilisons uniquement des cookies techniques (session, préférence
            de thème). Aucun tracking publicitaire.
          </p>
        </Prose>
      </section>
    </>
  );
}
