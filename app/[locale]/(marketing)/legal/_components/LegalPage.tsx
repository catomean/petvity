import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  title: string;
  effectiveDate: string;
  children: ReactNode;
}

/** Shared chrome for legal pages — Privacy, Terms, Cookies.
 *  Keeps the typography + spacing in one place so they all read alike. */
export function LegalPage({ title, effectiveDate, children }: Props) {
  return (
    <div className="min-h-screen bg-[var(--off)] pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-2xl border border-[var(--border)] p-8 md:p-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            Legal
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--ink)] mb-2">
            {title}
          </h1>
          <p className="text-sm text-[var(--muted)] mb-10">
            Effective {effectiveDate}
          </p>

          <article className="prose-legal text-[var(--ink2)] leading-relaxed space-y-5">
            {children}
          </article>

          <div className="mt-12 pt-6 border-t border-[var(--border)] flex items-center gap-4 text-xs text-[var(--muted)] flex-wrap">
            <Link href="/legal/privacy" className="hover:text-[var(--teal)]">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-[var(--teal)]">Terms</Link>
            <Link href="/legal/cookies" className="hover:text-[var(--teal)]">Cookies</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
