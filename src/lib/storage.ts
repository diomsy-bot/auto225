import "server-only";
import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";

// Deux espaces séparés : médias publics (photos des annonces) et justificatifs privés.
const ROOT = path.resolve(process.env.STORAGE_DIR ?? "./storage");
const PUBLIC_DIR = path.join(ROOT, "public");
const PRIVATE_DIR = path.join(ROOT, "private");

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DOCUMENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export class UploadError extends Error {}

function safeJoin(base: string, key: string): string {
  const full = path.resolve(base, key);
  if (!full.startsWith(base + path.sep)) throw new UploadError("Chemin de fichier invalide.");
  return full;
}

async function readUpload(file: File, maxBytes: number, allowed: Set<string>) {
  if (file.size === 0) throw new UploadError("Fichier vide.");
  if (file.size > maxBytes) throw new UploadError(`Fichier trop volumineux (maximum ${maxBytes / 1024 / 1024} Mo).`);
  const buffer = Buffer.from(await file.arrayBuffer());
  // Vérification du type réel à partir du contenu, pas de l'extension.
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !allowed.has(detected.mime)) {
    throw new UploadError("Format non accepté. Formats autorisés : JPG, PNG, WebP" + (allowed.has("application/pdf") ? ", PDF." : "."));
  }
  return { buffer, mime: detected.mime, ext: detected.ext };
}

/** Enregistre une photo publique, ré-encodée en WebP (métadonnées supprimées, taille limitée). */
export async function savePublicImage(file: File, folder: string): Promise<string> {
  const { buffer } = await readUpload(file, MAX_IMAGE_BYTES, IMAGE_TYPES);
  const output = await sharp(buffer).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  const key = `${folder}/${randomUUID()}.webp`;
  const full = safeJoin(PUBLIC_DIR, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, output);
  return `/media/${key}`;
}

export async function readPublicMedia(key: string): Promise<Buffer | null> {
  try {
    return await readFile(safeJoin(PUBLIC_DIR, key));
  } catch {
    return null;
  }
}

export async function deletePublicMedia(url: string): Promise<void> {
  if (!url.startsWith("/media/")) return;
  await unlink(safeJoin(PUBLIC_DIR, url.slice("/media/".length))).catch(() => undefined);
}

/** Enregistre un justificatif privé. Le fichier n'est accessible que via un contrôle d'accès. */
export async function savePrivateDocument(file: File) {
  const { buffer, mime, ext } = await readUpload(file, MAX_DOCUMENT_BYTES, DOCUMENT_TYPES);
  const key = `${new Date().getUTCFullYear()}/${randomUUID()}.${ext}`;
  const full = safeJoin(PRIVATE_DIR, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buffer);
  return { storageKey: key, mimeType: mime, size: buffer.length, originalName: file.name.slice(0, 200) };
}

export async function readPrivateDocument(key: string): Promise<Buffer | null> {
  try {
    return await readFile(safeJoin(PRIVATE_DIR, key));
  } catch {
    return null;
  }
}

export async function deletePrivateDocument(key: string): Promise<void> {
  await unlink(safeJoin(PRIVATE_DIR, key)).catch(() => undefined);
}
