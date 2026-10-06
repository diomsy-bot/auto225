// Nécessite une base PostgreSQL (DATABASE_URL) avec les migrations appliquées.
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ConflictError, confirmBookingById } from "@/lib/booking-ops";
import { isAvailable } from "@/lib/availability";

const db = new PrismaClient();
let vehicleId = "";

async function pending(start: string, end: string, ref: string) {
  const startAt = new Date(start);
  const endAt = new Date(end);
  return db.booking.create({
    data: {
      reference: ref, vehicleId, customerName: "Test", customerEmail: "test@example.com", customerPhone: "0700000000",
      pickupLocation: "Plateau", startAt, endAt, blockedUntil: new Date(endAt.getTime() + 2 * 3600_000),
      billedDays: 1, unitPrice: 1, rentalTotal: 1, total: 1,
    },
  });
}

beforeAll(async () => {
  const v = await db.vehicle.create({
    data: { slug: `test-${Date.now()}`, brand: "Test", model: "Concurrence", year: 2024, category: "BERLINE", transmission: "AUTOMATIC", fuel: "PETROL", seats: 5, dailyPrice: 1000, status: "DRAFT" },
  });
  vehicleId = v.id;
});

afterAll(async () => {
  await db.activityLog.deleteMany({ where: { entity: "Booking", entityId: { in: (await db.booking.findMany({ where: { vehicleId }, select: { id: true } })).map((b) => b.id) } } });
  await db.booking.deleteMany({ where: { vehicleId } });
  await db.unavailability.deleteMany({ where: { vehicleId } });
  await db.vehicle.delete({ where: { id: vehicleId } });
  await db.$disconnect();
});

describe("confirmations concurrentes (ACC-03)", () => {
  it("une seule de deux demandes qui se chevauchent peut être confirmée, même en parallèle", async () => {
    const tag = Date.now().toString(36).toUpperCase();
    const a = await pending("2027-01-10T09:00Z", "2027-01-12T09:00Z", `T-A-${tag}`);
    const b = await pending("2027-01-11T09:00Z", "2027-01-13T09:00Z", `T-B-${tag}`);
    const results = await Promise.allSettled([confirmBookingById(a.id, null, 2, db), confirmBookingById(b.id, null, 2, db)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(ConflictError);
    expect(await db.booking.count({ where: { vehicleId, status: "CONFIRMED" } })).toBe(1);
  });

  it("la contrainte en base refuse un chevauchement même sans passer par l'application", async () => {
    const tag = Date.now().toString(36).toUpperCase();
    const c = await pending("2027-02-01T09:00Z", "2027-02-03T09:00Z", `T-C-${tag}`);
    const d = await pending("2027-02-02T09:00Z", "2027-02-04T09:00Z", `T-D-${tag}`);
    await db.booking.update({ where: { id: c.id }, data: { status: "CONFIRMED" } });
    await expect(db.booking.update({ where: { id: d.id }, data: { status: "CONFIRMED" } })).rejects.toThrow(/Booking_no_overlap/);
  });

  it("la marge entre deux locations est respectée et une annulation libère la période", async () => {
    const tag = Date.now().toString(36).toUpperCase();
    const e = await pending("2027-03-01T09:00Z", "2027-03-02T09:00Z", `T-E-${tag}`);
    await confirmBookingById(e.id, null, 2, db);
    expect(await isAvailable(vehicleId, new Date("2027-03-02T10:00Z"), new Date("2027-03-03T10:00Z"), 2, db)).toBe(false);
    expect(await isAvailable(vehicleId, new Date("2027-03-02T11:00Z"), new Date("2027-03-03T11:00Z"), 2, db)).toBe(true);
    await db.booking.update({ where: { id: e.id }, data: { status: "CANCELLED" } });
    expect(await isAvailable(vehicleId, new Date("2027-03-01T10:00Z"), new Date("2027-03-01T20:00Z"), 2, db)).toBe(true);
  });

  it("une indisponibilité bloque la recherche", async () => {
    await db.unavailability.create({ data: { vehicleId, startAt: new Date("2027-04-01T00:00Z"), endAt: new Date("2027-04-05T00:00Z"), reason: "MAINTENANCE" } });
    expect(await isAvailable(vehicleId, new Date("2027-04-03T09:00Z"), new Date("2027-04-06T09:00Z"), 2, db)).toBe(false);
  });
});
