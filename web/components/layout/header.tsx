"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Quiz", href: "/quiz" },
  { label: "Duels", href: "/duels" },
  { label: "Tournois", href: "/tournois" },
  { label: "Débats", href: "/debats" },
  { label: "Classement", href: "/classement" },
  {
    label: "Ressources",
    href: "#",
    children: [
      { label: "Bibliothèque RFE", href: "/rfe" },
      { label: "À propos", href: "/about" },
      { label: "Rejoindre une organisation", href: "/join-org" },
    ],
  },
];

export function Header() {
  const [openMobile, setOpenMobile] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container-app flex h-16 items-center justify-between">
        <div className="flex items-center gap-10">
          <Logo />
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((item) =>
              item.children ? (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
                    {item.label}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <div
                    className={cn(
                      "absolute left-0 top-full min-w-[220px] rounded-xl border border-border bg-card p-2 shadow-lg transition",
                      openDropdown === item.label
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 -translate-y-2 pointer-events-none"
                    )}
                  >
                    {item.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        className="block rounded-lg px-3 py-2 text-sm text-foreground/80 transition hover:bg-muted hover:text-foreground"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Connexion
          </Link>
          <Link href="/signup" className="btn-primary !py-2 !px-5">
            Créer un compte
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpenMobile((v) => !v)}
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-border"
          aria-label="Menu"
        >
          {openMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {openMobile && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="container-app flex flex-col py-4">
            {NAV.flatMap((item) =>
              item.children
                ? [
                    <div
                      key={item.label}
                      className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {item.label}
                    </div>,
                    ...item.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        onClick={() => setOpenMobile(false)}
                        className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition hover:bg-muted"
                      >
                        {c.label}
                      </Link>
                    )),
                  ]
                : [
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenMobile(false)}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition hover:bg-muted"
                    >
                      {item.label}
                    </Link>,
                  ]
            )}
            <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
              <ThemeToggle />
              <Link
                href="/login"
                onClick={() => setOpenMobile(false)}
                className="btn-ghost flex-1 !py-2.5"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpenMobile(false)}
                className="btn-primary flex-1 !py-2.5"
              >
                Compte
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
