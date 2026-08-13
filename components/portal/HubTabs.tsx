"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Segmented control linking the sibling pages of one hub (Care, Shop, Adopt).
 * Keeps each page's URL while the sidebar shows a single entry per hub.
 */
export default function HubTabs({ tabs }: { tabs: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <div className="hub-tabs">
      {tabs.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`hub-tab ${pathname === href ? "hub-tab-active" : ""}`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
