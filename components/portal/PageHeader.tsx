import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * Every portal page opens the same way: where you came from, what this page is,
 * one sentence on what you can do here, and the page's primary action. Before
 * this, each page hand-rolled its own heading markup and most of them said
 * nothing about their own purpose — a person landing on /portal/adoptions had
 * to infer it.
 */
export default function PageHeader({
  title,
  purpose,
  action,
  back,
  flush = false,
}: {
  title: string;
  /** One sentence, plain language: what this page is for. */
  purpose: string;
  /** Primary action for the page, rendered top-right on wide screens. */
  action?: ReactNode;
  /** Where this page sits under, shown as a back link above the title. */
  back?: { href: string; label: string };
  /**
   * Drop the bottom margin when the parent already spaces its children
   * (`space-y-*`). A `mb-0` utility from outside would not reliably win —
   * Tailwind resolves same-property utilities by stylesheet order, not by the
   * order they appear in the attribute — so the choice is made here instead.
   */
  flush?: boolean;
}) {
  return (
    <div className={flush ? "" : "mb-6"}>
      {back && (
        <Link href={back.href} className="back-link">
          <ChevronLeft className="w-3.5 h-3.5 flip-rtl" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title">{title}</h1>
          <p className="page-sub max-w-prose">{purpose}</p>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
