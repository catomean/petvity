import {
  HEALTH_METRIC_CONFIG,
  getNormalRange,
  isMetricInRange,
  signalFromOutOfRangeCount,
  type MetricId,
} from "@/lib/config/health-metrics";
import { NO_METRIC_LOG_ALERT_DAYS, type PetWellnessSignal } from "@/lib/config/pet-signal";
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
  /**
   * When the pet profile was created. A profile younger than the no-log alert
   * window with no data yet is "new", not "needs attention" — without this a
   * pet shows an alarming Watch badge seconds after being added.
   */
  petCreatedAt?: Date | null;
  /** Injectable for tests; defaults to new Date(). */
  now?: Date;
};

export type SignalOutOfRangeDetail = {
  id: MetricId;
  formattedValue: string; // display value + unit, e.g. "200bpm"
  formattedRange: string; // range + unit, e.g. "60–140bpm"
};

export type SignalReasonData =
  | { type: "new_pet" }
  | { type: "no_metrics"; overdueVaccinations: number }
  | { type: "stale"; days: number; overdueVaccinations: number }
  | { type: "out_of_range"; details: SignalOutOfRangeDetail[]; overdueVaccinations: number }
  | { type: "overdue_only"; count: number }
  | { type: "healthy" };

export type PetSignalResult = {
  signal: PetWellnessSignal;
  reason: string;
  reasonData: SignalReasonData;
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
  petCreatedAt,
  now = new Date(),
}: PetSignalInput): PetSignalResult {
  const dayMs = 24 * 60 * 60 * 1000;

  // ── Step 1: Check if we have any recent data ───────────────────────────────
  if (recentMetrics.length === 0) {
    // Brand-new profile grace: no data AND nothing overdue AND the profile is
    // younger than the alert window ⇒ there was never a day it could have
    // missed. Healthy, with a nudge to log the first check-in.
    const ageDays = petCreatedAt ? (now.getTime() - petCreatedAt.getTime()) / dayMs : Infinity;
    if (overdueVaccinations === 0 && ageDays < NO_METRIC_LOG_ALERT_DAYS) {
      return {
        signal: "healthy",
        reason: "New profile — log a first check-in to activate the signal",
        reasonData: { type: "new_pet" },
        outOfRangeMetrics: [],
      };
    }

    const baseSignal = overdueVaccinations > 0 ? "concern" : "watch";
    return {
      signal: baseSignal,
      reason: "No health metrics logged recently",
      reasonData: { type: "no_metrics", overdueVaccinations },
      outOfRangeMetrics: [],
    };
  }

  const sorted = [...recentMetrics].sort((a, b) => b.date.localeCompare(a.date));
  const lastDate = new Date(sorted[0].date + "T00:00:00");
  const daysSinceLast = Math.floor((now.getTime() - lastDate.getTime()) / dayMs);

  if (daysSinceLast >= NO_METRIC_LOG_ALERT_DAYS) {
    const signal = overdueVaccinations > 0 ? "concern" : "watch";
    return {
      signal,
      reason: `No check-in for ${daysSinceLast} days (last: ${sorted[0].date})`,
      reasonData: { type: "stale", days: daysSinceLast, overdueVaccinations },
      outOfRangeMetrics: [],
    };
  }

  // ── Step 2: Count out-of-range metrics from the most recent row ─────────────
  const latest = sorted[0];
  const outOfRangeMetrics: MetricId[] = [];
  const outOfRangeDetails: string[] = [];
  const outOfRangeStructured: SignalOutOfRangeDetail[] = [];

  for (const { metricId, field } of METRIC_DB_MAP) {
    const storedValue = latest[field] as number | null;
    if (storedValue === null || storedValue === undefined) continue;

    const inRange = isMetricInRange(metricId, storedValue, species);
    if (!inRange) {
      outOfRangeMetrics.push(metricId);
      const def = HEALTH_METRIC_CONFIG[metricId];
      const range = getNormalRange(metricId, species);
      const displayVal = def.toDisplay(storedValue);
      const displayMin = def.toDisplay(range.min);
      const displayMax = def.toDisplay(range.max);
      const unit = def.unit;
      const formattedValue = `${displayVal}${unit}`;
      const formattedRange = `${displayMin}–${displayMax}${unit}`;
      outOfRangeDetails.push(`${def.label} ${formattedValue} (normal ${formattedRange})`);
      outOfRangeStructured.push({ id: metricId, formattedValue, formattedRange });
    }
  }

  // ── Step 3: Compute base signal from metric count ─────────────────────────
  let signal = signalFromOutOfRangeCount(outOfRangeMetrics.length);

  // ── Step 4: Escalate for overdue vaccinations ─────────────────────────────
  if (overdueVaccinations > 0) {
    if (signal === "healthy") signal = "watch";
    else if (signal === "watch") signal = "concern";
  }

  const vaccStr =
    overdueVaccinations > 0
      ? `${overdueVaccinations} overdue vaccination${overdueVaccinations !== 1 ? "s" : ""}`
      : null;

  const reason =
    outOfRangeDetails.length === 0 && !vaccStr
      ? "All monitored metrics within normal range"
      : [...outOfRangeDetails, ...(vaccStr ? [vaccStr] : [])].join(" · ");

  let reasonData: SignalReasonData;
  if (outOfRangeStructured.length === 0 && overdueVaccinations === 0) {
    reasonData = { type: "healthy" };
  } else if (outOfRangeStructured.length === 0) {
    reasonData = { type: "overdue_only", count: overdueVaccinations };
  } else {
    reasonData = { type: "out_of_range", details: outOfRangeStructured, overdueVaccinations };
  }

  return { signal, reason, reasonData, outOfRangeMetrics };
}
