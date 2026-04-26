import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolvePreferredLocale } from "@/lib/i18n/resolve-locale";

/** Root redirect — pick the user's language instead of forcing English on
 *  everyone. Order: persisted NEXT_LOCALE cookie → Accept-Language match →
 *  defaultLocale. Logic lives in resolvePreferredLocale so it's unit-testable
 *  without mocking next/headers. */
export default async function RootPage() {
  const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value ?? null;
  const acceptLanguage = (await headers()).get("accept-language");
  const locale = resolvePreferredLocale({ cookieLocale, acceptLanguage });
  redirect(`/${locale}`);
}
