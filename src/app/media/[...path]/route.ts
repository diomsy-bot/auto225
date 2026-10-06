import { readPublicMedia } from "@/lib/storage";

// Photos publiques des annonces (stockées hors du code, visibles sans redéploiement).
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const data = await readPublicMedia(path.join("/"));
  if (!data) return new Response("Introuvable", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
