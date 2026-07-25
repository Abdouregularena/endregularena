import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Prose } from "@/components/ui/prose";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Conditions générales d'utilisation de la plateforme Regul Arena.",
};

export default function CguPage() {
  return (
    <>
      <PageHeader
        eyebrow="Légal"
        title="Conditions générales d'utilisation"
        subtitle="Dernière mise à jour : 8 juillet 2026."
      />
      <section className="container-app py-16">
        <Prose>
          <h2>1. Objet</h2>
          <p>
            Les présentes conditions régissent l'accès et l'utilisation de la
            plateforme Regul Arena, dédiée à la formation continue sur les
            textes de régulation bancaire de la zone UEMOA et CEMAC.
          </p>

          <h2>2. Compte utilisateur</h2>
          <p>
            L'utilisateur s'engage à fournir des informations exactes lors de la
            création de son compte. L'usurpation d'identité entraîne la
            suppression immédiate du compte.
          </p>

          <h2>3. Propriété intellectuelle</h2>
          <p>
            Les questions, débats et supports pédagogiques sont la propriété de
            Regul Arena ou de ses partenaires. Toute reproduction non autorisée
            est interdite. Les textes réglementaires cités restent la propriété
            de leurs auteurs (BCEAO, COBAC, UEMOA, CEMAC).
          </p>

          <h2>4. Bonne conduite</h2>
          <ul>
            <li>Ne pas partager tes identifiants avec un tiers.</li>
            <li>Ne pas utiliser d'outils tiers pour tricher aux duels ou tournois.</li>
            <li>Rester courtois dans les débats et les messages privés.</li>
          </ul>

          <h2>5. Résiliation</h2>
          <p>
            Tu peux supprimer ton compte à tout moment depuis ton profil. Regul
            Arena peut suspendre un compte en cas de manquement grave aux
            présentes conditions.
          </p>

          <h2>6. Contact</h2>
          <p>
            Pour toute question : <a href="mailto:contact@regularena.com">contact@regularena.com</a>.
          </p>
        </Prose>
      </section>
    </>
  );
}
