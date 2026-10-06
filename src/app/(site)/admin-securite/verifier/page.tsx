import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TotpForm } from "@/components/auth/forms";
import { AuthShell } from "@/components/auth/shell";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Vérification", robots: { index: false } };

export default async function VerifyTotpPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?suite=/admin");
  if (user.role !== "ADMIN") redirect("/admin");
  if (!user.totpEnabledAt) redirect("/admin-securite/activer");
  return (
    <AuthShell title="Code de vérification">
      <p className="mb-4 text-sm text-muted">Saisissez le code à 6 chiffres de votre application d&apos;authentification.</p>
      <TotpForm />
    </AuthShell>
  );
}
