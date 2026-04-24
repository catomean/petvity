"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Activity, Syringe, FileText, Globe, Zap, Brain,
  PawPrint, Menu, X, ChevronDown, Search, ShoppingBag, Heart,
} from "lucide-react";
import { APP } from "@/lib/config/app";
import { useTranslations } from "next-intl";

export default function MarketingNav() {
  const t = useTranslations("nav");

  const [menuOpen, setMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setFeaturesOpen(false); setMenuOpen(false); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (featuresRef.current && !featuresRef.current.contains(e.target as Node)) {
        setFeaturesOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Feature menu items with hardcoded labels (not translated — marketing copy stays in English)
  const FEATURE_ITEMS = [
    { icon: Activity,    label: "Health Tracking",    desc: "Daily vitals, mood, energy — all in one place.",               href: "/features" },
    { icon: Brain,       label: "Digital Twin",       desc: "Living emotional portrait: Thriving, Content, Struggling.",    href: "/features" },
    { icon: Zap,         label: "Wellness Signals",   desc: "Auto healthy / watch / concern scoring.",                      href: "/features" },
    { icon: Syringe,     label: "Vaccinations",       desc: "Stay ahead of boosters and immunity gaps.",                    href: "/features" },
    { icon: FileText,    label: "Health Records",     desc: "Vet visits, lab results, surgery history.",                    href: "/features" },
    { icon: Globe,       label: "Public Profiles",    desc: "Shareable pet pages — your pet, the influencer.",             href: "/features" },
    { icon: Search,      label: "Find a Vet or Sitter", desc: "Book verified local professionals in minutes.",             href: "/features" },
    { icon: ShoppingBag, label: "Pet Marketplace",    desc: "Shop for food, accessories, and health essentials.",           href: "/features" },
    { icon: Heart,       label: "Adoption Listings",  desc: "List or find pets for adoption, fully managed.",              href: "/features" },
  ];

  const GUIDES_ITEMS = [
    { emoji: "🐕", label: "Dogs",   href: "/species/dog" },
    { emoji: "🐈", label: "Cats",   href: "/species/cat" },
    { emoji: "🐴", label: "Horses", href: "/species/horse" },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-[var(--border)]"
          : "bg-transparent"
      }`}
    >
      <div className="section-inner h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--teal)] flex items-center justify-center">
            <PawPrint className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[var(--ink)] text-lg">{APP.name}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Features megamenu trigger */}
          <div ref={featuresRef} className="relative">
            <button
              onClick={() => setFeaturesOpen((o) => !o)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--off)] transition-colors"
            >
              {t("features")}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${featuresOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Megamenu */}
            {featuresOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[520px] bg-white rounded-2xl border border-[var(--border)] shadow-xl p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4 px-1">
                  {t("megamenuTitle")}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {FEATURE_ITEMS.map(({ icon: Icon, label, desc, href }) => (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setFeaturesOpen(false)}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--off)] transition-colors no-underline group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[var(--teal-light)] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[var(--teal)] transition-colors">
                        <Icon className="w-4 h-4 text-[var(--teal)] group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)] leading-tight">{label}</p>
                        <p className="text-xs text-[var(--muted)] mt-0.5 leading-snug">{desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-3">
                    {t("speciesGuides")}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {GUIDES_ITEMS.map(({ emoji, label, href }) => (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setFeaturesOpen(false)}
                        className="flex items-center gap-1.5 text-xs font-medium text-[var(--ink2)] bg-[var(--off)] hover:bg-[var(--teal-light)] hover:text-[var(--teal)] px-3 py-1.5 rounded-full no-underline transition-colors"
                      >
                        <span>{emoji}</span>{label}
                      </Link>
                    ))}
                    <Link
                      href="/adopt"
                      onClick={() => setFeaturesOpen(false)}
                      className="flex items-center gap-1.5 text-xs font-medium text-[var(--danger)] bg-[var(--danger-bg)] hover:bg-red-100 px-3 py-1.5 rounded-full no-underline transition-colors ms-auto"
                    >
                      ❤️ {t("adopt")}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/#how-it-works"
            className="px-3 py-2 rounded-lg text-sm font-medium text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--off)] transition-colors no-underline"
          >
            {t("howItWorks")}
          </Link>
          <Link
            href="/pricing"
            className="px-3 py-2 rounded-lg text-sm font-medium text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--off)] transition-colors no-underline"
          >
            {t("pricing")}
          </Link>
          <Link
            href="/pros"
            className="px-3 py-2 rounded-lg text-sm font-medium text-[var(--teal)] hover:bg-[var(--teal-light)] transition-colors no-underline"
          >
            {t("forPros")}
          </Link>
          <Link
            href="/adopt"
            className="px-3 py-2 rounded-lg text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors no-underline"
          >
            ❤️ {t("adopt")}
          </Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--ink2)] hover:text-[var(--ink)] transition-colors no-underline"
          >
            {t("logIn")}
          </Link>
          <Link href="/register" className="btn-primary text-sm py-2 px-4">
            {t("getStartedFree")}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden p-2 rounded-lg hover:bg-[var(--off)] transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[var(--border)] shadow-lg">
          <div className="section-inner py-4 flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] px-3 pb-2">
              {t("features")}
            </p>
            {FEATURE_ITEMS.map(({ icon: Icon, label, desc, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--off)] transition-colors no-underline"
              >
                <div className="w-7 h-7 rounded-lg bg-[var(--teal-light)] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[var(--teal)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">{label}</p>
                  <p className="text-xs text-[var(--muted)]">{desc}</p>
                </div>
              </Link>
            ))}
            <div className="border-t border-[var(--border)] mt-3 pt-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] px-3 pb-2">
                {t("speciesGuides")}
              </p>
              <div className="flex gap-2 px-3 pb-3 flex-wrap">
                {GUIDES_ITEMS.map(({ emoji, label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-1 text-sm font-medium text-[var(--ink2)] bg-[var(--off)] px-3 py-1.5 rounded-full no-underline"
                  >
                    <span>{emoji}</span>{label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="border-t border-[var(--border)] pt-3 flex flex-col gap-2">
              <Link
                href="/pros"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-[var(--teal)] no-underline"
              >
                🩺 {t("forPros")}
              </Link>
              <Link
                href="/adopt"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-[var(--danger)] no-underline"
              >
                ❤️ {t("adopt")}
              </Link>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-[var(--ink2)] hover:text-[var(--ink)] no-underline"
              >
                {t("logIn")}
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="btn-primary justify-center"
              >
                {t("getStartedFree")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
