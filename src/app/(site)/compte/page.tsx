import type { Metadata } from "next";
import Link from "next/link";
import { cancelOwnBooking } from "@/actions/account";
import { acceptQuote } from "@/actions/service";
import { logout } from "@/actions/auth";
import { DataRequest, ProfileForm, ResendVerification, ReviewForm } from "@/components/account/forms";
import { StatusBadge } from "@/components/ui/badge";
import { isStaff, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, formatFcfa } from "@/lib/format";
import { APPLICATION_STATUS_LABELS, BOOKING_STATUS_LABELS, DOCUMENT_KIND_LABELS, LEAD_STATUS_LABELS, PAYMENT_STATUS_LABELS, SERVICE_STATUS_LABELS } from "@/lib/labels";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false } };

const TABS = [
  ["reservations", "Réservations"],
  ["services", "Services"],
  ["vente", "Achat & vente"],
  ["documents", "Documents"],
  ["profil", "Profil"],
] as const;

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ onglet?: string; envoye?: string }> }) {
  const user = await requireUser("/compte");
  const { onglet = "reservations", envoye } = await searchParams;
  const [bookings, services, inquiries, proposals, documents, applications] = await Promise.all([
    db.booking.findMany({ where: { userId: user.id }, include: { vehicle: true, review: true }, orderBy: { createdAt: "desc" } }),
    db.serviceRequest.findMany({ where: { userId: user.id }, include: { serviceType: true }, orderBy: { createdAt: "desc" } }),
    db.saleInquiry.findMany({ where: { userId: user.id }, include: { vehicle: true }, orderBy: { createdAt: "desc" } }),
    db.saleProposal.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.document.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.ownerApplication.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-section">Bonjour {user.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isStaff(user) && <Link href="/admin" className="btn-green btn-sm">Administration</Link>}
          {(applications > 0 || user.role === "OWNER") && <Link href="/compte/proprietaire" className="btn-outline btn-sm">Espace propriétaire</Link>}
          <form action={logout}><button className="btn-outline btn-sm">Se déconnecter</button></form>
        </div>
      </div>

      {!user.emailVerifiedAt && (
        <p className="mt-4 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-cta">
          Confirmez votre adresse email pour retrouver toutes vos demandes. <ResendVerification />
        </p>
      )}
      {envoye && <p role="status" className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-brand-green">Proposition {envoye} envoyée. Notre équipe l&apos;étudie.</p>}

      <nav aria-label="Sections du compte" className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(([key, label]) => (
          <Link key={key} href={`/compte?onglet=${key}`} aria-current={onglet === key ? "page" : undefined}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${onglet === key ? "border-brand-orange text-ink" : "border-transparent text-muted hover:text-ink"}`}>
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {onglet === "reservations" && (
          bookings.length === 0 ? <Empty text="Aucune réservation pour le moment." href="/location" cta="Louer un véhicule" /> : (
            <ul className="space-y-4">
              {bookings.map((b) => (
                <li key={b.id} className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">{b.vehicle.brand} {b.vehicle.model} <span className="ml-2 font-mono text-xs text-muted">{b.reference}</span></p>
                    <div className="flex gap-2">
                      <StatusBadge status={b.status} labels={BOOKING_STATUS_LABELS} />
                      {b.status !== "PENDING" && b.status !== "REFUSED" && b.status !== "CANCELLED" && <StatusBadge status={b.paymentStatus} labels={PAYMENT_STATUS_LABELS} />}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-muted">Du {formatDateTime(b.startAt)} au {formatDateTime(b.endAt)} · {b.pickupLocation}</p>
                  <p className="mt-1 text-sm">Total {formatFcfa(b.total)} · caution {formatFcfa(b.deposit)}</p>
                  {b.decisionReason && <p className="mt-1 text-sm text-muted">Motif : {b.decisionReason}</p>}
                  {b.status === "PENDING" && (
                    <form action={cancelOwnBooking} className="mt-3">
                      <input type="hidden" name="id" value={b.id} />
                      <button className="text-sm text-red-700 underline">Annuler ma demande</button>
                    </form>
                  )}
                  {b.status === "COMPLETED" && !b.review && <ReviewForm bookingId={b.id} />}
                </li>
              ))}
            </ul>
          )
        )}

        {onglet === "services" && (
          services.length === 0 ? <Empty text="Aucune demande de service." href="/service-particulier" cta="Demander un devis" /> : (
            <ul className="space-y-4">
              {services.map((s) => (
                <li key={s.id} className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">{s.serviceType.name} <span className="ml-2 font-mono text-xs text-muted">{s.reference}</span></p>
                    <StatusBadge status={s.status} labels={SERVICE_STATUS_LABELS} />
                  </div>
                  <p className="mt-1 text-sm text-muted">{formatDate(s.date)} à {s.time} · {s.departure}{s.destination ? ` → ${s.destination}` : ""}</p>
                  {s.quoteAmount != null && <p className="mt-2 text-sm">Devis : <strong>{formatFcfa(s.quoteAmount)}</strong>{s.quoteNote ? ` — ${s.quoteNote}` : ""}</p>}
                  {s.status === "QUOTED" && (
                    <form action={acceptQuote} className="mt-3">
                      <input type="hidden" name="id" value={s.id} />
                      <button className="btn-primary btn-sm">Accepter le devis</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )
        )}

        {onglet === "vente" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold">Mes demandes sur des véhicules à vendre</h2>
              {inquiries.length === 0 ? <p className="mt-2 text-sm text-muted">Aucune demande.</p> : (
                <ul className="mt-3 space-y-2">
                  {inquiries.map((i) => (
                    <li key={i.id} className="card flex items-center justify-between p-4 text-sm">
                      <span>{i.vehicle.brand} {i.vehicle.model} · {i.kind === "VISIT" ? "Visite" : "Renseignements"} <span className="font-mono text-xs text-muted">{i.reference}</span></span>
                      <StatusBadge status={i.status} labels={LEAD_STATUS_LABELS} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Mes véhicules proposés à la vente</h2>
                <Link href="/achat-vente/proposer" className="btn-outline btn-sm">Proposer un véhicule</Link>
              </div>
              {proposals.length === 0 ? <p className="mt-2 text-sm text-muted">Aucune proposition.</p> : (
                <ul className="mt-3 space-y-2">
                  {proposals.map((p) => (
                    <li key={p.id} className="card p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span>{p.brand} {p.model} {p.year} · {formatFcfa(p.askingPrice)} <span className="font-mono text-xs text-muted">{p.reference}</span></span>
                        <StatusBadge status={p.status} labels={APPLICATION_STATUS_LABELS} />
                      </div>
                      {p.adminNote && <p className="mt-1 text-muted">Message de l&apos;équipe : {p.adminNote}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {onglet === "documents" && (
          documents.length === 0 ? <p className="text-sm text-muted">Aucun document déposé.</p> : (
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span><span className="font-medium">{DOCUMENT_KIND_LABELS[d.kind]}</span> · {formatDate(d.createdAt)}</span>
                  <a href={`/api/documents/${d.id}`} target="_blank" className="text-brand-green underline">{d.originalName}</a>
                </li>
              ))}
            </ul>
          )
        )}

        {onglet === "profil" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="card p-5"><ProfileForm user={user} /></div>
            <div className="card space-y-3 p-5 text-sm">
              <h2 className="font-bold">Vos données</h2>
              <p className="text-muted">Vous pouvez demander l&apos;accès à vos données ou leur suppression. Certaines informations liées aux réservations peuvent être conservées pour les obligations légales.</p>
              <DataRequest />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="card p-8 text-center">
      <p className="text-muted">{text}</p>
      <Link href={href} className="btn-green mt-4">{cta}</Link>
    </div>
  );
}
