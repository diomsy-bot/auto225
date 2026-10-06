import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-6xl font-extrabold text-brand-orange">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page introuvable</h1>
      <p className="mt-2 text-muted">Cette page n&apos;existe pas ou n&apos;est plus disponible.</p>
      <Link href="/" className="btn-green mt-6">Retour à l&apos;accueil</Link>
    </div>
  );
}
