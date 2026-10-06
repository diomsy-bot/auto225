"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import QRCode from "qrcode";
import { logActivity } from "@/lib/activity";
import {
  consumeAuthToken,
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  issueAuthToken,
  markSessionMfaVerified,
  verifyPassword,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { parseForm, zCheckbox, zEmail, zPassword, zPhone, zText, type FormState } from "@/lib/form";
import { appUrl, sendMail } from "@/lib/mail";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { generateTotpSecret, totpUri, verifyTotp } from "@/lib/totp";

function safeNext(next: unknown, fallback = "/compte"): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

async function sendVerification(userId: string, email: string, name: string) {
  const token = await issueAuthToken(userId, "EMAIL_VERIFICATION", 60 * 48);
  await sendMail({
    to: email,
    subject: "Confirmez votre adresse email — AUTO225",
    text: `Bonjour ${name},\n\nMerci de confirmer votre adresse email en ouvrant ce lien (valable 48 h) :\n${appUrl(`/verifier-email/${token}`)}\n\nL'équipe AUTO225`,
  });
}

const registerSchema = z
  .object({
    name: zText("Le nom"),
    email: zEmail,
    phone: zPhone,
    password: zPassword,
    confirm: z.string(),
    marketing: zCheckbox,
    accept: z.literal("on", { error: "Vous devez accepter les conditions." }),
    suite: z.string().optional(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Les mots de passe ne correspondent pas." });

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(registerSchema, formData);
  if (!parsed.success) return parsed.state;
  const d = parsed.data;
  if (!(await rateLimit(`register:${await clientIp()}`, 5, 3600))) return { error: "Trop de tentatives. Réessayez plus tard." };
  const existing = await db.user.findUnique({ where: { email: d.email } });
  if (existing) return { error: "Un compte existe déjà avec cet email.", fieldErrors: { email: "Email déjà utilisé. Connectez-vous ou réinitialisez votre mot de passe." } };
  const user = await db.user.create({
    data: { name: d.name, email: d.email, phone: d.phone, passwordHash: await hashPassword(d.password), marketingOptIn: d.marketing },
  });
  await sendVerification(user.id, user.email, user.name);
  await createSession(user.id);
  redirect(safeNext(d.suite));
}

const loginSchema = z.object({ email: zEmail, password: z.string().min(1, "Mot de passe requis."), suite: z.string().optional() });

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(loginSchema, formData);
  if (!parsed.success) return parsed.state;
  const { email, password, suite } = parsed.data;
  const ip = await clientIp();
  if (!(await rateLimit(`login:${ip}:${email}`, 8, 900)) || !(await rateLimit(`login-ip:${ip}`, 30, 900))) {
    return { error: "Trop de tentatives de connexion. Réessayez dans 15 minutes." };
  }
  const user = await db.user.findUnique({ where: { email } });
  const ok = user && !user.disabledAt && (await verifyPassword(password, user.passwordHash));
  if (!ok) return { error: "Email ou mot de passe incorrect.", values: { email } };
  await createSession(user.id);
  if (user.role === "ADMIN") redirect(user.totpEnabledAt ? "/admin-securite/verifier" : "/admin-securite/activer");
  redirect(safeNext(suite, user.role === "MANAGER" ? "/admin" : "/compte"));
}

/** Confirme l'email puis rattache au compte les demandes déjà envoyées avec cette adresse. */
export async function verifyEmailToken(token: string): Promise<boolean> {
  const record = await consumeAuthToken(token, "EMAIL_VERIFICATION");
  if (!record) return false;
  const user = await db.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } });
  await db.booking.updateMany({ where: { customerEmail: user.email, userId: null }, data: { userId: user.id } });
  await db.serviceRequest.updateMany({ where: { email: user.email, userId: null }, data: { userId: user.id } });
  await db.saleInquiry.updateMany({ where: { email: user.email, userId: null }, data: { userId: user.id } });
  return true;
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function resendVerification(): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user || user.emailVerifiedAt) return {};
  if (!(await rateLimit(`verify:${user.id}`, 3, 3600))) return { error: "Trop de demandes. Réessayez plus tard." };
  await sendVerification(user.id, user.email, user.name);
  return { message: "Un nouveau lien de confirmation vous a été envoyé." };
}

export async function forgotPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(z.object({ email: zEmail }), formData);
  if (!parsed.success) return parsed.state;
  const { email } = parsed.data;
  if (!(await rateLimit(`forgot:${await clientIp()}`, 5, 3600))) return { error: "Trop de demandes. Réessayez plus tard." };
  const user = await db.user.findUnique({ where: { email } });
  if (user && !user.disabledAt) {
    const token = await issueAuthToken(user.id, "PASSWORD_RESET", 60);
    await sendMail({
      to: email,
      subject: "Réinitialisation de votre mot de passe — AUTO225",
      text: `Bonjour ${user.name},\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valable 1 h) :\n${appUrl(`/reinitialiser/${token}`)}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\nL'équipe AUTO225`,
    });
  }
  // Même réponse que le compte existe ou non.
  return { message: "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé." };
}

const resetSchema = z
  .object({ token: z.string().min(10), password: zPassword, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Les mots de passe ne correspondent pas." });

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(resetSchema, formData);
  if (!parsed.success) return parsed.state;
  const record = await consumeAuthToken(parsed.data.token, "PASSWORD_RESET");
  if (!record) return { error: "Ce lien est invalide ou a expiré. Faites une nouvelle demande." };
  await db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(parsed.data.password) } });
  // Déconnecte toutes les sessions existantes.
  await db.session.deleteMany({ where: { userId: record.userId } });
  await logActivity({ actorId: record.userId, entity: "User", entityId: record.userId, action: "password_reset" });
  redirect("/connexion?reinitialise=1");
}

// ─── Second facteur des administrateurs ─────────────────────────────────────

export async function startTotpEnrollment(): Promise<{ secret: string; qr: string } | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN" || user.totpEnabledAt) return null;
  const secret = user.totpSecret ?? generateTotpSecret();
  if (!user.totpSecret) await db.user.update({ where: { id: user.id }, data: { totpSecret: secret } });
  return { secret, qr: await QRCode.toDataURL(totpUri(secret, user.email), { margin: 1, width: 220 }) };
}

export async function confirmTotp(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/connexion");
  if (!(await rateLimit(`totp:${user.id}`, 10, 900))) return { error: "Trop de tentatives. Réessayez dans 15 minutes." };
  const code = String(formData.get("code") ?? "");
  if (!user.totpSecret || !verifyTotp(user.totpSecret, code)) return { error: "Code incorrect. Vérifiez l'heure de votre téléphone et réessayez." };
  if (!user.totpEnabledAt) {
    await db.user.update({ where: { id: user.id }, data: { totpEnabledAt: new Date() } });
    await logActivity({ actorId: user.id, entity: "User", entityId: user.id, action: "totp_enabled" });
  }
  await markSessionMfaVerified();
  redirect("/admin");
}
