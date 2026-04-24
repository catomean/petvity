/**
 * SSOT for vet and sitter profile config.
 * Used by professional profile form, find page, and public pro profiles.
 */

export const SITTER_SERVICES = [
  { value: "boarding",      label: "Boarding" },
  { value: "daycare",       label: "Daycare" },
  { value: "walking",       label: "Dog Walking" },
  { value: "house_sitting", label: "House Sitting" },
  { value: "drop_in",       label: "Drop-in Visits" },
] as const;

export type SitterServiceId = (typeof SITTER_SERVICES)[number]["value"];

/** Map from stored value → display label for fast lookup */
const SITTER_SERVICE_LABELS: Record<string, string> = Object.fromEntries(
  SITTER_SERVICES.map(({ value, label }) => [value, label]),
);

/**
 * Format a CSV of sitter service values (from DB) into a human-readable string.
 * Uses config labels — "walking" → "Dog Walking", not "Walking".
 */
export function formatSitterServices(services: string | null): string {
  if (!services) return "";
  return services
    .split(",")
    .map((s) => SITTER_SERVICE_LABELS[s.trim()] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .filter(Boolean)
    .join(" · ");
}
