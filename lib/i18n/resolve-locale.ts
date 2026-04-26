/**
 * Pure locale-resolution helper used by the root-page redirect.
 *
 * Order of preference:
 *   1. NEXT_LOCALE cookie if it matches a supported locale
 *   2. Accept-Language header — first tag whose primary subtag matches
 *   3. defaultLocale
 *
 * Extracted so the parsing logic (especially Accept-Language with weighted
 * tags and region subtags) can be unit-tested without mocking next/headers.
 */

import { routing } from "@/i18n/routing";

const SUPPORTED = routing.locales as readonly string[];

export function resolvePreferredLocale(opts: {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
}): string {
  const { cookieLocale, acceptLanguage } = opts;

  if (cookieLocale && SUPPORTED.includes(cookieLocale)) {
    return cookieLocale;
  }

  if (acceptLanguage) {
    const tags = acceptLanguage
      .split(",")
      .map((t) => t.split(";")[0].trim().toLowerCase())
      .filter(Boolean);

    for (const tag of tags) {
      const primary = tag.split("-")[0];
      if (SUPPORTED.includes(primary)) return primary;
    }
  }

  return routing.defaultLocale;
}
