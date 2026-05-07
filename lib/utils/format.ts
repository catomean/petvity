import { APP_CURRENCY } from "@/lib/config/app";

/**
 * Format a YYYY-MM-DD date string for display.
 * Uses the runtime locale (browser on client, server locale on SSR) — consistent
 * with formatIsoDate / formatIsoDateTime. For per-request locale, pass it explicitly.
 * e.g. "2026-01-15" → "Jan 15, 2026" (en) / "2026年1月15日" (ja)
 */
export function formatDateShort(date: string, locale?: string): string {
  const d = date.includes("T") ? new Date(date) : new Date(date + "T00:00:00");
  return d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
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

type AgeT = (key: string, values?: Record<string, number>) => string;

/**
 * Format a pet's age compactly, locale-aware.
 * Requires translation keys: petAgeShortLess1Month, petAgeShortMonths, petAgeShortYears
 * e.g. en: "3mo" / "1yr" · de: "3Mo" / "1J"
 */
export function formatPetAgeShort(birthDate: string | null, t: AgeT): string {
  if (!birthDate) return "";
  const months = Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4),
  );
  if (months < 1) return t("petAgeShortLess1Month");
  if (months < 12) return t("petAgeShortMonths", { n: months });
  return t("petAgeShortYears", { n: Math.floor(months / 12) });
}

/**
 * Format a pet's age verbosely, locale-aware.
 * Requires translation keys: petAgeLess1Month, petAgeMonths, petAgeYears, petAgeYearsMonths
 * e.g. en: "3 months old" / "1 year old" · de: "3 Monate alt" / "1 Jahr alt"
 */
export function formatPetAge(birthDate: string | null, t: AgeT): string {
  if (!birthDate) return "";
  const months = Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4),
  );
  if (months < 1) return t("petAgeLess1Month");
  if (months < 12) return t("petAgeMonths", { n: months });
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? t("petAgeYearsMonths", { years, months: rem }) : t("petAgeYears", { n: years });
}

/**
 * Format an integer cent amount as a locale-aware price string.
 * Currency determined by APP_CURRENCY (NEXT_PUBLIC_APP_CURRENCY env, default "USD").
 * e.g. 2999, "en" → "$29.99" · 2999, "de" → "29,99 $"
 */
export function formatPrice(cents: number, locale?: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: APP_CURRENCY }).format(cents / 100);
}

/**
 * Format an adoption fee. Returns "Free" for null/0, whole dollars otherwise.
 * Currency determined by APP_CURRENCY (NEXT_PUBLIC_APP_CURRENCY env, default "USD").
 * e.g. null → "Free"; 2500, "en" → "$25"
 */
export function formatAdoptionFee(feeCents: number | null, locale?: string): string {
  if (feeCents === null || feeCents === 0) return "Free";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: APP_CURRENCY,
    maximumFractionDigits: 0,
  }).format(Math.round(feeCents / 100));
}

/**
 * Format an ISO datetime string for compact display.
 * e.g. "2026-01-15T10:30:00Z" → "Jan 15, 2026"
 */
export function formatIsoDate(iso: string, locale?: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format an ISO datetime string with time for compact display.
 * e.g. "2026-01-15T10:30:00Z" → "Jan 15, 10:30 AM"
 */
export function formatIsoDateTime(iso: string, locale?: string): string {
  return new Date(iso).toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a date relative to now using the browser/runtime locale.
 * e.g. locale="de": "heute", "morgen", "in 7 Tagen", "vor 30 Tagen"
 *      locale="en": "today", "tomorrow", "in 7 days", "30 days ago"
 */
export function formatRelativeDate(date: string, locale?: string, now = new Date()): string {
  // Use UTC midnight on both sides so the comparison is timezone-agnostic.
  const target = new Date(date + "T00:00:00Z");
  const nowUtcMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const diffMs = target.getTime() - nowUtcMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return new Intl.RelativeTimeFormat(locale ?? "en", { numeric: "auto" }).format(diffDays, "day");
}
