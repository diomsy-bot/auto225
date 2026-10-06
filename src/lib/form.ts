import { z } from "zod";

export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

export const initialFormState: FormState = {};

/** Valide un FormData avec un schéma zod ; renvoie les erreurs par champ en français. */
export function parseForm<T extends z.ZodType>(schema: T, formData: FormData):
  | { success: true; data: z.infer<T> }
  | { success: false; state: FormState } {
  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    if (key in raw) {
      raw[key] = ([] as unknown[]).concat(raw[key], value);
    } else {
      raw[key] = value;
    }
  }
  const result = schema.safeParse(raw);
  if (result.success) return { success: true, data: result.data };
  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  const values = Object.fromEntries(Object.entries(raw).filter(([, v]) => typeof v === "string")) as Record<string, string>;
  return { success: false, state: { error: "Merci de corriger les champs indiqués.", fieldErrors, values } };
}

// Champs réutilisables, messages en français.
export const zText = (label: string, max = 200) =>
  z.string({ error: `${label} est requis.` }).trim().min(1, `${label} est requis.`).max(max, `${label} est trop long.`);
export const zOptionalText = (max = 2000) => z.string().trim().max(max, "Texte trop long.").optional().default("");
export const zEmail = z.string({ error: "Email requis." }).trim().toLowerCase().email("Adresse email invalide.").max(200);
export const zPhone = z
  .string({ error: "Téléphone requis." })
  .trim()
  .regex(/^\+?[0-9 ().-]{8,20}$/, "Numéro de téléphone invalide.");
export const zInt = (label: string, min = 0, max = 1_000_000_000) =>
  z.coerce.number({ error: `${label} doit être un nombre.` }).int(`${label} doit être un nombre entier.`).min(min, `${label} : minimum ${min}.`).max(max, `${label} : maximum ${max}.`);
export const zOptionalInt = (label: string, min = 0, max = 1_000_000_000) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), zInt(label, min, max).optional());
export const zCheckbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());
export const zPassword = z
  .string({ error: "Mot de passe requis." })
  .min(10, "Le mot de passe doit contenir au moins 10 caractères.")
  .max(200)
  .regex(/[A-Za-z]/, "Le mot de passe doit contenir au moins une lettre.")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre.");
