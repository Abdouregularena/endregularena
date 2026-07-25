import Link from "next/link";
import { Logo } from "./logo";

const COLUMNS = [
  {
    title: "Produit",
    links: [
      { label: "Quiz", href: "/quiz" },
      { label: "Duels", href: "/duels" },
      { label: "Tournois", href: "/tournois" },
      { label: "Débats", href: "/debats" },
      { label: "Classement", href: "/classement" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "Bibliothèque RFE", href: "/rfe" },
      { label: "Rejoindre une organisation", href: "/join-org" },
      { label: "À propos", href: "/about" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Conditions d'utilisation", href: "/cgu" },
      { label: "Confidentialité", href: "/privacy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container-app py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              La plateforme de formation continue pour les métiers de la banque
              et de la régulation en zone UEMOA et CEMAC.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Regul Arena. Tous droits réservés.
          </p>
          <p className="text-xs text-muted-foreground">
            Conçu pour les banques, régulateurs et étudiants de la zone UEMOA / CEMAC.
          </p>
        </div>
      </div>
    </footer>
  );
}
