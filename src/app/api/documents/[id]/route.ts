import { getCurrentUser, isStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { readPrivateDocument } from "@/lib/storage";

// Justificatifs privés : accessibles uniquement par leur auteur et par l'équipe (ACC-06, ACC-08).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return new Response("Non autorisé", { status: 401 });
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc || (doc.userId !== user.id && !isStaff(user))) return new Response("Introuvable", { status: 404 });
  const data = await readPrivateDocument(doc.storageKey);
  if (!data) return new Response("Introuvable", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.originalName)}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
