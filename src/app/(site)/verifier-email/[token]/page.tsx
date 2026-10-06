import type { Metadata } from "next";
import Link from "next/link";
import { verifyEmailToken } from "@/actions/auth";
import { AuthShell } from "@/components/auth/shell";

export const metadata: Metadata = { title: "Confirmation de l'email", robots: { index: false } };

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ok = await verifyEmailToken(token);
  return (
    <AuthShell title={ok ? "Email confirmé" : "Lien invalide"}>
      <p className="text-sm text-muted">
        {ok ? "Merci, votre adresse email est confirmée. Vos demandes envoyées avec cette adresse sont maintenant visibles dans votre compte." : "Ce lien est invalide ou a expiré. Connectez-vous pour en recevoir un nouveau."}
      </p>
      <Link href="/compte" className="btn-green mt-6 w-full">Aller à mon compte</Link>
    </AuthShell>
  );
}
