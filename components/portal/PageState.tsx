import Link from "next/link";
import type { ElementType, ReactNode } from "react";

/**
 * Standard empty-state card used across all portal list pages.
 * Pass `cta` for a single primary action link, or `actions` for custom button layouts.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  cta,
  actions,
}: {
  icon: ElementType;
  title: string;
  body: string;
  cta?: { label: string; href: string };
  actions?: ReactNode;
}) {
  return (
    <div className="card py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-[var(--teal)]" />
      </div>
      <p className="font-medium text-[var(--ink)] mb-2">{title}</p>
      <p className="text-sm text-[var(--muted)] mb-5 max-w-xs mx-auto">{body}</p>
      {actions ??
        (cta && (
          <Link href={cta.href} className="btn-primary">
            {cta.label}
          </Link>
        ))}
    </div>
  );
}

/**
 * Standard error-state card used when a fetch fails.
 * Shows the error message and a retry button.
 */
export function ErrorState({
  message,
  onRetry,
  retryLabel,
}: {
  message: string;
  onRetry: () => void;
  retryLabel: string;
}) {
  return (
    <div className="card py-12 text-center">
      <p className="text-[var(--danger-text)] font-medium mb-3">{message}</p>
      <button onClick={onRetry} className="btn-outline text-sm">
        {retryLabel}
      </button>
    </div>
  );
}
