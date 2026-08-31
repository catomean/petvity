"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  Home,
  PawPrint,
  CalendarDays,
  Settings,
  LogOut,
  Search,
  Stethoscope,
  ShoppingCart,
  Heart,
  Store,
} from "lucide-react";
import { APP } from "@/lib/config/app";
import { PORTAL_ROUTES } from "@/lib/config/routes";

function isActive(pathname: string, href: string, match?: string[]): boolean {
  if (href === PORTAL_ROUTES.dashboard) return pathname === href;
  const prefixes = match ?? [href];
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

import LocaleSwitcher from "@/components/LocaleSwitcher";
import type { LocaleCode } from "@/lib/config/locales";

interface Props {
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  hasSeller?: boolean;
  locale: LocaleCode;
}

export default function SidebarNav({ userName, userEmail, userRole, hasSeller, locale }: Props) {
  const pathname = usePathname();
  const t = useTranslations("portal");
  const initials = userName?.[0]?.toUpperCase() ?? "?";
  const isProfessional =
    userRole === "veterinarian" || userRole === "pet_sitter" || userRole === "groomer";

  // Six entries. Each hub (Care, Shop, Adopt) is ONE entry; its sibling
  // pages are tabs inside the hub. Upsells (become a seller / offer
  // services) live in Settings, not in daily navigation.
  type NavItem = { href: string; icon: React.ElementType; label: string; match?: string[] };
  const NAV_ITEMS: NavItem[] = [
    { href: PORTAL_ROUTES.dashboard, icon: Home, label: t("dashboard") },
    { href: PORTAL_ROUTES.pets, icon: PawPrint, label: t("myPets") },
    { href: PORTAL_ROUTES.checkin, icon: CalendarDays, label: t("checkin") },
    {
      href: PORTAL_ROUTES.find,
      icon: Search,
      label: t("navSectionCare"),
      match: [PORTAL_ROUTES.find, PORTAL_ROUTES.bookings],
    },
    {
      href: PORTAL_ROUTES.shop,
      icon: ShoppingCart,
      label: t("shop"),
      match: [PORTAL_ROUTES.shop, PORTAL_ROUTES.orders],
    },
    {
      href: PORTAL_ROUTES.adopt,
      icon: Heart,
      label: t("adopt"),
      match: [PORTAL_ROUTES.adopt, PORTAL_ROUTES.adoptions],
    },
    ...(hasSeller
      ? [
          {
            href: PORTAL_ROUTES.myProducts,
            icon: Store,
            label: t("navMyStore"),
            match: [PORTAL_ROUTES.myProducts, PORTAL_ROUTES.sellerProfile],
          },
        ]
      : []),
    ...(isProfessional
      ? [{ href: PORTAL_ROUTES.professionalProfile, icon: Stethoscope, label: t("myProfile") }]
      : []),
  ];

  // Mobile tab bar: max 5 items — standard for reliable touch targets.
  // Settings is accessible via the top-bar avatar link, so we use the slot for Bookings
  // (the natural follow-up destination after using Find a Pro).
  // Professionals swap "Find" for their own profile since they are the pro.
  const MOBILE_NAV_ITEMS_DEFAULT: NavItem[] = [
    { href: PORTAL_ROUTES.dashboard, icon: Home, label: t("dashboard") },
    { href: PORTAL_ROUTES.pets, icon: PawPrint, label: t("myPets") },
    { href: PORTAL_ROUTES.checkin, icon: CalendarDays, label: t("checkin") },
    {
      href: PORTAL_ROUTES.find,
      icon: Search,
      label: t("navSectionCare"),
      match: [PORTAL_ROUTES.find, PORTAL_ROUTES.bookings],
    },
    {
      href: PORTAL_ROUTES.shop,
      icon: ShoppingCart,
      label: t("shop"),
      match: [PORTAL_ROUTES.shop, PORTAL_ROUTES.orders],
    },
  ];

  const MOBILE_NAV_ITEMS_PRO: NavItem[] = [
    { href: PORTAL_ROUTES.dashboard, icon: Home, label: t("dashboard") },
    { href: PORTAL_ROUTES.pets, icon: PawPrint, label: t("myPets") },
    { href: PORTAL_ROUTES.checkin, icon: CalendarDays, label: t("checkin") },
    { href: PORTAL_ROUTES.professionalProfile, icon: Stethoscope, label: t("myProfile") },
    {
      href: PORTAL_ROUTES.find,
      icon: Search,
      label: t("navSectionCare"),
      match: [PORTAL_ROUTES.find, PORTAL_ROUTES.bookings],
    },
  ];

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 start-0 w-60 bg-white border-e border-[var(--border)] z-20">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-[var(--border)] flex-shrink-0">
          <Link
            href={PORTAL_ROUTES.dashboard}
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
          {NAV_ITEMS.map(({ href, icon: Icon, label, match }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${isActive(pathname, href, match) ? "nav-link-active" : "nav-link-inactive"}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-3 border-t border-[var(--border)] pt-3 space-y-0.5">
          <LocaleSwitcher current={locale} />
          <Link
            href={PORTAL_ROUTES.settings}
            className={`nav-link ${pathname === PORTAL_ROUTES.settings ? "nav-link-active" : "nav-link-inactive"}`}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {t("settings")}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="nav-link nav-link-danger w-full cursor-pointer bg-transparent"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {t("signOut")}
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
              <p className="text-xs text-[var(--muted)] truncate leading-tight">{userEmail}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-[var(--border)] flex items-center justify-between px-4 z-20">
        <Link
          href={PORTAL_ROUTES.dashboard}
          className="font-bold text-[var(--ink)] text-lg no-underline flex items-center gap-2.5"
        >
          <div className="w-7 h-7 rounded-lg bg-[var(--teal)] flex items-center justify-center flex-shrink-0">
            <PawPrint className="w-3.5 h-3.5 text-white" />
          </div>
          {APP.name}
        </Link>
        <Link
          href={PORTAL_ROUTES.settings}
          className="w-9 h-9 rounded-full bg-[var(--teal-light)] flex items-center justify-center text-[var(--teal)] font-bold text-sm"
        >
          {initials}
        </Link>
      </header>

      {/* ── Mobile bottom nav ────────────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[var(--border)] flex safe-area-inset-bottom z-20">
        {(isProfessional ? MOBILE_NAV_ITEMS_PRO : MOBILE_NAV_ITEMS_DEFAULT).map(
          ({ href, icon: Icon, label, match }) => (
            <Link
              key={href}
              href={href}
              className={`mobile-tab-item ${isActive(pathname, href, match) ? "mobile-tab-item-active" : "mobile-tab-item-inactive"}`}
            >
              <Icon
                className={`w-5 h-5 ${isActive(pathname, href, match) ? "stroke-2" : "stroke-[1.5]"}`}
              />
              {label}
            </Link>
          ),
        )}
      </nav>
    </>
  );
}
