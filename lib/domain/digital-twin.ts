import { TWIN_STATE_THRESHOLDS } from "@/lib/config/digital-twin";
import type { TwinStateId, TwinTrend } from "@/lib/config/digital-twin";
import type { HealthMetricRow } from "./pet-signal";

export type { TwinTrend }; // re-export for consumers that import from this module

export interface TwinMetricDisplay {
  id: string;
  rawValue: number;    // 1–5
  fillPercent: number; // 0–100 (anxiety inverted so higher = better visually)
}

export interface TwinState {
  id: TwinStateId;
  scorePercent: number;    // 0–100 overall wellness score
  summaryKey: string;      // twin namespace translation key, e.g. "summaryHappyEnergetic"
  metrics: TwinMetricDisplay[];
  daysAgo: number | null;  // null = no data logged
  trend: TwinTrend;
  trendDelta: number;      // score change (positive = improving)
}

/* ─────────────────────────────────────────────── internal helpers ── */

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

/** Returns a twin namespace translation key for the summary sentence. */
function summaryKey(
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

  if (isHappy && isEnergetic && isCalm) return "summaryHappyEnergeticCalm";
  if (isHappy && isEnergetic)           return "summaryHappyEnergetic";
  if (isHappy && isCalm)                return "summaryHappyCalm";
  if (isHappy && isSocial)              return "summaryHappySocial";
  if (isCalm  && isEnergetic)           return "summaryCalmEnergetic";
  if (isCalm  && isSocial)              return "summaryCalmSocial";
  if (isHappy)                          return "summaryHappy";
  if (isCalm)                           return "summaryCalm";
  if (isAnxious && isLowMood)           return "summaryAnxiousLowMood";
  if (isAnxious)                        return "summaryAnxious";
  if (isLowEnergy && isLowMood)         return "summaryLowEnergyLowMood";
  if (isLowEnergy)                      return "summaryLowEnergy";
  if (isLowMood)                        return "summaryLowMood";
  return "summaryBalanced";
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
      summaryKey: "summaryBalanced",
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

  return { id: stateId, scorePercent: avgScore, summaryKey: summaryKey(latest.mood, latest.energy, latest.anxiety, latest.socialization), metrics, daysAgo, trend, trendDelta };
}
