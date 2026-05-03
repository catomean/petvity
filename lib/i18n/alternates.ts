import { APP_URL } from "@/lib/config/app";
import { LOCALE_CONFIG, DEFAULT_LOCALE } from "@/lib/config/locales";

/**
 * Build hreflang alternate links for a localized path.
 * Pass the path WITHOUT locale prefix, e.g. "" for homepage, "/features".
 */
export function buildAlternates(path: string) {
  const languages: Record<string, string> = {
    "x-default": `${APP_URL}/${DEFAULT_LOCALE}${path}`,
  };
  for (const code of Object.keys(LOCALE_CONFIG)) {
    languages[code] = `${APP_URL}/${code}${path}`;
  }
  return {
    canonical: `${APP_URL}/${DEFAULT_LOCALE}${path}`,
    languages,
  };
}
