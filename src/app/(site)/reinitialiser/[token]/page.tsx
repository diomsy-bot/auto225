import type { Metadata } from "next";
import { ResetForm } from "@/components/auth/forms";
import { AuthShell } from "@/components/auth/shell";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthShell title="Nouveau mot de passe">
      <ResetForm token={token} />
    </AuthShell>
  );
}
