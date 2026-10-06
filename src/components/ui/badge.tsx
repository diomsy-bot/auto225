const TONES = {
  green: "bg-green-50 text-brand-green",
  orange: "bg-orange-50 text-orange-cta",
  gray: "bg-surface text-muted",
  red: "bg-red-50 text-red-700",
  blue: "bg-blue-50 text-blue-800",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({ tone = "gray", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`badge ${TONES[tone]}`}>{children}</span>;
}

const STATUS_TONES: Record<string, Tone> = {
  PENDING: "orange",
  CONFIRMED: "green",
  IN_PROGRESS: "blue",
  COMPLETED: "gray",
  CANCELLED: "gray",
  REFUSED: "red",
  DRAFT: "gray",
  SUBMITTED: "orange",
  INCOMPLETE: "orange",
  IN_REVIEW: "blue",
  APPROVED: "green",
  REJECTED: "red",
  SUSPENDED: "red",
  NEW: "orange",
  INFO_REQUESTED: "orange",
  QUOTED: "blue",
  ACCEPTED: "green",
  SCHEDULED: "green",
  DONE: "gray",
  CLOSED: "gray",
  AVAILABLE: "green",
  RESERVED: "orange",
  SOLD: "red",
  PUBLISHED: "green",
  ARCHIVED: "gray",
  UNPAID: "orange",
  PARTIAL: "blue",
  PAID: "green",
  REFUNDED: "gray",
};

export function StatusBadge({ status, labels }: { status: string; labels: Record<string, string> }) {
  return <Badge tone={STATUS_TONES[status] ?? "gray"}>{labels[status] ?? status}</Badge>;
}
