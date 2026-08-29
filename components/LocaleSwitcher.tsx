"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Globe, Check, ChevronDown } from "lucide-react";
import { LOCALE_CONFIG, type LocaleCode } from "@/lib/config/locales";
import { routing } from "@/i18n/routing";

const LOCALE_RE = new RegExp(`^/(${routing.locales.join("|")})(/|$)`);

/** Side-effects extracted to module scope so React Compiler's immutability
 *  rule doesn't flag the cookie write inside the component body. */
function persistLocale(next: string) {
  document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
  // Best-effort: persist on the user record so cron emails respect the choice.
  // 401 (anonymous) is fine — the cookie still drives portal/marketing locale.
  void fetch("/api/account/locale", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locale: next }),
  }).catch(() => {
    /* no-op */
  });
}

interface Props {
  /** Currently active locale (server-resolved). */
  current: LocaleCode;
  /** Compact (icon-only trigger) for tight spaces, default false (shows label too). */
  compact?: boolean;
  /** Trigger styling context — "dark" for the obsidian marketing nav, default light (portal). */
  tone?: "light" | "dark";
}

/**
 * Locale switcher: writes the NEXT_LOCALE cookie and either swaps the
 * /[locale]/ segment in the URL (marketing pages) or refreshes in place
 * (portal/admin). Works in both authenticated and anonymous contexts.
 */
export default function LocaleSwitcher({ current, compact = false, tone = "light" }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function pick(next: LocaleCode) {
    setOpen(false);
    if (next === current) return;

    persistLocale(next);

    if (LOCALE_RE.test(pathname)) {
      // Localized route — swap the /[locale]/ segment so the URL matches
      const newPath = pathname.replace(LOCALE_RE, `/${next}$2`);
      startTransition(() => router.push(newPath));
    } else {
      // Non-localized route (portal/admin/auth) — re-render with new cookie
      startTransition(() => router.refresh());
    }
  }

  const cur = LOCALE_CONFIG[current];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        aria-label="Change language"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 ${
          tone === "dark"
            ? "text-[var(--platinum-dim)] hover:bg-white/[0.06] hover:text-[var(--platinum)]"
            : "text-[var(--ink2)] hover:bg-[var(--light)] hover:text-[var(--ink)]"
        }`}
      >
        <Globe className="w-4 h-4 flex-shrink-0" />
        {!compact && (
          <>
            <span className="flex-1 text-start truncate">{cur.label}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </>
        )}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute bottom-full mb-1 inset-x-0 bg-white border border-[var(--border)] rounded-xl shadow-lg overflow-hidden z-30 max-h-72 overflow-y-auto"
        >
          {Object.values(LOCALE_CONFIG).map((l) => (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => pick(l.code)}
                role="option"
                aria-selected={l.code === current}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-start hover:bg-[var(--light)] transition-colors ${
                  l.code === current
                    ? "bg-[var(--teal-light)] text-[var(--teal)]"
                    : "text-[var(--ink2)]"
                }`}
              >
                <span className="text-base flex-shrink-0" aria-hidden="true">
                  {l.flag}
                </span>
                <span className="flex-1 truncate">{l.label}</span>
                {l.code === current && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
