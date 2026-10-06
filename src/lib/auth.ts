import "server-only";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthTokenKind, Role, User } from "@prisma/client";
import { db } from "./db";

const SESSION_COOKIE = "auto225_session";
const SESSION_DAYS = 14;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, mfaVerified = false): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt, mfaVerified } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

async function currentSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date() || session.user.disabledAt) return null;
  return session;
}

export async function markSessionMfaVerified(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) await db.session.update({ where: { tokenHash: hashToken(token) }, data: { mfaVerified: true } });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  return (await currentSession())?.user ?? null;
}

export async function requireUser(next = "/compte"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?suite=${encodeURIComponent(next)}`);
  return user;
}

export const STAFF_ROLES: Role[] = ["MANAGER", "ADMIN"];

export function isStaff(user: Pick<User, "role"> | null | undefined): boolean {
  return !!user && STAFF_ROLES.includes(user.role);
}

/**
 * Accès à l'administration : rôle gestionnaire ou administrateur,
 * et second facteur (TOTP) obligatoire pour les administrateurs.
 */
export async function requireStaff(roles: Role[] = STAFF_ROLES): Promise<User> {
  const session = await currentSession();
  if (!session) redirect("/connexion?suite=/admin");
  const user = session.user;
  if (!roles.includes(user.role)) redirect("/compte");
  if (user.role === "ADMIN") {
    if (!user.totpEnabledAt) redirect("/admin-securite/activer");
    if (!session.mfaVerified) redirect("/admin-securite/verifier");
  }
  return user;
}

export async function issueAuthToken(userId: string, kind: AuthTokenKind, ttlMinutes: number): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.authToken.create({
    data: { tokenHash: hashToken(token), kind, userId, expiresAt: new Date(Date.now() + ttlMinutes * 60_000) },
  });
  return token;
}

export async function consumeAuthToken(token: string, kind: AuthTokenKind) {
  const record = await db.authToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.kind !== kind || record.usedAt || record.expiresAt < new Date()) return null;
  await db.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return record;
}
