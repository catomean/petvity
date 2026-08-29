/**
 * SSOT for adoption listing and application status display config.
 * Enum values must match adoptionListingStatusEnum / adoptionApplicationStatusEnum
 * in lib/db/schema.ts.
 * Icons are intentionally excluded — they are React components and belong in the UI layer.
 */

export const LISTING_STATUS_CONFIG = {
  available: {
    label: "Available",
    color: "text-[var(--green)]",
    bg: "bg-[var(--green-bg)]",
    className: "bg-[var(--green-bg)] text-[var(--green)]",
  },
  on_hold: {
    label: "On hold",
    color: "text-[var(--warn)]",
    bg: "bg-[var(--warn-bg)]",
    className: "bg-[var(--warn-bg)] text-[var(--warn)]",
  },
  adopted: {
    label: "Adopted",
    color: "text-[var(--teal)]",
    bg: "bg-[var(--teal-light)]",
    className: "bg-[var(--teal-light)] text-[var(--teal)]",
  },
  withdrawn: {
    label: "Withdrawn",
    color: "text-[var(--muted)]",
    bg: "bg-[var(--off)]",
    className: "bg-[var(--off)] text-[var(--muted)]",
  },
} as const;

export type ListingStatusId = keyof typeof LISTING_STATUS_CONFIG;

export const APPLICATION_STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "text-[var(--warn)]",
    bg: "bg-[var(--warn-bg)]",
    className: "bg-[var(--warn-bg)] text-[var(--warn)]",
  },
  approved: {
    label: "Approved",
    color: "text-[var(--green)]",
    bg: "bg-[var(--green-bg)]",
    className: "bg-[var(--green-bg)] text-[var(--green)]",
  },
  rejected: {
    label: "Rejected",
    color: "text-[var(--muted)]",
    bg: "bg-[var(--off)]",
    className: "bg-[var(--off)] text-[var(--muted)]",
  },
  withdrawn: {
    label: "Withdrawn",
    color: "text-[var(--muted)]",
    bg: "bg-[var(--off)]",
    className: "bg-[var(--off)] text-[var(--muted)]",
  },
} as const;

export type ApplicationStatusId = keyof typeof APPLICATION_STATUS_CONFIG;

/** Housing type values stored in adoptionApplications.housingType */
export const HOUSING_TYPE_LABELS: Record<string, string> = {
  house_with_garden: "House with garden",
  house_no_garden: "House without garden",
  apartment: "Apartment",
  farm: "Farm / rural property",
  other: "Other",
};

export const HOUSING_TYPE_OPTIONS = Object.entries(HOUSING_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

/**
 * SSOT for adoption listing trait pills.
 * Defines the boolean fields on a listing that describe compatibility.
 * Icons are excluded — they are React components and belong in the UI layer.
 */
export type ListingTraitKey =
  "goodWithKids" | "goodWithDogs" | "goodWithCats" | "requiresExperience";

export const LISTING_TRAIT_CONFIG: Array<{
  field: ListingTraitKey;
  /** Full label for detail views. */
  label: string;
  /** Compact label for card/list views. */
  shortLabel: string;
  /** Tailwind bg + text classes. */
  className: string;
}> = [
  {
    field: "goodWithKids",
    label: "Good with kids",
    shortLabel: "Kids",
    className: "bg-[var(--teal-light)] text-[var(--teal)]",
  },
  {
    field: "goodWithDogs",
    label: "Good with dogs",
    shortLabel: "Dogs",
    className: "bg-[var(--teal-light)] text-[var(--teal)]",
  },
  {
    field: "goodWithCats",
    label: "Good with cats",
    shortLabel: "Cats",
    className: "bg-[var(--teal-light)] text-[var(--teal)]",
  },
  {
    field: "requiresExperience",
    label: "Experienced owner required",
    shortLabel: "Exp. owner",
    className: "bg-[var(--warn-bg)] text-[var(--warn)]",
  },
];
