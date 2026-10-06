import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";

type Client = Prisma.TransactionClient | typeof db;

/** Journal des changements de statut, tarif et disponibilité (auteur + date). */
export async function logActivity(
  entry: { actorId?: string | null; entity: string; entityId: string; action: string; data?: Prisma.InputJsonValue },
  client: Client = db,
): Promise<void> {
  await client.activityLog.create({ data: { ...entry, actorId: entry.actorId ?? null } });
}
