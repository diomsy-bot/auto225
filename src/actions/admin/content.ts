"use server";

import { revalidatePath } from "next/cache";
import type { Prisma, Role } from "@prisma/client";
import { logActivity } from "@/lib/activity";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form";
import { slugify } from "@/lib/format";

const str = (fd: FormData, k: string, max = 2000) => String(fd.get(k) ?? "").trim().slice(0, max);

function refreshSite() {
  revalidatePath("/", "layout");
}

// ─── Sections de l'accueil (ordre, titres, affichage) ──────────────────────

export async function saveHomeSections(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireStaff();
  const keys = formData.getAll("key").map(String);
  for (const key of keys) {
    await db.homeSection.update({
      where: { key },
      data: {
        title: str(formData, `title:${key}`, 200),
        subtitle: str(formData, `subtitle:${key}`, 500),
        enabled: formData.get(`enabled:${key}`) === "on",
        position: Number(formData.get(`position:${key}`) ?? 0) || 0,
      },
    });
  }
  await logActivity({ actorId: user.id, entity: "Content", entityId: "home", action: "sections_updated" });
  refreshSite();
  return { message: "Accueil mis à jour." };
}

// ─── FAQ, avantages, prestations ───────────────────────────────────────────

export async function saveFaq(formData: FormData): Promise<void> {
  const user = await requireStaff();
  const id = str(formData, "id");
  const op = str(formData, "op");
  if (op === "delete" && id) await db.faq.delete({ where: { id } });
  else {
    const data = { question: str(formData, "question", 300), answer: str(formData, "answer", 3000), position: Number(formData.get("position") ?? 0) || 0, published: formData.get("published") === "on" };
    if (!data.question || !data.answer) return;
    if (id) await db.faq.update({ where: { id }, data });
    else await db.faq.create({ data });
  }
  await logActivity({ actorId: user.id, entity: "Content", entityId: "faq", action: op || "saved" });
  refreshSite();
}

export async function saveAdvantage(formData: FormData): Promise<void> {
  const user = await requireStaff();
  const id = str(formData, "id");
  const op = str(formData, "op");
  if (op === "delete" && id) await db.advantage.delete({ where: { id } });
  else {
    const data = { title: str(formData, "title", 120), description: str(formData, "description", 500), position: Number(formData.get("position") ?? 0) || 0, published: formData.get("published") === "on" };
    if (!data.title) return;
    if (id) await db.advantage.update({ where: { id }, data });
    else await db.advantage.create({ data });
  }
  await logActivity({ actorId: user.id, entity: "Content", entityId: "advantages", action: op || "saved" });
  refreshSite();
}

export async function saveServiceType(formData: FormData): Promise<void> {
  const user = await requireStaff();
  const id = str(formData, "id");
  const data = {
    name: str(formData, "name", 120),
    description: str(formData, "description", 1000),
    priceLabel: str(formData, "priceLabel", 60) || "Sur devis",
    position: Number(formData.get("position") ?? 0) || 0,
    active: formData.get("active") === "on",
  };
  if (!data.name) return;
  if (id) await db.serviceType.update({ where: { id }, data });
  else await db.serviceType.create({ data: { ...data, slug: `${slugify(data.name)}-${Date.now().toString(36)}` } });
  await logActivity({ actorId: user.id, entity: "Content", entityId: "services", action: "saved" });
  refreshSite();
}

export async function moderateReview(formData: FormData): Promise<void> {
  const user = await requireStaff();
  const id = str(formData, "id");
  const status = str(formData, "status") as "APPROVED" | "REJECTED";
  if (!["APPROVED", "REJECTED"].includes(status)) return;
  await db.review.update({ where: { id }, data: { status } });
  await logActivity({ actorId: user.id, entity: "Review", entityId: id, action: `status:${status}` });
  refreshSite();
}

// ─── Utilisateurs et paramètres (administrateurs uniquement) ───────────────

export async function updateUser(formData: FormData): Promise<void> {
  const admin = await requireStaff(["ADMIN"]);
  const id = str(formData, "id");
  if (id === admin.id) return; // On ne modifie pas ses propres droits.
  const role = str(formData, "role") as Role;
  const disable = formData.get("disabled") === "on";
  if (!["CLIENT", "OWNER", "MANAGER", "ADMIN"].includes(role)) return;
  await db.user.update({ where: { id }, data: { role, disabledAt: disable ? new Date() : null } });
  // Retrait immédiat des accès : toutes les sessions sont fermées.
  if (disable) await db.session.deleteMany({ where: { userId: id } });
  await logActivity({ actorId: admin.id, entity: "User", entityId: id, action: "access_updated", data: { role, disabled: disable } });
  revalidatePath("/admin/utilisateurs");
}

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireStaff(["ADMIN"]);
  const lines = (k: string) => str(formData, k, 5000).split("\n").map((l) => l.trim()).filter(Boolean);
  const int = (k: string, def: number) => {
    const n = Number(formData.get(k));
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : def;
  };
  const discounts = lines("discounts")
    .map((l) => l.match(/^(\d+)\s*[:=]\s*(\d+(?:\.\d+)?)/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => ({ minDays: Number(m[1]), percent: Math.min(90, Number(m[2])) }));

  const values: Record<string, Prisma.InputJsonValue> = {
    contact: {
      companyName: str(formData, "companyName", 120),
      address: str(formData, "address", 300),
      phone: str(formData, "phone", 40),
      whatsapp: str(formData, "whatsapp", 40).replace(/\D/g, ""),
      email: str(formData, "email", 200),
      hours: str(formData, "hours", 200),
      confirmed: formData.get("confirmed") === "on",
    },
    pricing: {
      blockHours: Math.max(1, int("blockHours", 24)),
      graceMinutes: int("graceMinutes", 60),
      bufferHours: int("bufferHours", 2),
      taxPercent: Math.min(100, int("taxPercent", 0)),
      serviceFee: int("serviceFee", 0),
      discounts,
    },
    operations: { pickupLocations: lines("pickupLocations"), cities: lines("cities") },
    heroVideo: { url: str(formData, "heroVideoUrl", 500), poster: str(formData, "heroVideoPoster", 500) },
  };
  for (const [key, value] of Object.entries(values)) {
    await db.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
  }
  await logActivity({ actorId: admin.id, entity: "Settings", entityId: "global", action: "updated", data: values.pricing });
  refreshSite();
  return { message: "Paramètres enregistrés." };
}
