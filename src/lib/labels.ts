import type {
  ApplicationStatus,
  BookingStatus,
  Category,
  DocumentKind,
  Fuel,
  LeadStatus,
  PaymentStatus,
  Role,
  SaleStatus,
  ServiceRequestStatus,
  Transmission,
  UnavailabilityReason,
  VehicleStatus,
} from "@prisma/client";

export const CATEGORY_LABELS: Record<Category, string> = {
  CITADINE: "Citadine",
  BERLINE: "Berline",
  SUV: "SUV",
  QUATRE_QUATRE: "4x4",
  PICKUP: "Pick-up",
  MINIBUS: "Minibus",
  PRESTIGE: "Prestige",
  UTILITAIRE: "Utilitaire",
};

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  MANUAL: "Manuelle",
  AUTOMATIC: "Automatique",
};

export const FUEL_LABELS: Record<Fuel, string> = {
  PETROL: "Essence",
  DIESEL: "Diesel",
  HYBRID: "Hybride",
  ELECTRIC: "Électrique",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  REFUSED: "Refusée",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Non payé",
  PARTIAL: "Partiellement payé",
  PAID: "Payé",
  REFUNDED: "Remboursé",
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Brouillon",
  SUBMITTED: "Soumis",
  INCOMPLETE: "À compléter",
  IN_REVIEW: "En vérification",
  APPROVED: "Validé",
  REJECTED: "Refusé",
  SUSPENDED: "Suspendu",
};

export const SERVICE_STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  NEW: "Nouvelle",
  INFO_REQUESTED: "Précisions demandées",
  QUOTED: "Devis envoyé",
  ACCEPTED: "Devis accepté",
  SCHEDULED: "Planifiée",
  DONE: "Réalisée",
  CANCELLED: "Annulée",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Nouvelle",
  IN_PROGRESS: "En cours",
  CLOSED: "Clôturée",
};

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Réservé",
  SOLD: "Vendu",
};

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
};

export const ROLE_LABELS: Record<Role, string> = {
  CLIENT: "Client",
  OWNER: "Propriétaire",
  MANAGER: "Gestionnaire",
  ADMIN: "Administrateur",
};

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  VEHICLE_PHOTO: "Photo du véhicule",
  OWNERSHIP_PROOF: "Preuve de propriété ou mandat",
  VEHICLE_PAPERS: "Documents du véhicule",
  INSURANCE: "Assurance",
  IDENTITY: "Pièce d'identité",
  DRIVING_LICENSE: "Permis de conduire",
  OTHER: "Autre",
};

export const UNAVAILABILITY_LABELS: Record<UnavailabilityReason, string> = {
  MAINTENANCE: "Entretien",
  OWNER: "Indisponibilité propriétaire",
  OTHER: "Autre",
};

export function enumOptions<T extends string>(labels: Record<T, string>) {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}
