"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react";

type Mode = "password" | "magic";

export function AuthForm({ variant }: { variant: "login" | "signup" }) {
  const [mode, setMode] = useState<Mode>("password");
  const [showPwd, setShowPwd] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const isLogin = variant === "login";

  return (
    <div>
      <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
        <button
          onClick={() => setMode("password")}
          className={`rounded-full py-2 text-sm font-medium transition ${
            mode === "password" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Mot de passe
        </button>
        <button
          onClick={() => setMode("magic")}
          className={`rounded-full py-2 text-sm font-medium transition ${
            mode === "magic" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Lien magique
        </button>
      </div>

      {sent ? (
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <div>
              <p className="font-semibold">Lien envoyé</p>
              <p className="mt-1 text-muted-foreground">
                Vérifie {sent}. Le lien est valable 15 minutes.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const email = new FormData(e.currentTarget).get("email") as string;
            if (mode === "magic") {
              setSent(email);
            } else {
              alert(`(Démo) ${isLogin ? "Connexion" : "Inscription"} avec ${email}`);
            }
          }}
        >
          {variant === "signup" && mode === "password" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nom complet</label>
              <input
                name="name"
                type="text"
                required
                placeholder="Prénom Nom"
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium">Email professionnel</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="email"
                type="email"
                required
                placeholder="prenom.nom@banque.sn"
                className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {mode === "password" && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium">Mot de passe</label>
                {isLogin && (
                  <Link
                    href="/reset-password"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Oublié ?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="password"
                  type={showPwd ? "text" : "password"}
                  required
                  minLength={10}
                  placeholder="Au moins 10 caractères"
                  className="w-full rounded-xl border border-input bg-background pl-10 pr-10 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? "Masquer" : "Afficher"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === "magic" && (
            <p className="rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
              <Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-primary" />
              On t'enverra un lien de connexion à usage unique valable 15 minutes.
            </p>
          )}

          <button type="submit" className="btn-primary w-full !py-3">
            {mode === "magic"
              ? "Recevoir mon lien"
              : isLogin
                ? "Se connecter"
                : "Créer mon compte"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isLogin ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
        <Link
          href={isLogin ? "/signup" : "/login"}
          className="font-semibold text-primary hover:underline"
        >
          {isLogin ? "Créer un compte" : "Se connecter"}
        </Link>
      </p>

      {variant === "signup" && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          En créant un compte, tu acceptes les{" "}
          <Link href="/cgu" className="underline hover:text-foreground">
            conditions
          </Link>{" "}
          et la{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            politique de confidentialité
          </Link>
          .
        </p>
      )}
    </div>
  );
}
