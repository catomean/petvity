/**
 * SSOT for health record type display config.
 * Enum values must match healthRecordTypeEnum in lib/db/schema.ts.
 * Icons are intentionally excluded — they are React components and belong in the UI layer.
 */

export const HEALTH_RECORD_TYPE_CONFIG = {
  vet_visit:   { label: "Vet visit",   color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]" },
  vaccination: { label: "Vaccination", color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]" },
  medication:  { label: "Medication",  color: "text-[var(--warn)]",   bg: "bg-[var(--warn-bg)]" },
  surgery:     { label: "Surgery",     color: "text-[var(--danger)]", bg: "bg-[var(--danger-bg)]" },
  lab_result:  { label: "Lab result",  color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]" },
  dental:      { label: "Dental",      color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]" },
  grooming:    { label: "Grooming",    color: "text-[var(--accent)]", bg: "bg-[var(--accent-light)]" },
  other:       { label: "Other",       color: "text-[var(--muted)]",  bg: "bg-[var(--off)]" },
} as const;

export type HealthRecordTypeId = keyof typeof HEALTH_RECORD_TYPE_CONFIG;

/** Flat options list for <select> elements. */
export const HEALTH_RECORD_TYPE_OPTIONS = (
  Object.entries(HEALTH_RECORD_TYPE_CONFIG) as [HealthRecordTypeId, { label: string }][]
).map(([value, { label }]) => ({ value, label }));
