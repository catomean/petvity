import {
  HEALTH_METRIC_CONFIG,
  getNormalRange,
  isMetricInRange,
  type MetricId,
} from "@/lib/config/health-metrics";
import type { SpeciesId } from "@/lib/config/species";

export type MetricDisplayValue = {
  value: number;
  unit: string;
  label: string;
  inRange: boolean;
};

/** Convert a stored metric value to its display representation. */
export function getMetricDisplay(
  metricId: MetricId,
  storedValue: number,
  speciesId: SpeciesId,
): MetricDisplayValue {
  const def = HEALTH_METRIC_CONFIG[metricId];
  return {
    value: def.toDisplay(storedValue),
    unit: def.unit,
    label: def.label,
    inRange: isMetricInRange(metricId, storedValue, speciesId),
  };
}

/** Thresholds for wellness score badge color bands (0–100 scale). */
export const WELLNESS_SCORE_THRESHOLDS = { good: 80, fair: 60 } as const;

/**
 * Compute a 0–100 wellness score from a set of metric stored values.
 * Each metric contributes equally. Inverted metrics are handled correctly.
 * Returns null if no metrics are provided.
 */
export function computeWellnessScore(
  metrics: Partial<Record<MetricId, number>>,
  speciesId: SpeciesId,
): number | null {
  const entries = Object.entries(metrics) as [MetricId, number][];
  const valid = entries.filter(([, v]) => v !== null && v !== undefined);
  if (valid.length === 0) return null;

  let totalScore = 0;
  for (const [metricId, storedValue] of valid) {
    const range = getNormalRange(metricId, speciesId);
    const rangeSize = range.max - range.min;

    // 100% within normalRange; decreases to 0 at 1 range-width beyond the boundary
    const rangeWidth = rangeSize || 1;
    const overshoot = Math.max(0, range.min - storedValue, storedValue - range.max);
    totalScore += overshoot === 0 ? 100 : Math.max(0, 100 - (overshoot / rangeWidth) * 100);
  }

  return Math.round(totalScore / valid.length);
}
