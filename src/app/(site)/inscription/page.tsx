import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/forms";
import { AuthShell } from "@/components/auth/shell";

export const metadata: Metadata = { title: "Créer un compte", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const { suite } = await searchParams;
  return (
    <AuthShell title="Créer un compte">
      <RegisterForm next={suite} />
      <p className="mt-6 text-center text-sm text-muted">
        Déjà inscrit ? <Link href="/connexion" className="font-semibold text-brand-green underline">Se connecter</Link>
      </p>
    </AuthShell>
  );
}
