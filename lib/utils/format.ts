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
 * Format a pet's age from birthDate for compact display.
 * e.g. null → ""; 3 months → "3mo"; 14 months → "1yr"
 */
export function formatPetAgeShort(birthDate: string | null): string {
  if (!birthDate) return "";
  const months = Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4),
  );
  if (months < 1) return "< 1mo";
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}yr`;
}

/**
 * Format a pet's age from birthDate for verbose display.
 * e.g. null → ""; 3 months → "3 months old"; 14 months → "1y 2mo old"
 */
export function formatPetAge(birthDate: string | null): string {
  if (!birthDate) return "";
  const months = Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4),
  );
  if (months < 1) return "< 1 month old";
  if (months < 12) return `${months} months old`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}mo old` : `${years} year${years !== 1 ? "s" : ""} old`;
}

/**
 * Format a date relative to now.
 * e.g. "2 days ago", "in 3 days"
 */
export function formatRelativeDate(date: string, now = new Date()): string {
  // Use UTC midnight on both sides so the comparison is timezone-agnostic.
  const target = new Date(date + "T00:00:00Z");
  const nowUtcMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const diffMs = target.getTime() - nowUtcMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}
