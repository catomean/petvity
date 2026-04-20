export type PetWellnessSignal = "healthy" | "watch" | "concern";

/** Rolling window (days) used to evaluate metric history for signal. */
export const SIGNAL_METRIC_WINDOW_DAYS = 7;

/** Days without any metric log before signal degrades to "watch". */
export const NO_METRIC_LOG_ALERT_DAYS = 7;

/** Days before vaccination due date to show "due_soon" status. */
export const VACCINATION_DUE_SOON_DAYS = 30;

/**
 * Number of out-of-range metrics to trigger "watch" vs "concern".
 * concern: >= CONCERN threshold
 * watch:   >= WATCH threshold (but < CONCERN)
 */
export const SIGNAL_WATCH_METRIC_COUNT = 1;
export const SIGNAL_CONCERN_METRIC_COUNT = 2;

export const SIGNAL_SORT_ORDER: Record<PetWellnessSignal, number> = {
  concern: 0,
  watch: 1,
  healthy: 2,
};

export const SIGNAL_LABELS: Record<PetWellnessSignal, string> = {
  concern: "Needs attention",
  watch: "Watch",
  healthy: "Healthy",
};

export const SIGNAL_COLORS: Record<PetWellnessSignal, string> = {
  concern: "var(--danger)",
  watch: "var(--warn)",
  healthy: "var(--green)",
};

export const SIGNAL_BG_CLASSES: Record<PetWellnessSignal, string> = {
  concern: "bg-red-100 text-red-800",
  watch: "bg-amber-100 text-amber-800",
  healthy: "bg-green-100 text-green-800",
};
