import "server-only";
import nodemailer from "nodemailer";

type Mail = { to: string; subject: string; text: string };

const transport = process.env.SMTP_URL ? nodemailer.createTransport(process.env.SMTP_URL) : null;

/** Envoi d'un email transactionnel. Sans SMTP configuré, l'email est affiché dans la console. */
export async function sendMail(mail: Mail): Promise<void> {
  const from = process.env.MAIL_FROM ?? "AUTO225 <no-reply@auto225.com>";
  if (!transport) {
    console.info(`[email] À : ${mail.to}\nObjet : ${mail.subject}\n\n${mail.text}\n`);
    return;
  }
  try {
    await transport.sendMail({ from, ...mail });
  } catch (error) {
    // Une panne d'email ne doit pas faire échouer l'enregistrement d'une demande.
    console.error("[email] échec d'envoi", error);
  }
}

export async function notifyTeam(subject: string, text: string): Promise<void> {
  const to = process.env.TEAM_EMAIL;
  if (to) await sendMail({ to, subject: `[AUTO225] ${subject}`, text });
}

export function appUrl(path = ""): string {
  return `${(process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}${path}`;
}
