/**
 * SSOT for adoption listing and application status display config.
 * Enum values must match adoptionListingStatusEnum / adoptionApplicationStatusEnum
 * in lib/db/schema.ts.
 * Icons are intentionally excluded — they are React components and belong in the UI layer.
 */

export const LISTING_STATUS_CONFIG = {
  available: { label: "Available", color: "text-[var(--green)]",  bg: "bg-[var(--green-bg)]" },
  on_hold:   { label: "On hold",   color: "text-[var(--warn)]",   bg: "bg-[var(--warn-bg)]" },
  adopted:   { label: "Adopted",   color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]" },
  withdrawn: { label: "Withdrawn", color: "text-[var(--muted)]",  bg: "bg-[var(--off)]" },
} as const;

export type ListingStatusId = keyof typeof LISTING_STATUS_CONFIG;

export const APPLICATION_STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "text-[var(--warn)]",   bg: "bg-[var(--warn-bg)]" },
  approved:  { label: "Approved",  color: "text-[var(--green)]",  bg: "bg-[var(--green-bg)]" },
  rejected:  { label: "Rejected",  color: "text-[var(--muted)]",  bg: "bg-[var(--off)]" },
  withdrawn: { label: "Withdrawn", color: "text-[var(--muted)]",  bg: "bg-[var(--off)]" },
} as const;

export type ApplicationStatusId = keyof typeof APPLICATION_STATUS_CONFIG;

/** Combined bg+color Tailwind class string for badge use. */
export function listingStatusClass(status: string): string {
  const cfg = LISTING_STATUS_CONFIG[status as ListingStatusId];
  return cfg ? `${cfg.bg} ${cfg.color}` : "bg-[var(--off)] text-[var(--muted)]";
}

export function applicationStatusClass(status: string): string {
  const cfg = APPLICATION_STATUS_CONFIG[status as ApplicationStatusId];
  return cfg ? `${cfg.bg} ${cfg.color}` : "bg-[var(--off)] text-[var(--muted)]";
}
