/**
 * SSOT for health record type display config.
 * Enum values must match healthRecordTypeEnum in lib/db/schema.ts.
 * Icons are intentionally excluded — they are React components and belong in the UI layer.
 */

export const HEALTH_RECORD_TYPE_CONFIG = {
  vet_visit:   { label: "Vet visit",   color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]",   className: "bg-[var(--teal-light)] text-[var(--teal)]" },
  vaccination: { label: "Vaccination", color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]",   className: "bg-[var(--teal-light)] text-[var(--teal)]" },
  medication:  { label: "Medication",  color: "text-[var(--warn)]",   bg: "bg-[var(--warn-bg)]",      className: "bg-[var(--warn-bg)] text-[var(--warn)]" },
  surgery:     { label: "Surgery",     color: "text-[var(--danger)]", bg: "bg-[var(--danger-bg)]",    className: "bg-[var(--danger-bg)] text-[var(--danger)]" },
  lab_result:  { label: "Lab result",  color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]",   className: "bg-[var(--teal-light)] text-[var(--teal)]" },
  dental:      { label: "Dental",      color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]",   className: "bg-[var(--teal-light)] text-[var(--teal)]" },
  grooming:    { label: "Grooming",    color: "text-[var(--accent)]", bg: "bg-[var(--accent-light)]", className: "bg-[var(--accent-light)] text-[var(--accent)]" },
  other:       { label: "Other",       color: "text-[var(--muted)]",  bg: "bg-[var(--off)]",          className: "bg-[var(--off)] text-[var(--muted)]" },
} as const;

export type HealthRecordTypeId = keyof typeof HEALTH_RECORD_TYPE_CONFIG;

/** Flat options list for <select> elements. */
export const HEALTH_RECORD_TYPE_OPTIONS = (
  Object.entries(HEALTH_RECORD_TYPE_CONFIG) as [HealthRecordTypeId, { label: string }][]
).map(([value, { label }]) => ({ value, label }));
