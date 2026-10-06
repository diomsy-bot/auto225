import { randomBytes } from "crypto";

// Référence lisible et non devinable, ex. LOC-26-7KQ4PX.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeReference(prefix: "LOC" | "PRO" | "SRV" | "VTE" | "PVV"): string {
  const bytes = randomBytes(6);
  let code = "";
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  const year = String(new Date().getUTCFullYear()).slice(2);
  return `${prefix}-${year}-${code}`;
}
