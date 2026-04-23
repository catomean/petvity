/**
 * SSOT for vaccination status display config.
 * Enum values must match vaccinationStatusEnum in lib/db/schema.ts.
 * Icons are intentionally excluded — they are React components and belong in the UI layer.
 * className uses the signal-* utility classes from globals.css where applicable.
 */

export const VACCINATION_STATUS_CONFIG = {
  up_to_date:     { label: "Up to date", className: "signal-healthy" },
  due_soon:       { label: "Due soon",   className: "signal-watch" },
  overdue:        { label: "Overdue",    className: "signal-concern" },
  not_applicable: { label: "N/A",        className: "bg-[var(--off)] text-[var(--muted)] text-xs px-2 py-0.5 rounded-full font-medium" },
} as const;

export type VaccinationStatusId = keyof typeof VACCINATION_STATUS_CONFIG;
