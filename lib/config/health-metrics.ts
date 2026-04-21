import type { SpeciesId } from "./species";
import type { PetWellnessSignal } from "./pet-signal";
import {
  SIGNAL_WATCH_METRIC_COUNT,
  SIGNAL_CONCERN_METRIC_COUNT,
} from "./pet-signal";

export type MetricCategory = "physical" | "emotional";

export type MetricId =
  | "weight"
  | "temperature"
  | "heart_rate"
  | "energy"
  | "mood"
  | "anxiety"
  | "socialization";

export type NormalRange = { min: number; max: number };

export type MetricDef = {
  id: MetricId;
  category: MetricCategory;
  label: string;
  unit: string;
  /** Conversion: stored value → display value */
  toDisplay: (stored: number) => number;
  /** Conversion: display value → stored value */
  toStorage: (display: number) => number;
  /**
   * Normal ranges keyed by species ID.
   * Falls back to "default" if the species has no specific range.
   */
  normalRange: Partial<Record<SpeciesId, NormalRange>> & {
    default: NormalRange;
  };
  /** For 1–5 scale metrics */
  scale?: { min: number; max: number };
  /** Lucide icon name */
  icon: string;
  description: string;
  /**
   * true = higher stored value = worse outcome (e.g. anxiety).
   * The signal algorithm inverts the out-of-range check for these.
   */
  inverted?: boolean;
  /** CSS var for chart line colour */
  chartColor: string;
};

export const HEALTH_METRIC_CONFIG: Record<MetricId, MetricDef> = {
  // ── Physical ────────────────────────────────────────────────────────────

  weight: {
    id: "weight",
    category: "physical",
    label: "Weight",
    unit: "kg",
    toDisplay: (g) => parseFloat((g / 1000).toFixed(3)),
    toStorage: (kg) => Math.round(kg * 1000),
    normalRange: {
      dog: { min: 1500, max: 90000 },
      cat: { min: 2500, max: 8000 },
      horse: { min: 380000, max: 1200000 },
      bird: { min: 20, max: 2000 },
      rabbit: { min: 900, max: 6000 },
      guinea_pig: { min: 700, max: 1200 },
      hamster: { min: 25, max: 200 },
      default: { min: 50, max: 200000 },
    },
    icon: "Scale",
    description: "Body weight in kilograms",
    chartColor: "var(--teal)",
  },

  temperature: {
    id: "temperature",
    category: "physical",
    label: "Temperature",
    unit: "°C",
    toDisplay: (cd) => parseFloat((cd / 100).toFixed(2)),
    toStorage: (c) => Math.round(c * 100),
    normalRange: {
      dog: { min: 3800, max: 3900 },
      cat: { min: 3800, max: 3925 },
      horse: { min: 3750, max: 3850 },
      bird: { min: 4100, max: 4300 },
      rabbit: { min: 3800, max: 3950 },
      guinea_pig: { min: 3800, max: 3950 },
      hamster: { min: 3700, max: 3800 },
      default: { min: 3700, max: 4100 },
    },
    icon: "Thermometer",
    description: "Body temperature in degrees Celsius",
    chartColor: "var(--warn)",
  },

  heart_rate: {
    id: "heart_rate",
    category: "physical",
    label: "Heart Rate",
    unit: "bpm",
    toDisplay: (v) => v,
    toStorage: (v) => Math.round(v),
    normalRange: {
      dog: { min: 60, max: 140 },
      cat: { min: 120, max: 220 },
      horse: { min: 28, max: 44 },
      bird: { min: 200, max: 600 },
      rabbit: { min: 120, max: 325 },
      guinea_pig: { min: 200, max: 300 },
      hamster: { min: 250, max: 500 },
      default: { min: 40, max: 400 },
    },
    icon: "HeartPulse",
    description: "Resting heart rate in beats per minute",
    chartColor: "var(--danger)",
  },

  // ── Emotional (1–5 scale) ────────────────────────────────────────────────

  energy: {
    id: "energy",
    category: "emotional",
    label: "Energy Level",
    unit: "/5",
    toDisplay: (v) => v,
    toStorage: (v) => Math.round(v),
    scale: { min: 1, max: 5 },
    normalRange: { default: { min: 3, max: 5 } },
    icon: "Zap",
    description: "1 = depleted, 5 = very energetic",
    chartColor: "var(--gold)",
  },

  mood: {
    id: "mood",
    category: "emotional",
    label: "Mood",
    unit: "/5",
    toDisplay: (v) => v,
    toStorage: (v) => Math.round(v),
    scale: { min: 1, max: 5 },
    normalRange: { default: { min: 3, max: 5 } },
    icon: "Smile",
    description: "1 = very low, 5 = very happy",
    chartColor: "var(--teal)",
  },

  anxiety: {
    id: "anxiety",
    category: "emotional",
    label: "Anxiety",
    unit: "/5",
    toDisplay: (v) => v,
    toStorage: (v) => Math.round(v),
    scale: { min: 1, max: 5 },
    normalRange: { default: { min: 1, max: 2 } },
    icon: "Activity",
    description: "1 = calm, 5 = highly anxious",
    inverted: true,
    chartColor: "var(--warn)",
  },

  socialization: {
    id: "socialization",
    category: "emotional",
    label: "Socialization",
    unit: "/5",
    toDisplay: (v) => v,
    toStorage: (v) => Math.round(v),
    scale: { min: 1, max: 5 },
    normalRange: { default: { min: 3, max: 5 } },
    icon: "Users",
    description: "1 = withdrawn, 5 = very sociable",
    chartColor: "var(--teal-dark)",
  },
};

export const PHYSICAL_METRICS: MetricId[] = ["weight", "temperature", "heart_rate"];
export const EMOTIONAL_METRICS: MetricId[] = [
  "energy",
  "mood",
  "anxiety",
  "socialization",
];

/**
 * Human-readable labels for each 1–5 scale value, indexed by metric ID.
 * Index 0 = value 1, index 4 = value 5.
 */
export const EMOTIONAL_SCALE_LABELS: Record<string, [string, string, string, string, string]> = {
  energy:        ["Very low",  "Low",   "Moderate", "High",     "Very high"],
  mood:          ["Very sad",  "Sad",   "Neutral",  "Happy",    "Joyful"],
  anxiety:       ["Very calm", "Calm",  "Mild",     "Anxious",  "Very anxious"],
  socialization: ["Avoidant",  "Shy",   "Normal",   "Friendly", "Very social"],
};

/** Get the normal range for a metric, falling back to "default". */
export function getNormalRange(
  metricId: MetricId,
  speciesId: SpeciesId,
): NormalRange {
  const def = HEALTH_METRIC_CONFIG[metricId];
  return def.normalRange[speciesId] ?? def.normalRange.default;
}

/** Check whether a stored metric value is within the normal range for the species. */
export function isMetricInRange(
  metricId: MetricId,
  storedValue: number,
  speciesId: SpeciesId,
): boolean {
  const range = getNormalRange(metricId, speciesId);
  return storedValue >= range.min && storedValue <= range.max;
}

/** Compute the wellness signal from a set of out-of-range metric counts. */
export function signalFromOutOfRangeCount(count: number): PetWellnessSignal {
  if (count >= SIGNAL_CONCERN_METRIC_COUNT) return "concern";
  if (count >= SIGNAL_WATCH_METRIC_COUNT) return "watch";
  return "healthy";
}
