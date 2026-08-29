/**
 * SSOT for vaccination status display config.
 * Enum values must match vaccinationStatusEnum in lib/db/schema.ts.
 * Icons are intentionally excluded — they are React components and belong in the UI layer.
 * className uses the signal-* utility classes from globals.css where applicable.
 */

export const VACCINATION_STATUS_CONFIG = {
  up_to_date: { label: "Up to date", className: "signal-healthy" },
  due_soon: { label: "Due soon", className: "signal-watch" },
  overdue: { label: "Overdue", className: "signal-concern" },
  not_applicable: {
    label: "N/A",
    className: "bg-[var(--off)] text-[var(--muted)] text-xs px-2 py-0.5 rounded-full font-medium",
  },
} as const;

export type VaccinationStatusId = keyof typeof VACCINATION_STATUS_CONFIG;

/**
 * Compute the effective display status from the vaccination's dates rather than
 * the stored status field, which gets stale over time.
 *
 * Only "not_applicable" is treated as a durable user intent; all other stored
 * values are overridden by date arithmetic. This keeps the badge in sync with
 * the signal computation in lib/domain/pet-signal.ts, which also ignores the
 * stored status and derives overdue-ness from nextDueDate directly.
 *
 * @param stored    - The DB-persisted status (used only to propagate "not_applicable")
 * @param nextDueDate - YYYY-MM-DD or null (null = no booster required)
 * @param today       - YYYY-MM-DD string for the current date
 * @param dueSoonDays - Days before due date to start showing "due_soon"
 */
/**
 * Minimal shape needed to compute overdue count — avoids importing full DB types.
 * Any row with `nextDueDate` and `status` fields satisfies this.
 */
type VaccinationOverdueRow = {
  nextDueDate: string | null;
  status: string;
};

/**
 * Count vaccinations that are past their due date.
 * Used by signal-cache, dashboard, and health-alerts cron — single SSOT.
 * Excludes "not_applicable" records (user-declared intent).
 *
 * @param vaccs   - Array of vaccination rows
 * @param today   - YYYY-MM-DD string for the current date
 */
export function countOverdueVaccinations(vaccs: VaccinationOverdueRow[], today: string): number {
  return vaccs.filter(
    (v) => v.nextDueDate && v.nextDueDate < today && v.status !== "not_applicable",
  ).length;
}

export function computeVaccinationDisplayStatus(
  stored: VaccinationStatusId,
  nextDueDate: string | null,
  today: string,
  dueSoonDays: number,
): VaccinationStatusId {
  if (stored === "not_applicable") return "not_applicable";
  if (!nextDueDate) return "up_to_date";
  if (nextDueDate < today) return "overdue";
  const msPerDay = 86_400_000;
  const daysUntil =
    (new Date(nextDueDate + "T00:00:00Z").getTime() - new Date(today + "T00:00:00Z").getTime()) /
    msPerDay;
  if (daysUntil <= dueSoonDays) return "due_soon";
  return "up_to_date";
}
