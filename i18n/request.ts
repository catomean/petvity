import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { APP } from "@/lib/config/app";

/**
 * Substitute the {app} placeholder once, at message-load time. 47 message keys
 * reference {app}; requiring every t() call site to pass `{ app: APP.name }`
 * shipped literal "{app}" into rendered copy whenever one forgot (next-intl v4
 * removed defaultTranslationValues). Translators keep the placeholder; the
 * runtime owns the value — APP.name stays the single source of truth.
 */
function injectAppName(node: unknown): unknown {
  if (typeof node === "string") return node.replaceAll("{app}", APP.name);
  if (Array.isArray(node)) return node.map(injectAppName);
  if (node && typeof node === "object") {
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, injectAppName(v)]));
  }
  return node;
}

const messageCache = new Map<string, Record<string, unknown>>();

async function loadMessages(locale: string): Promise<Record<string, unknown>> {
  const cached = messageCache.get(locale);
  if (cached) return cached;
  const raw = (await import(`../messages/${locale}.json`)).default;
  const processed = injectAppName(raw) as Record<string, unknown>;
  messageCache.set(locale, processed);
  return processed;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "en")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
