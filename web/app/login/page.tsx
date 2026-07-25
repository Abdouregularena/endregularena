import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connecte-toi à Regul Arena par mot de passe ou lien magique.",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Content de te revoir"
      subtitle="Connecte-toi par mot de passe ou reçois un lien magique par email."
      bullets={[
        "Retrouve tes duels, tournois et progressions en cours",
        "Reprends là où tu t'étais arrêté sur tes packs",
        "Ton profil suit tes forces et faiblesses par thème",
      ]}
    >
      <AuthForm variant="login" />
    </AuthShell>
  );
}
