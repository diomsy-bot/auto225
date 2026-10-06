import { Prisma, PrismaClient } from "@prisma/client";
import { logActivity } from "./activity";
import { isAvailable } from "./availability";
import { db as defaultDb } from "./db";
import { DEFAULT_PRICING_RULES } from "./pricing";

export class ConflictError extends Error {}

/**
 * Confirme une demande. Le véhicule est verrouillé pendant la vérification et une contrainte
 * d'exclusion en base empêche deux confirmations concurrentes sur la même période (ACC-03).
 */
export async function confirmBookingById(
  bookingId: string,
  actorId: string | null,
  bufferHours = DEFAULT_PRICING_RULES.bufferHours,
  db: PrismaClient = defaultDb,
): Promise<void> {
  try {
    await db.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking || booking.status !== "PENDING") throw new ConflictError("Cette demande n'est plus en attente.");
      await tx.$queryRaw`SELECT id FROM "Vehicle" WHERE id = ${booking.vehicleId} FOR UPDATE`;
      if (!(await isAvailable(booking.vehicleId, booking.startAt, booking.endAt, bufferHours, tx, booking.id))) {
        throw new ConflictError("Le véhicule n'est plus disponible sur cette période (réservation confirmée ou indisponibilité).");
      }
      await tx.booking.update({ where: { id: booking.id }, data: { status: "CONFIRMED", decidedAt: new Date() } });
      await logActivity({ actorId, entity: "Booking", entityId: booking.id, action: "status:CONFIRMED" }, tx);
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError || e instanceof Prisma.PrismaClientUnknownRequestError) {
      if (String(e.message).includes("Booking_no_overlap")) throw new ConflictError("Une autre réservation vient d'être confirmée sur cette période.");
    }
    throw e;
  }
}

