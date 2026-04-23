/**
 * SSOT for medication status display config.
 * Enum values must match medicationStatusEnum in lib/db/schema.ts.
 * Icons are intentionally excluded — they are React components and belong in the UI layer.
 */

export const MEDICATION_STATUS_CONFIG = {
  active:        { label: "Active",        className: "signal-healthy" },
  completed:     { label: "Completed",     className: "bg-[var(--off)] text-[var(--muted)] text-xs px-2 py-0.5 rounded-full font-medium" },
  discontinued:  { label: "Discontinued",  className: "bg-[var(--danger-bg)] text-[var(--danger)] text-xs px-2 py-0.5 rounded-full font-medium" },
} as const;

export type MedicationStatusId = keyof typeof MEDICATION_STATUS_CONFIG;
