import Link from "next/link";
import { Shield, CheckCircle2 } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  bullets,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  bullets: string[];
}) {
  return (
    <section className="container-app py-10 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-center">
        <div className="hidden lg:block">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg">
              <Shield className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span className="text-xl font-bold tracking-tight">
              Regul<span className="text-primary">Arena</span>
            </span>
          </Link>

          <h1 className="mt-10 text-4xl font-bold leading-tight tracking-tight">
            La régulation bancaire, <span className="hero-title">version arène</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Rejoins 2 400 professionnels qui progressent tous les jours sur les
            textes UEMOA et CEMAC par le jeu.
          </p>

          <ul className="mt-8 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="card-surface !p-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
