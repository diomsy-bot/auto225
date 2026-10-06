import { updateUser } from "@/actions/admin/content";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/labels";

export const metadata = { title: "Utilisateurs" };

export default async function UsersAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const me = await requireStaff(["ADMIN"]);
  const { q } = await searchParams;
  const users = await db.user.findMany({
    where: q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Utilisateurs et permissions</h1>
      <p className="mt-1 text-sm text-muted">Gestionnaire : traite demandes et véhicules. Administrateur : gère aussi permissions et paramètres (double authentification obligatoire). Désactiver un compte ferme immédiatement ses sessions.</p>
      <form className="mt-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Nom ou email" className="input max-w-xs" />
        <button className="btn-green">Rechercher</button>
      </form>
      <div className="card mt-4 overflow-x-auto">
        <table className="table">
          <thead><tr><th>Utilisateur</th><th>Inscrit le</th><th>Email vérifié</th><th>Rôle et accès</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}<br /><span className="text-xs text-muted">{u.email}{u.phone ? ` · ${u.phone}` : ""}</span></td>
                <td className="text-xs">{formatDate(u.createdAt)}</td>
                <td className="text-xs">{u.emailVerifiedAt ? "Oui" : "Non"}</td>
                <td>
                  {u.id === me.id ? <span className="text-xs text-muted">{ROLE_LABELS[u.role]} (vous)</span> : (
                    <form action={updateUser} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <select name="role" defaultValue={u.role} className="input min-h-9 max-w-[170px] py-1 text-xs">{Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                      <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="disabled" defaultChecked={!!u.disabledAt} className="accent-brand-green" />Désactivé</label>
                      <button className="btn-outline btn-sm">Enregistrer</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
