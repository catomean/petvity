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
    const def = HEALTH_METRIC_CONFIG[metricId];
    const range = getNormalRange(metricId, speciesId);
    const rangeSize = range.max - range.min;

    let score: number;
    if (def.scale) {
      // 1–5 emotional metric
      const normalised = (storedValue - 1) / 4; // 0–1
      score = def.inverted ? (1 - normalised) * 100 : normalised * 100;
    } else {
      // Physical metric: score = distance from midpoint, clamped 0–100
      const midpoint = (range.min + range.max) / 2;
      const distance = Math.abs(storedValue - midpoint);
      const maxDistance = rangeSize / 2 + rangeSize; // generous margin
      score = Math.max(0, 100 - (distance / maxDistance) * 100);
    }
    totalScore += score;
  }

  return Math.round(totalScore / valid.length);
}
