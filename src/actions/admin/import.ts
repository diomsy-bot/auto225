"use server";

import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/format";
import type { FormState } from "@/lib/form";
import { AiImportError, extractListing } from "@/lib/listing-ai";
import { toVehicleDraft } from "@/lib/listing-import";
import { UploadError, savePublicImage } from "@/lib/storage";

const MAX_PHOTOS = 12;

/**
 * Saisie assistée : crée une fiche véhicule en BROUILLON à partir de l'annonce envoyée
 * par un vendeur qui a donné son accord. Rien n'est publié sans relecture.
 */
export async function importListingWithAi(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireStaff();
  const text = String(formData.get("text") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim().slice(0, 300);
  const consent = formData.get("consent") === "on";
  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const values = { text, source };

  if (!consent) return { error: "Confirmez que le vendeur a accepté la publication sur AUTO225.", fieldErrors: { consent: "Accord requis." }, values };
  if (text.length < 20) return { error: "Collez le texte de l'annonce (au moins quelques lignes).", fieldErrors: { text: "Texte trop court." }, values };
  if (text.length > 8000) return { error: "Texte trop long (8 000 caractères maximum).", fieldErrors: { text: "Texte trop long." }, values };
  if (photos.length > MAX_PHOTOS) return { error: `${MAX_PHOTOS} photos maximum.`, values };

  let draft;
  try {
    draft = toVehicleDraft(await extractListing(text, photos));
  } catch (e) {
    if (e instanceof AiImportError) return { error: e.message, values };
    throw e;
  }

  const { data, warnings } = draft;
  let slug = slugify(`${data.brand}-${data.model}-${data.year}`);
  if (await db.vehicle.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
  const vehicle = await db.vehicle.create({ data: { ...data, slug } });

  const alt = `${data.brand} ${data.model}`;
  try {
    for (const [position, file] of photos.entries()) {
      const url = await savePublicImage(file, `vehicules/${vehicle.id}`);
      await db.vehiclePhoto.create({ data: { vehicleId: vehicle.id, url, alt, position } });
    }
  } catch (e) {
    if (!(e instanceof UploadError)) throw e;
    warnings.push(`Photos : ${e.message} Ajoutez les photos restantes depuis la fiche.`);
  }

  // Le journal garde la trace de l'accord du vendeur et de la provenance (jamais affichées publiquement).
  await logActivity({ actorId: user.id, entity: "Vehicle", entityId: vehicle.id, action: "imported_ai", data: { consent: true, source, warnings, photos: photos.length } });
  redirect(`/admin/vehicules/${vehicle.id}?importe=1`);
}
