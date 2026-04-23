import { TWIN_STATE_THRESHOLDS } from "@/lib/config/digital-twin";
import type { TwinStateId, TwinTrend } from "@/lib/config/digital-twin";
import type { HealthMetricRow } from "./pet-signal";

export type { TwinTrend }; // re-export for consumers that import from this module

export interface TwinMetricDisplay {
  id: string;
  label: string;       // e.g., "Mood"
  valueLabel: string;  // e.g., "Joyful"
  rawValue: number;    // 1–5
  fillPercent: number; // 0–100 (anxiety inverted so higher = better visually)
}

export interface TwinState {
  id: TwinStateId;
  scorePercent: number;    // 0–100 overall wellness score
  summary: string;         // e.g., "Happy and energetic"
  metrics: TwinMetricDisplay[];
  daysAgo: number | null;  // null = no data logged
  trend: TwinTrend;
  trendDelta: number;      // score change (positive = improving)
}

/* ─────────────────────────────────────────────── internal helpers ── */

const SCALE_LABELS: Record<string, [string, string, string, string, string]> = {
  energy:        ["Very low",  "Low",      "Moderate", "High",      "Very high"],
  mood:          ["Very sad",  "Sad",      "Neutral",  "Happy",     "Joyful"],
  anxiety:       ["Very calm", "Calm",     "Mild",     "Anxious",   "Very anxious"],
  socialization: ["Avoidant",  "Shy",      "Normal",   "Friendly",  "Very social"],
};

const METRIC_LABELS: Record<string, string> = {
  energy: "Energy",
  mood: "Mood",
  anxiety: "Calm",       // shown inverted ("Calm") to the user
  socialization: "Social",
};

/** Convert a single metric row to a 0–100 score (higher is always better) */
function rowScore(row: Pick<HealthMetricRow, "mood" | "energy" | "anxiety" | "socialization">): number | null {
  const values: number[] = [];
  if (row.mood        != null) values.push(((row.mood        - 1) / 4) * 100);
  if (row.energy      != null) values.push(((row.energy      - 1) / 4) * 100);
  if (row.anxiety     != null) values.push(((5 - row.anxiety) / 4) * 100); // inverted
  if (row.socialization != null) values.push(((row.socialization - 1) / 4) * 100);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function groupAvg(rows: Pick<HealthMetricRow, "mood" | "energy" | "anxiety" | "socialization">[]): number | null {
  const scores = rows.map(rowScore).filter((s): s is number => s !== null);
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function summaryText(
  mood: number | null,
  energy: number | null,
  anxiety: number | null,
  socialization: number | null,
): string {
  const isHappy     = (mood ?? 3) >= 4;
  const isEnergetic = (energy ?? 3) >= 4;
  const isCalm      = (anxiety ?? 3) <= 2;
  const isSocial    = (socialization ?? 3) >= 4;
  const isLowMood   = (mood ?? 3) <= 2;
  const isLowEnergy = (energy ?? 3) <= 2;
  const isAnxious   = (anxiety ?? 3) >= 4;

  if (isHappy && isEnergetic && isCalm) return "Happy, energetic, and relaxed";
  if (isHappy && isEnergetic)           return "Happy and full of energy";
  if (isHappy && isCalm)                return "Happy and relaxed";
  if (isHappy && isSocial)              return "Happy and social";
  if (isCalm  && isEnergetic)           return "Calm and lively";
  if (isCalm  && isSocial)              return "Calm and friendly";
  if (isHappy)                          return "In good spirits";
  if (isCalm)                           return "Calm and settled";
  if (isAnxious && isLowMood)           return "Stressed and unhappy";
  if (isAnxious)                        return "Feeling stressed";
  if (isLowEnergy && isLowMood)         return "Low energy and low mood";
  if (isLowEnergy)                      return "Low energy day";
  if (isLowMood)                        return "Having a tough day";
  return "Feeling balanced";
}

/* ─────────────────────────────────────────────── public API ── */

/**
 * Compute the digital twin state from all recent metric rows (last 7 days, descending).
 * Trend compares the most-recent half vs the prior half (min 1 row each to show a trend).
 */
export function computeDigitalTwin(
  recentMetrics: HealthMetricRow[],
  now = new Date(),
): TwinState {
  const latest = recentMetrics[0] ?? null;

  if (!latest) {
    return {
      id: "no_data",
      scorePercent: 0,
      summary: "Log daily check-ins to see your pet's digital twin",
      metrics: [],
      daysAgo: null,
      trend: "insufficient_data",
      trendDelta: 0,
    };
  }

  // ── Per-metric display ──────────────────────────────────────────────
  type Scored = { id: string; raw: number | null; score: number };
  const scored: Scored[] = [
    { id: "mood",          raw: latest.mood,          score: latest.mood          != null ? ((latest.mood          - 1) / 4) * 100 : -1 },
    { id: "energy",        raw: latest.energy,        score: latest.energy        != null ? ((latest.energy        - 1) / 4) * 100 : -1 },
    { id: "anxiety",       raw: latest.anxiety,       score: latest.anxiety       != null ? ((5 - latest.anxiety)   / 4) * 100 : -1 },
    { id: "socialization", raw: latest.socialization, score: latest.socialization != null ? ((latest.socialization - 1) / 4) * 100 : -1 },
  ];

  const present = scored.filter((m) => m.raw != null);
  const avgScore = present.length > 0
    ? Math.round(present.reduce((acc, m) => acc + m.score, 0) / present.length)
    : 0;

  const stateId: TwinStateId = present.length === 0
    ? "no_data"
    : (TWIN_STATE_THRESHOLDS.find((t) => avgScore >= t.min)?.id ?? "struggling");

  const metrics: TwinMetricDisplay[] = scored
    .filter((m) => m.raw != null)
    .map((m) => ({
      id: m.id,
      label: METRIC_LABELS[m.id],
      valueLabel: SCALE_LABELS[m.id][(m.raw as number) - 1],
      rawValue: m.raw as number,
      fillPercent: Math.round(m.score),
    }));

  // ── Days since last log ─────────────────────────────────────────────
  const latestDate = new Date(latest.date + "T00:00:00");
  const daysAgo = Math.floor((now.getTime() - latestDate.getTime()) / 86400000);

  // ── Trend: recent half vs prior half ───────────────────────────────
  // Split by date order (desc). Use midpoint: at least 1 entry per group.
  let trend: TwinTrend = "insufficient_data";
  let trendDelta = 0;

  if (recentMetrics.length >= 2) {
    const mid = Math.ceil(recentMetrics.length / 2);
    const recentHalf = recentMetrics.slice(0, mid);
    const priorHalf  = recentMetrics.slice(mid);

    const recentAvg = groupAvg(recentHalf);
    const priorAvg  = groupAvg(priorHalf);

    if (recentAvg !== null && priorAvg !== null) {
      trendDelta = Math.round(recentAvg - priorAvg);
      trend = trendDelta >= 5 ? "improving" : trendDelta <= -5 ? "declining" : "stable";
    }
  }

  return { id: stateId, scorePercent: avgScore, summary: summaryText(latest.mood, latest.energy, latest.anxiety, latest.socialization), metrics, daysAgo, trend, trendDelta };
}
