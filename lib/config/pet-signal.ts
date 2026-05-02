export type PetWellnessSignal = "healthy" | "watch" | "concern";

/** Rolling window (days) used to evaluate metric history for signal. */
export const SIGNAL_METRIC_WINDOW_DAYS = 7;

/** Days without any metric log before signal degrades to "watch". */
export const NO_METRIC_LOG_ALERT_DAYS = 7;

/** Days before vaccination due date to show "due_soon" status. */
export const VACCINATION_DUE_SOON_DAYS = 30;

/**
 * Reminder milestones (days before due date) at which the cron sends an email.
 * Sorted descending. Sending at fixed points (not daily) prevents inbox spam
 * while still giving 3 advance notices: 30d, 7d, and 1d before due.
 */
export const VACCINATION_REMINDER_DAYS = [30, 7, 1] as const;

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


export const SIGNAL_COLORS: Record<PetWellnessSignal, string> = {
  concern: "var(--danger)",
  watch: "var(--warn)",
  healthy: "var(--green)",
};

/** Pill badge classes — maps to .signal-* utility classes in globals.css */
export const SIGNAL_BG_CLASSES: Record<PetWellnessSignal, string> = {
  concern: "signal-concern",
  watch: "signal-watch",
  healthy: "signal-healthy",
};

/** Thin top-strip color for pet cards on the dashboard */
export const SIGNAL_STRIP_CLASSES: Record<PetWellnessSignal, string> = {
  healthy: "bg-[var(--green)]",
  watch: "bg-[var(--warn)]",
  concern: "bg-[var(--danger)]",
};

/** Gradient background for the pet profile hero header */
export const SIGNAL_HERO_BG: Record<PetWellnessSignal, string> = {
  healthy: "from-[var(--green-bg)] to-[var(--off)]",
  watch: "from-[var(--warn-bg)] to-[var(--off)]",
  concern: "from-[var(--danger-bg)] to-[var(--off)]",
};
