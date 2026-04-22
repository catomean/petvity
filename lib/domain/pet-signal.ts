import {
  HEALTH_METRIC_CONFIG,
  isMetricInRange,
  signalFromOutOfRangeCount,
  type MetricId,
} from "@/lib/config/health-metrics";
import {
  NO_METRIC_LOG_ALERT_DAYS,
  type PetWellnessSignal,
} from "@/lib/config/pet-signal";
import type { SpeciesId } from "@/lib/config/species";

export type HealthMetricRow = {
  date: string; // YYYY-MM-DD
  weightGrams: number | null;
  temperatureCentidegrees: number | null;
  heartRateBpm: number | null;
  energy: number | null;
  mood: number | null;
  anxiety: number | null;
  socialization: number | null;
};

export type PetSignalInput = {
  species: SpeciesId;
  /** Recent metric rows — typically last 7 days, descending by date. */
  recentMetrics: HealthMetricRow[];
  /** Number of vaccinations past their nextDueDate as of today. */
  overdueVaccinations: number;
  /** Injectable for tests; defaults to new Date(). */
  now?: Date;
};

export type PetSignalResult = {
  signal: PetWellnessSignal;
  reason: string;
  outOfRangeMetrics: MetricId[];
};

const METRIC_DB_MAP: { metricId: MetricId; field: keyof HealthMetricRow }[] = [
  { metricId: "weight", field: "weightGrams" },
  { metricId: "temperature", field: "temperatureCentidegrees" },
  { metricId: "heart_rate", field: "heartRateBpm" },
  { metricId: "energy", field: "energy" },
  { metricId: "mood", field: "mood" },
  { metricId: "anxiety", field: "anxiety" },
  { metricId: "socialization", field: "socialization" },
];

/**
 * Compute the pet wellness signal from recent health data.
 * Pure function — no DB calls, no HTTP, fully testable.
 *
 * Algorithm:
 * 1. No metrics in last NO_METRIC_LOG_ALERT_DAYS → "watch"
 * 2. For most recent row, count metrics outside species-specific normal ranges
 * 3. ≥ CONCERN threshold → "concern"; ≥ WATCH threshold → "watch"; else → "healthy"
 * 4. Overdue vaccination escalates signal by one level
 */
export function computePetSignal({
  species,
  recentMetrics,
  overdueVaccinations,
  now = new Date(),
}: PetSignalInput): PetSignalResult {
  const dayMs = 24 * 60 * 60 * 1000;

  // ── Step 1: Check if we have any recent data ───────────────────────────────
  if (recentMetrics.length === 0) {
    const baseSignal =
      overdueVaccinations > 0 ? "concern" : "watch";
    return {
      signal: baseSignal,
      reason: "No health metrics logged recently",
      outOfRangeMetrics: [],
    };
  }

  const sorted = [...recentMetrics].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const lastDate = new Date(sorted[0].date + "T00:00:00");
  const daysSinceLast = Math.floor(
    (now.getTime() - lastDate.getTime()) / dayMs,
  );

  if (daysSinceLast >= NO_METRIC_LOG_ALERT_DAYS) {
    const signal = overdueVaccinations > 0 ? "concern" : "watch";
    return {
      signal,
      reason: `No check-in for ${daysSinceLast} days (last: ${sorted[0].date})`,
      outOfRangeMetrics: [],
    };
  }

  // ── Step 2: Count out-of-range metrics from the most recent row ─────────────
  const latest = sorted[0];
  const outOfRangeMetrics: MetricId[] = [];

  for (const { metricId, field } of METRIC_DB_MAP) {
    const storedValue = latest[field] as number | null;
    if (storedValue === null || storedValue === undefined) continue;

    const def = HEALTH_METRIC_CONFIG[metricId];
    const inRange = isMetricInRange(metricId, storedValue, species);

    // Inverted metrics: "out of range" means anxiety is too high (already handled
    // by the normalRange being min:1 max:2, so isMetricInRange handles it correctly)
    if (!inRange) {
      outOfRangeMetrics.push(metricId);
    }

    void def; // suppress unused warning
  }

  // ── Step 3: Compute base signal from metric count ─────────────────────────
  let signal = signalFromOutOfRangeCount(outOfRangeMetrics.length);

  // ── Step 4: Escalate for overdue vaccinations ─────────────────────────────
  if (overdueVaccinations > 0) {
    if (signal === "healthy") signal = "watch";
    else if (signal === "watch") signal = "concern";
  }

  const reason =
    outOfRangeMetrics.length === 0 && overdueVaccinations === 0
      ? "All monitored metrics within normal range"
      : outOfRangeMetrics.length > 0
        ? `${outOfRangeMetrics.length} metric(s) outside normal range: ${outOfRangeMetrics.join(", ")}`
        : `${overdueVaccinations} overdue vaccination(s)`;

  return { signal, reason, outOfRangeMetrics };
}
