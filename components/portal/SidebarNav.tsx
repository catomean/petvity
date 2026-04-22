"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  PawPrint,
  CalendarDays,
  Settings,
  LogOut,
  Search,
  Stethoscope,
} from "lucide-react";
import { APP } from "@/lib/config/app";

const NAV_ITEMS = [
  { href: "/portal/dashboard", icon: Home, label: "Dashboard" },
  { href: "/portal/pets", icon: PawPrint, label: "My Pets" },
  { href: "/portal/checkin", icon: CalendarDays, label: "Check-in" },
  { href: "/portal/find", icon: Search, label: "Find a Pro" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/portal/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

interface Props {
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
}

export default function SidebarNav({ userName, userEmail, userRole }: Props) {
  const pathname = usePathname();
  const initials = userName?.[0]?.toUpperCase() ?? "?";
  const isProfessional = userRole === "veterinarian" || userRole === "pet_sitter";

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 start-0 w-60 bg-white border-e border-[var(--border)] z-20">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-[var(--border)] flex-shrink-0">
          <Link
            href="/portal/dashboard"
            className="font-bold text-[var(--ink)] text-lg no-underline flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--teal)] flex items-center justify-center flex-shrink-0">
              <PawPrint className="w-4 h-4 text-white" />
            </div>
            <span>{APP.name}</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium no-underline transition-colors ${
                isActive(pathname, href)
                  ? "bg-[var(--teal-light)] text-[var(--teal)]"
                  : "text-[var(--ink2)] hover:bg-[var(--light)] hover:text-[var(--ink)]"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
          {isProfessional && (
            <Link
              href="/portal/professional-profile"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium no-underline transition-colors ${
                isActive(pathname, "/portal/professional-profile")
                  ? "bg-[var(--teal-light)] text-[var(--teal)]"
                  : "text-[var(--ink2)] hover:bg-[var(--light)] hover:text-[var(--ink)]"
              }`}
            >
              <Stethoscope className="w-4 h-4 flex-shrink-0" />
              My Profile
            </Link>
          )}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-3 border-t border-[var(--border)] pt-3 space-y-0.5">
          <Link
            href="/portal/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium no-underline transition-colors ${
              pathname === "/portal/settings"
                ? "bg-[var(--teal-light)] text-[var(--teal)]"
                : "text-[var(--ink2)] hover:bg-[var(--light)] hover:text-[var(--ink)]"
            }`}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            Settings
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--muted)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)] transition-colors cursor-pointer border-none bg-transparent"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Sign out
          </button>
        </div>

        {/* User chip */}
        <div className="px-4 py-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[var(--teal-light)] flex items-center justify-center text-[var(--teal)] font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--ink)] truncate leading-tight">
                {userName}
              </p>
              <p className="text-xs text-[var(--muted)] truncate leading-tight">
                {userEmail}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-[var(--border)] flex items-center justify-between px-4 z-20">
        <Link
          href="/portal/dashboard"
          className="font-bold text-[var(--ink)] text-lg no-underline flex items-center gap-2.5"
        >
          <div className="w-7 h-7 rounded-lg bg-[var(--teal)] flex items-center justify-center flex-shrink-0">
            <PawPrint className="w-3.5 h-3.5 text-white" />
          </div>
          {APP.name}
        </Link>
        <Link
          href="/portal/settings"
          className="w-9 h-9 rounded-full bg-[var(--teal-light)] flex items-center justify-center text-[var(--teal)] font-bold text-sm"
        >
          {initials}
        </Link>
      </header>

      {/* ── Mobile bottom nav ────────────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[var(--border)] flex safe-area-inset-bottom z-20">
        {[
          ...NAV_ITEMS,
          ...(isProfessional ? [{ href: "/portal/professional-profile", icon: Stethoscope, label: "My Profile" }] : []),
          { href: "/portal/settings", icon: Settings, label: "Settings" },
        ].map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium no-underline transition-colors ${
              isActive(pathname, href)
                ? "text-[var(--teal)]"
                : "text-[var(--muted)]"
            }`}
          >
            <Icon
              className={`w-5 h-5 ${isActive(pathname, href) ? "stroke-2" : "stroke-[1.5]"}`}
            />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
