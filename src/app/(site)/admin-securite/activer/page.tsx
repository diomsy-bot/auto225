import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { startTotpEnrollment } from "@/actions/auth";
import { TotpForm } from "@/components/auth/forms";
import { AuthShell } from "@/components/auth/shell";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sécuriser l'accès administrateur", robots: { index: false } };

export default async function EnrollTotpPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?suite=/admin");
  if (user.role !== "ADMIN") redirect("/admin");
  if (user.totpEnabledAt) redirect("/admin-securite/verifier");
  const enrollment = await startTotpEnrollment();
  if (!enrollment) redirect("/admin");
  return (
    <AuthShell title="Activer la double authentification">
      <p className="text-sm text-muted">L&apos;accès administrateur exige un code temporaire. Scannez ce QR code avec une application d&apos;authentification (Google Authenticator, Microsoft Authenticator…), puis saisissez le code affiché.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={enrollment.qr} alt="QR code à scanner avec votre application d'authentification" width={220} height={220} className="mx-auto my-6" />
      <p className="mb-6 break-all text-center font-mono text-xs text-muted">Clé manuelle : {enrollment.secret}</p>
      <TotpForm />
    </AuthShell>
  );
}
