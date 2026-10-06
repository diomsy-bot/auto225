import "server-only";
import { headers } from "next/headers";
import { db } from "./db";

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/** Limite le nombre de tentatives par clé (ex. connexion par IP + email). Renvoie false si dépassé. */
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);
  const entry = await db.rateLimit.findUnique({ where: { key } });
  if (!entry || entry.resetAt < now) {
    await db.rateLimit.upsert({ where: { key }, create: { key, count: 1, resetAt }, update: { count: 1, resetAt } });
    return true;
  }
  if (entry.count >= max) return false;
  await db.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return true;
}
