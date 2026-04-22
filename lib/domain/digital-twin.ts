import { TWIN_STATE_THRESHOLDS } from "@/lib/config/digital-twin";
import type { TwinStateId } from "@/lib/config/digital-twin";

export interface TwinMetricDisplay {
  id: string;
  label: string;           // e.g., "Mood"
  valueLabel: string;      // e.g., "Joyful"
  rawValue: number;        // 1–5
  fillPercent: number;     // 0–100 (inverted for anxiety so higher = better visually)
}

export interface TwinState {
  id: TwinStateId;
  scorePercent: number;    // 0–100 overall wellness score
  summary: string;         // e.g., "Happy and energetic"
  metrics: TwinMetricDisplay[];
  daysAgo: number | null;  // null = no data
}

const SCALE_LABELS: Record<string, [string, string, string, string, string]> = {
  energy:        ["Very low",  "Low",      "Moderate", "High",      "Very high"],
  mood:          ["Very sad",  "Sad",      "Neutral",  "Happy",     "Joyful"],
  anxiety:       ["Very calm", "Calm",     "Mild",     "Anxious",   "Very anxious"],
  socialization: ["Avoidant",  "Shy",      "Normal",   "Friendly",  "Very social"],
};

const METRIC_LABELS: Record<string, string> = {
  energy: "Energy",
  mood: "Mood",
  anxiety: "Calm",       // shown as inverted "Calm" to the user
  socialization: "Social",
};

function summaryText(
  mood: number | null,
  energy: number | null,
  anxiety: number | null,
  socialization: number | null,
): string {
  const isHappy = (mood ?? 3) >= 4;
  const isEnergetic = (energy ?? 3) >= 4;
  const isCalm = (anxiety ?? 3) <= 2;        // anxiety 1–2 = calm
  const isSocial = (socialization ?? 3) >= 4;
  const isLowMood = (mood ?? 3) <= 2;
  const isLowEnergy = (energy ?? 3) <= 2;
  const isAnxious = (anxiety ?? 3) >= 4;

  if (isHappy && isEnergetic && isCalm) return "Happy, energetic, and relaxed";
  if (isHappy && isEnergetic) return "Happy and full of energy";
  if (isHappy && isCalm) return "Happy and relaxed";
  if (isHappy && isSocial) return "Happy and social";
  if (isCalm && isEnergetic) return "Calm and lively";
  if (isCalm && isSocial) return "Calm and friendly";
  if (isHappy) return "In good spirits";
  if (isCalm) return "Calm and settled";
  if (isAnxious && isLowMood) return "Stressed and unhappy";
  if (isAnxious) return "Feeling stressed";
  if (isLowEnergy && isLowMood) return "Low energy and low mood";
  if (isLowEnergy) return "Low energy day";
  if (isLowMood) return "Having a tough day";
  return "Feeling balanced";
}

export function computeDigitalTwin(
  latest: {
    date: string;
    mood: number | null;
    energy: number | null;
    anxiety: number | null;
    socialization: number | null;
  } | null,
  now = new Date(),
): TwinState {
  if (!latest) {
    return {
      id: "no_data",
      scorePercent: 0,
      summary: "Log daily check-ins to see your pet's digital twin",
      metrics: [],
      daysAgo: null,
    };
  }

  // Convert each metric to a 0–100 score (higher = better)
  // anxiety is inverted: value 1 = calm = best → score 100
  const scored: { id: string; raw: number | null; score: number; inverted: boolean }[] = [
    { id: "mood",          raw: latest.mood,          score: latest.mood          != null ? ((latest.mood - 1) / 4) * 100          : -1, inverted: false },
    { id: "energy",        raw: latest.energy,        score: latest.energy        != null ? ((latest.energy - 1) / 4) * 100        : -1, inverted: false },
    { id: "anxiety",       raw: latest.anxiety,       score: latest.anxiety       != null ? ((5 - latest.anxiety) / 4) * 100       : -1, inverted: true  },
    { id: "socialization", raw: latest.socialization, score: latest.socialization != null ? ((latest.socialization - 1) / 4) * 100 : -1, inverted: false },
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

  // Days since last log
  const latestDate = new Date(latest.date + "T00:00:00");
  const msPerDay = 86400000;
  const daysAgo = Math.floor((now.getTime() - latestDate.getTime()) / msPerDay);

  return {
    id: stateId,
    scorePercent: avgScore,
    summary: summaryText(latest.mood, latest.energy, latest.anxiety, latest.socialization),
    metrics,
    daysAgo,
  };
}
