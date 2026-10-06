import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/actions/auth";
import { AdminNav } from "@/components/admin/nav";
import { requireStaff } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/labels";

export const metadata: Metadata = { title: { default: "Administration", template: "%s | Admin AUTO225" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="bg-green-950 p-4 text-white lg:min-h-screen">
        <Link href="/admin" className="block text-lg font-extrabold">AUTO<span className="text-brand-orange">225</span> <span className="text-sm font-medium text-white/60">admin</span></Link>
        <p className="mt-1 text-xs text-white/60">{user.name} · {ROLE_LABELS[user.role]}</p>
        <div className="mt-4"><AdminNav isAdmin={user.role === "ADMIN"} /></div>
        <div className="mt-6 hidden space-y-2 text-sm lg:block">
          <Link href="/" className="block text-white/70 hover:text-white">← Voir le site</Link>
          <form action={logout}><button className="text-white/70 hover:text-white">Se déconnecter</button></form>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-8">{children}</main>
    </div>
  );
}
