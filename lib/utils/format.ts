/**
 * Format a YYYY-MM-DD date string for display.
 * e.g. "2026-01-15" → "Jan 15, 2026"
 */
export function formatDateShort(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format grams as a human-readable weight string.
 * e.g. 3500 → "3.5 kg"; 500 → "500 g"
 */
export function formatWeight(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toFixed(1)} kg`;
  return `${grams} g`;
}

/**
 * Format centidegrees as a temperature string.
 * e.g. 3850 → "38.5°C"
 */
export function formatTemperature(centidegrees: number): string {
  return `${(centidegrees / 100).toFixed(1)}°C`;
}

/**
 * Format a date relative to now.
 * e.g. "2 days ago", "in 3 days"
 */
export function formatRelativeDate(date: string, now = new Date()): string {
  const target = new Date(date + "T00:00:00");
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}
