import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Créer un compte",
  description:
    "Crée ton compte Regul Arena en 30 secondes et commence à jouer sur les textes UEMOA et CEMAC.",
};

export default function SignupPage() {
  return (
    <AuthShell
      title="Créer ton compte"
      subtitle="En 30 secondes. Aucune carte bancaire requise."
      bullets={[
        "Accès immédiat aux 6 packs de questions",
        "Duels PvP et tournois inclus",
        "Certificats officiels au format PDF",
        "Analyse forces et faiblesses par thème",
      ]}
    >
      <AuthForm variant="signup" />
    </AuthShell>
  );
}
