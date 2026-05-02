/** SSOT: digital twin state colors, thresholds, and trend config.
 *  Labels are in messages/{locale}.json under the "twin" namespace. */

export type TwinStateId = "thriving" | "content" | "attention" | "struggling" | "no_data";

export type TwinTrend = "improving" | "stable" | "declining" | "insufficient_data";

/** Color for each trend direction — use in any component showing trend UI. */
export const TWIN_TREND_CONFIG: Record<TwinTrend, { color: string }> = {
  improving:         { color: "text-[var(--green)]"  },
  stable:            { color: "text-[var(--muted)]"  },
  declining:         { color: "text-[var(--danger)]" },
  insufficient_data: { color: "text-[var(--faint)]"  },
};

export const TWIN_STATE_CONFIG: Record<
  TwinStateId,
  { bg: string; text: string; barColor: string; trackColor: string }
> = {
  thriving: {
    bg: "bg-[var(--green-bg)]",
    text: "text-[var(--green)]",
    barColor: "bg-[var(--green)]",
    trackColor: "bg-[var(--border)]",
  },
  content: {
    bg: "bg-[var(--teal-light)]",
    text: "text-[var(--teal)]",
    barColor: "bg-[var(--teal)]",
    trackColor: "bg-[var(--border)]",
  },
  attention: {
    bg: "bg-[var(--warn-bg)]",
    text: "text-[var(--warn)]",
    barColor: "bg-[var(--warn)]",
    trackColor: "bg-[var(--border)]",
  },
  struggling: {
    bg: "bg-[var(--danger-bg)]",
    text: "text-[var(--danger)]",
    barColor: "bg-[var(--danger)]",
    trackColor: "bg-[var(--border)]",
  },
  no_data: {
    bg: "bg-[var(--off)]",
    text: "text-[var(--muted)]",
    barColor: "bg-[var(--faint)]",
    trackColor: "bg-[var(--border)]",
  },
};

/** Thresholds: score (0–100) → state */
export const TWIN_STATE_THRESHOLDS: { min: number; id: TwinStateId }[] = [
  { min: 75, id: "thriving" },
  { min: 50, id: "content" },
  { min: 25, id: "attention" },
  { min: 0,  id: "struggling" },
];
