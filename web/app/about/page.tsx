import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Prose } from "@/components/ui/prose";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Regul Arena est une plateforme d'apprentissage par le jeu dédiée aux textes prudentiels et au RFE des zones UEMOA et CEMAC.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="À propos"
        title="La régulation, apprise autrement"
        subtitle="Une plateforme pensée par et pour les professionnels de la banque en Afrique de l'Ouest et Centrale."
      />
      <section className="container-app py-16">
        <Prose>
          <h2>Pourquoi Regul Arena ?</h2>
          <p>
            Les textes prudentiels de la BCEAO et de la COBAC évoluent
            constamment. Le règlement 06/2024 du CM/UEMOA sur les relations
            financières extérieures, les décisions 013 et 014 de 2016 sur le
            dispositif prudentiel, les instructions BCEAO sur la monnaie
            électronique, chacun demande du temps de lecture, d'interprétation
            et de mise en pratique.
          </p>
          <p>
            Regul Arena part d'un constat simple : les professionnels de la
            banque n'ont ni le temps ni l'envie de re-lire 200 pages de textes
            en PDF chaque trimestre. Nous transformons ces textes en quiz
            courts, duels compétitifs et débats structurés pour ancrer la
            connaissance dans la durée.
          </p>

          <h2>Notre approche</h2>
          <ul>
            <li>
              <strong>Sources citées.</strong> Chaque question renvoie à
              l'article de règlement, de décision ou d'instruction concerné.
            </li>
            <li>
              <strong>Anti-triche natif.</strong> Les questions des duels sont
              figées côté serveur, empêchant tout partage entre joueurs.
            </li>
            <li>
              <strong>Modération par experts.</strong> Les débats à jury sont
              arbitrés par des professionnels reconnus des institutions
              partenaires.
            </li>
            <li>
              <strong>Progression mesurée.</strong> Ton profil trace tes forces
              et tes faiblesses par thème pour orienter ta révision.
            </li>
          </ul>

          <h2>Pour qui ?</h2>
          <p>
            Banquiers (conformité, crédit, trade, comptabilité, audit),
            régulateurs (BCEAO, BEAC, COBAC), formateurs, étudiants en finance
            et en droit bancaire de la zone UEMOA et CEMAC.
          </p>
        </Prose>
      </section>
    </>
  );
}
