/**
 * Resolve the user's locale inside non-localized portal/admin routes.
 *
 * The portal lives outside next-intl's [locale] segment, so requestLocale()
 * is unavailable here. The user's choice is persisted in the NEXT_LOCALE
 * cookie (set by the locale switcher); this helper reads + validates it,
 * falling back to the default locale on missing/unknown values.
 */

import { cookies } from "next/headers";
import { routing } from "@/i18n/routing";

export async function getPortalLocale(): Promise<string> {
  const raw = (await cookies()).get("NEXT_LOCALE")?.value;
  return (routing.locales as readonly string[]).includes(raw ?? "") ? raw! : routing.defaultLocale;
}
