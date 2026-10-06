import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";

type Client = Prisma.TransactionClient | typeof db;

export const BLOCKING_STATUSES = ["CONFIRMED", "IN_PROGRESS"] as const;

/**
 * Un véhicule est disponible si aucune réservation confirmée/en cours (marge incluse)
 * ni aucune indisponibilité ne chevauche la période demandée.
 * Une demande en attente ne bloque pas le véhicule.
 */
export async function isAvailable(
  vehicleId: string,
  startAt: Date,
  endAt: Date,
  bufferHours: number,
  client: Client = db,
  ignoreBookingId?: string,
): Promise<boolean> {
  const blockedUntil = new Date(endAt.getTime() + bufferHours * 3600_000);
  const [booking, unavailability] = await Promise.all([
    client.booking.findFirst({
      where: {
        vehicleId,
        status: { in: [...BLOCKING_STATUSES] },
        id: ignoreBookingId ? { not: ignoreBookingId } : undefined,
        startAt: { lt: blockedUntil },
        blockedUntil: { gt: startAt },
      },
      select: { id: true },
    }),
    client.unavailability.findFirst({
      where: { vehicleId, startAt: { lt: endAt }, endAt: { gt: startAt } },
      select: { id: true },
    }),
  ]);
  return !booking && !unavailability;
}

/** Filtre Prisma : véhicules sans conflit sur la période (utilisé par la recherche). */
export function availableDuring(startAt: Date, endAt: Date, bufferHours: number): Prisma.VehicleWhereInput {
  const blockedUntil = new Date(endAt.getTime() + bufferHours * 3600_000);
  return {
    bookings: {
      none: { status: { in: [...BLOCKING_STATUSES] }, startAt: { lt: blockedUntil }, blockedUntil: { gt: startAt } },
    },
    unavailabilities: { none: { startAt: { lt: endAt }, endAt: { gt: startAt } } },
  };
}
