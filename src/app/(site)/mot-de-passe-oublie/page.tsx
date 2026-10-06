import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth/forms";
import { AuthShell } from "@/components/auth/shell";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default function ForgotPage() {
  return (
    <AuthShell title="Mot de passe oublié">
      <p className="mb-4 text-sm text-muted">Indiquez votre email : nous vous enverrons un lien pour choisir un nouveau mot de passe.</p>
      <ForgotForm />
    </AuthShell>
  );
}
