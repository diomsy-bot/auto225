import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/forms";
import { AuthShell } from "@/components/auth/shell";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ suite?: string; reinitialise?: string }> }) {
  const { suite, reinitialise } = await searchParams;
  return (
    <AuthShell title="Connexion">
      {reinitialise && <p role="status" className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-brand-green">Mot de passe modifié. Vous pouvez vous connecter.</p>}
      <LoginForm next={suite} />
      <p className="mt-6 text-center text-sm text-muted">
        Pas encore de compte ? <Link href={`/inscription${suite ? `?suite=${encodeURIComponent(suite)}` : ""}`} className="font-semibold text-brand-green underline">Créer un compte</Link>
      </p>
    </AuthShell>
  );
}
