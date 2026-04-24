/**
 * SSOT for adoption listing and application status display config.
 * Enum values must match adoptionListingStatusEnum / adoptionApplicationStatusEnum
 * in lib/db/schema.ts.
 * Icons are intentionally excluded — they are React components and belong in the UI layer.
 */

export const LISTING_STATUS_CONFIG = {
  available: { label: "Available", color: "text-[var(--green)]",  bg: "bg-[var(--green-bg)]",    className: "bg-[var(--green-bg)] text-[var(--green)]" },
  on_hold:   { label: "On hold",   color: "text-[var(--warn)]",   bg: "bg-[var(--warn-bg)]",     className: "bg-[var(--warn-bg)] text-[var(--warn)]" },
  adopted:   { label: "Adopted",   color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]",  className: "bg-[var(--teal-light)] text-[var(--teal)]" },
  withdrawn: { label: "Withdrawn", color: "text-[var(--muted)]",  bg: "bg-[var(--off)]",         className: "bg-[var(--off)] text-[var(--muted)]" },
} as const;

export type ListingStatusId = keyof typeof LISTING_STATUS_CONFIG;

export const APPLICATION_STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "text-[var(--warn)]",   bg: "bg-[var(--warn-bg)]",  className: "bg-[var(--warn-bg)] text-[var(--warn)]" },
  approved:  { label: "Approved",  color: "text-[var(--green)]",  bg: "bg-[var(--green-bg)]", className: "bg-[var(--green-bg)] text-[var(--green)]" },
  rejected:  { label: "Rejected",  color: "text-[var(--muted)]",  bg: "bg-[var(--off)]",      className: "bg-[var(--off)] text-[var(--muted)]" },
  withdrawn: { label: "Withdrawn", color: "text-[var(--muted)]",  bg: "bg-[var(--off)]",      className: "bg-[var(--off)] text-[var(--muted)]" },
} as const;

export type ApplicationStatusId = keyof typeof APPLICATION_STATUS_CONFIG;
