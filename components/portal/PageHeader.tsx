import type { ReactNode } from "react";

/**
 * Every portal page opens the same way: what this page is, one sentence on
 * what you can do here, and the page's primary action. Before this, each page
 * hand-rolled its own heading markup and most of them said nothing about their
 * own purpose — a person landing on /portal/adoptions had to infer it.
 */
export default function PageHeader({
  title,
  purpose,
  action,
  className = "",
}: {
  title: string;
  /** One sentence, plain language: what this page is for. */
  purpose: string;
  /** Primary action for the page, rendered top-right on wide screens. */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6 ${className}`}>
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        <p className="page-sub max-w-prose">{purpose}</p>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
