import Link from "next/link";
import {
  Activity,
  Syringe,
  Pill,
  CalendarDays,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Brain,
  Stethoscope,
  ShoppingBag,
  Heart,
} from "lucide-react";
import { SPECIES_CONFIG } from "@/lib/config/species";
import type { SpeciesId } from "@/lib/config/species";
import MarketingNav from "@/components/sections/MarketingNav";
import MarketingFooter from "@/components/sections/MarketingFooter";
import { HeroCTA } from "@/components/sections/HeroCTA";
import type { Metadata } from "next";
import { APP, APP_URL } from "@/lib/config/app";
import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/i18n/alternates";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const title = t("metaTitle", { app: APP.name });
  const description = t("metaDesc");
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    alternates: buildAlternates(""),
  };
}

const SPECIES_DISPLAY = Object.values(SPECIES_CONFIG).filter(
  (s) => s.id !== "other",
) as (typeof SPECIES_CONFIG)[SpeciesId][];

export default async function HomePage({ params }: Params) {
  const { locale } = await params;
  const [t, tPub] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "public" }),
  ]);

  const trustItems = [t("trustNoCreditCard"), t("trustUnlimitedPets"), t("trustCancelAnytime")];

  const PRICING_FEATURES = [
    t("pricingF1"),
    t("pricingF2"),
    t("pricingF3"),
    t("pricingF4"),
    t("pricingF5"),
    t("pricingF6"),
    t("pricingF7"),
    t("pricingF8"),
    t("pricingF9"),
  ];

  const heroMetrics = [
    { label: t("mockWeight"), value: "32.4 kg", sub: t("mockStable") },
    { label: t("mockTemp"), value: "38.4°C", sub: t("mockNormal") },
    { label: t("mockHeart"), value: "72 bpm", sub: t("mockNormal") },
    { label: t("mockEnergy"), value: "4 / 5", sub: t("mockUp") },
    { label: t("mockMood"), value: "5 / 5", sub: t("mockGreat") },
    { label: t("mockAnxiety"), value: "2 / 5", sub: t("mockCalmSub") },
  ];

  const trackingMetrics = [
    { label: t("mockWeight"), value: "32.4 kg" },
    { label: t("mockTemperature"), value: "38.4 °C" },
    { label: t("mockHeartRate"), value: "72 bpm" },
    { label: t("mockEnergy"), value: "4 / 5" },
    { label: t("mockMood"), value: "5 / 5" },
    { label: t("mockAnxiety"), value: "2 / 5" },
  ];

  const recordsMock = [
    {
      icon: "💉",
      label: "Rabies booster",
      meta: t("mockDueDays"),
      cls: "text-[var(--twin)] bg-[var(--twin-bg)]",
    },
    {
      icon: "🩺",
      label: t("mockRecordExam"),
      meta: t("mockMonthsAgo"),
      cls: "text-[var(--teal)] bg-[var(--teal-light)]",
    },
    {
      icon: "💊",
      label: "Heartgard · monthly",
      meta: t("mockActive"),
      cls: "text-[var(--accent)] bg-[var(--accent-light)]",
    },
    {
      icon: "🔬",
      label: t("mockRecordPanel"),
      meta: t("mockAllNormal"),
      cls: "text-[var(--info)] bg-[var(--info-bg)]",
    },
  ];

  const twinMetrics = [
    { label: t("mockMood"), value: 4, max: 5, note: undefined },
    { label: t("mockEnergy"), value: 4, max: 5, note: undefined },
    { label: t("mockSocialization"), value: 5, max: 5, note: undefined },
    { label: t("mockCalm"), value: 4, max: 5, note: t("mockLowAnxiety") },
  ];

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP.name,
    url: APP_URL,
    description: APP.tagline,
    foundingDate: String(APP.foundingYear),
    contactPoint: { "@type": "ContactPoint", email: APP.email, contactType: "customer support" },
  };

  const siteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP.name,
    url: APP_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${APP_URL}/${locale}/adopt?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="min-h-screen bg-[var(--obsidian)] text-[var(--platinum)] overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
      />
      <MarketingNav />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="lux-hero relative pt-28 pb-20 md:pt-36 md:pb-28">
          <div className="section-inner relative">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: Copy */}
              <div>
                <div className="eyebrow-editorial lux-rise mb-7">{t("heroBadge")}</div>

                <h1 className="display-title lux-rise lux-rise-2 text-[3.4rem] md:text-[5rem] mb-6">
                  {t("heroTitle1")}
                  <br />
                  <em>{t("heroTitle2")}</em>
                </h1>

                <p className="text-lg md:text-xl text-[var(--platinum-dim)] leading-relaxed mb-9 max-w-lg lux-rise lux-rise-3">
                  {t("heroSubtitle", { app: APP.name })}
                </p>

                <HeroCTA />

                {/* Trust strip */}
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {trustItems.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 text-sm text-[var(--mist-dark)]"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-[var(--champagne)] flex-shrink-0" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: App mockup */}
              <div className="relative lux-rise lux-rise-4">
                {/* Glow behind card */}
                <div
                  aria-hidden
                  className="absolute inset-8 bg-[var(--champagne)] opacity-10 blur-3xl rounded-3xl pointer-events-none"
                />

                <div className="card relative shadow-[var(--shadow-lg)] rounded-2xl overflow-hidden">
                  {/* Card header */}
                  <div className="bg-[var(--warm-dark)] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                        🐕
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">Buddy</p>
                        <p className="text-white/60 text-xs">Golden Retriever · 3 yr</p>
                      </div>
                    </div>
                    <span className="bg-[var(--green-bg)] text-[var(--green-text)] text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {t("mockHealthy")}
                    </span>
                  </div>

                  {/* Metrics grid */}
                  <div className="p-5">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {heroMetrics.map(({ label, value, sub }) => (
                        <div key={label} className="bg-[var(--off)] rounded-xl p-3 text-center">
                          <p className="text-[10px] text-[var(--muted)] mb-1 uppercase tracking-wide">
                            {label}
                          </p>
                          <p className="text-sm font-bold text-[var(--ink)]">{value}</p>
                          <p className="text-[10px] text-[var(--green-text)] mt-0.5">{sub}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[var(--off)] rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Syringe className="w-3 h-3 text-[var(--teal)]" />
                          <p className="text-[11px] font-semibold text-[var(--ink)]">
                            {t("mockNextVaccine")}
                          </p>
                        </div>
                        <p className="text-xs text-[var(--muted)]">{t("mockRabiesDays")}</p>
                      </div>
                      <div className="bg-[var(--off)] rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Pill className="w-3 h-3 text-[var(--accent)]" />
                          <p className="text-[11px] font-semibold text-[var(--ink)]">
                            {t("mockMedication")}
                          </p>
                        </div>
                        <p className="text-xs text-[var(--muted)]">{t("mockHeartgard")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Species strip ─────────────────────────────────────────────────── */}
        <div className="border-y border-[var(--hairline-soft)] bg-[var(--carbon)]">
          <div className="section-inner py-6">
            <p className="text-center text-[10px] font-medium uppercase tracking-[0.3em] text-[var(--mist-dark)] mb-5">
              {t("speciesEyebrow")}
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {SPECIES_DISPLAY.map((s) => (
                <span key={s.id} className="lux-chip">
                  <span className="text-sm">{s.emoji}</span>
                  {tPub(`species_${s.id}` as Parameters<typeof tPub>[0])}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Alternating feature sections ─────────────────────────────────── */}
        <section id="features" className="py-24 md:py-32">
          <div className="section-inner">
            <div className="text-center mb-20">
              <p className="ed-eyebrow mb-3">{t("featuresEyebrow")}</p>
              <h2 className="ed-title mb-5">{t("featuresTitle")}</h2>
              <p className="text-lg text-[var(--platinum-dim)] max-w-xl mx-auto leading-relaxed">
                {t("featuresDesc")}
              </p>
            </div>

            <div className="space-y-24">
              {/* Tracking section */}
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                <div>
                  <p className="ed-eyebrow mb-3">{t("trackingEyebrow")}</p>
                  <h3 className="ed-title-sm mb-5 leading-tight">{t("trackingTitle")}</h3>
                  <p className="text-lg text-[var(--platinum-dim)] leading-relaxed mb-8">
                    {t("trackingBody")}
                  </p>
                  <Link href="/register" className="btn-editorial">
                    {t("trackingCta")}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div>
                  <div className="card shadow-[var(--shadow-md)] p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-semibold text-[var(--ink)]">{t("mockCheckIn")}</p>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--green-bg)] text-[var(--green-text)]">
                        {t("mockHealthy")}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {trackingMetrics.map(({ label, value }) => (
                        <div key={label} className="bg-[var(--off)] rounded-xl p-3 text-center">
                          <p className="text-[10px] text-[var(--muted)] mb-1 uppercase tracking-wide">
                            {label}
                          </p>
                          <p className="text-sm font-bold text-[var(--ink)]">{value}</p>
                          <div className="w-1.5 h-1.5 bg-[var(--green)] rounded-full mx-auto mt-1.5" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Records section */}
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center lg:[direction:rtl]">
                <div className="lg:[direction:ltr]">
                  <p className="ed-eyebrow mb-3">{t("recordsEyebrow")}</p>
                  <h3 className="ed-title-sm mb-5 leading-tight">{t("recordsTitle")}</h3>
                  <p className="text-lg text-[var(--platinum-dim)] leading-relaxed mb-8">
                    {t("recordsBody")}
                  </p>
                  <Link href="/register" className="btn-editorial">
                    {t("recordsCta")}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="lg:[direction:ltr]">
                  <div className="card shadow-[var(--shadow-md)] p-5 space-y-2.5">
                    {recordsMock.map(({ icon, label, meta, cls }) => (
                      <div
                        key={label}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[var(--off)]"
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${cls}`}
                        >
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--ink)] truncate">
                            {label}
                          </p>
                          <p className="text-xs text-[var(--muted)]">{meta}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Digital Twin ─────────────────────────────────────────────────── */}
        <section className="py-24 md:py-32 lux-section-raised">
          <div className="section-inner">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Visual */}
              <div className="order-2 lg:order-1">
                <div className="card shadow-[var(--shadow-lg)] rounded-2xl overflow-hidden max-w-sm mx-auto">
                  {/* Card header */}
                  <div className="bg-[var(--warm-dark)] px-5 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                      🐕
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">Buddy</p>
                      <p className="text-white/60 text-xs">Golden Retriever · 3 yr</p>
                    </div>
                  </div>
                  <div className="p-5">
                    {/* Twin state badge */}
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                        {t("twinMockLabel")}
                      </p>
                      <span className="inline-flex items-center gap-1.5 bg-[var(--green-bg)] text-[var(--green-text)] text-xs font-bold px-3 py-1 rounded-full">
                        <Brain className="w-3 h-3" />
                        {t("mockThriving")}
                      </span>
                    </div>

                    {/* Trend */}
                    <div className="flex items-center gap-1.5 mb-5">
                      <TrendingUp className="w-3.5 h-3.5 text-[var(--green-text)]" />
                      <p className="text-xs text-[var(--green-text)] font-medium">
                        {t("twinMockTrend")}
                      </p>
                    </div>

                    {/* Metric bars */}
                    <div className="space-y-2.5">
                      {twinMetrics.map(({ label, value, max, note }) => (
                        <div key={label}>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-[var(--ink2)] font-medium">{label}</span>
                            <span className="text-xs text-[var(--muted)]">
                              {note ?? `${value}/${max}`}
                            </span>
                          </div>
                          <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--green)] rounded-full"
                              style={{ width: `${(value / max) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* History note */}
                    <p className="text-[11px] text-[var(--faint)] mt-4 text-center">
                      {t("twinMockHistory")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Copy */}
              <div className="order-1 lg:order-2">
                <p className="ed-eyebrow mb-3">{t("twinEyebrow")}</p>
                <h2 className="ed-title mb-6 leading-tight">
                  {t("twinTitle1")}
                  <br />
                  <span className="italic">{t("twinTitle2")}</span>, {t("twinTitle3")}
                </h2>
                <p className="text-lg text-[var(--platinum-dim)] leading-relaxed mb-5">
                  {t("twinP1")}
                </p>
                <p className="text-base text-[var(--platinum-dim)] leading-relaxed mb-8">
                  {t("twinP2")}
                </p>
                <Link href="/register" className="btn-editorial">
                  {t("twinCta")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Wellness signals ─────────────────────────────────────────────── */}
        <section className="border-y border-[var(--hairline-soft)] py-24 md:py-32">
          <div className="section-inner">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <p className="ed-eyebrow mb-3">{t("signalsEyebrow")}</p>
                <h2 className="ed-title mb-6 leading-tight">
                  {t("signalsTitle1")}
                  <br />
                  {t("signalsTitle2")}
                </h2>
                <p className="text-lg text-[var(--platinum-dim)] leading-relaxed mb-8">
                  {t("signalsP")}
                </p>
                <Link href="/register" className="btn-editorial">
                  {t("signalsCta")} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-4">
                {[
                  {
                    signalKey: "signalHealthy" as const,
                    descKey: "signalHealthyDesc" as const,
                    badge: "bg-[var(--green-bg)] text-[var(--green-text)]",
                    icon: CheckCircle,
                  },
                  {
                    signalKey: "signalWatch" as const,
                    descKey: "signalWatchDesc" as const,
                    badge: "bg-[var(--warn-bg)] text-[var(--warn-text)]",
                    icon: TrendingUp,
                  },
                  {
                    signalKey: "signalConcern" as const,
                    descKey: "signalConcernDesc" as const,
                    badge: "bg-[var(--danger-bg)] text-[var(--danger-text)]",
                    icon: Activity,
                  },
                ].map(({ signalKey, descKey, badge, icon: Icon }) => (
                  <div key={signalKey} className="lux-card p-5 flex items-start gap-4">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 mt-0.5 ${badge} flex items-center gap-1`}
                    >
                      <Icon className="w-3 h-3" />
                      {t(signalKey)}
                    </span>
                    <p className="text-sm text-[var(--platinum-dim)] leading-relaxed">
                      {t(descKey)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Platform ecosystem ───────────────────────────────────────────── */}
        <section className="py-24 md:py-32">
          <div className="section-inner">
            <div className="text-center mb-16">
              <p className="ed-eyebrow mb-3">{t("ecosystemEyebrow")}</p>
              <h2 className="ed-title mb-5">{t("ecosystemTitle")}</h2>
              <p className="text-lg text-[var(--platinum-dim)] max-w-xl mx-auto leading-relaxed">
                {t("ecosystemDesc")}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Find a Pro */}
              <div className="lux-card lux-card-hover p-7 flex flex-col gap-5">
                <div className="ed-icon w-12 h-12 rounded-2xl flex items-center justify-center">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[var(--platinum)] mb-2">
                    {t("vetTitle")}
                  </h3>
                  <p className="text-sm text-[var(--mist-dark)] leading-relaxed">{t("vetDesc")}</p>
                </div>
                <div className="space-y-2.5 mt-auto">
                  {[
                    { icon: "🔍", text: t("vetBullet1") },
                    { icon: "⭐", text: t("vetBullet2") },
                    { icon: "📅", text: t("vetBullet3") },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5">
                      <span className="text-base w-5 flex-shrink-0">{icon}</span>
                      <span className="text-sm text-[var(--platinum-dim)]">{text}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register" className="btn-editorial-ghost-sm justify-center mt-2">
                  {t("vetCta")} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Marketplace */}
              <div className="lux-card lux-card-hover p-7 flex flex-col gap-5">
                <div className="ed-icon w-12 h-12 rounded-2xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[var(--platinum)] mb-2">
                    {t("mktTitle")}
                  </h3>
                  <p className="text-sm text-[var(--mist-dark)] leading-relaxed">{t("mktDesc")}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-auto">
                  {[
                    { icon: "🦴", name: "Dental Chews", price: "$18.99" },
                    { icon: "🐟", name: "Omega-3", price: "$24.99" },
                    { icon: "🛏️", name: "Ortho Bed", price: "$89.99" },
                    { icon: "💊", name: "Probiotics", price: "$22.99" },
                  ].map(({ icon, name, price }) => (
                    <div
                      key={name}
                      className="bg-white/[0.04] border border-[var(--hairline-soft)] rounded-xl p-2.5 flex items-center gap-2"
                    >
                      <span className="text-base">{icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--platinum)] truncate">
                          {name}
                        </p>
                        <p className="text-xs text-[var(--champagne)] font-semibold">{price}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href={`/${locale}/shop`}
                  className="btn-editorial-ghost-sm justify-center mt-2"
                >
                  {t("mktCta")} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Adoption */}
              <div className="lux-card lux-card-hover p-7 flex flex-col gap-5">
                <div className="ed-icon w-12 h-12 rounded-2xl flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[var(--platinum)] mb-2">
                    {t("adoptTitle")}
                  </h3>
                  <p className="text-sm text-[var(--mist-dark)] leading-relaxed">
                    {t("adoptDesc")}
                  </p>
                </div>
                <div className="space-y-2.5 mt-auto">
                  {[
                    { icon: "📋", text: t("adoptBullet1") },
                    { icon: "🌍", text: t("adoptBullet2") },
                    { icon: "✅", text: t("adoptBullet3") },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5">
                      <span className="text-base w-5 flex-shrink-0">{icon}</span>
                      <span className="text-sm text-[var(--platinum-dim)]">{text}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href={`/${locale}/adopt`}
                  className="btn-editorial-ghost-sm justify-center mt-2"
                >
                  {t("adoptCta")} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Live proof — real resident pets, publicly tracked ────────────── */}
        <section className="py-24 md:py-32">
          <div className="section-inner">
            <div className="text-center mb-14">
              <p className="ed-eyebrow mb-3">{t("liveProofEyebrow")}</p>
              <h2 className="ed-title">{t("liveProofTitle")}</h2>
              <p className="text-[var(--platinum-dim)] max-w-xl mx-auto mt-4">
                {t("liveProofDesc")}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {[
                {
                  emoji: "🐈",
                  name: "Milo",
                  detail: t("liveProofMilo"),
                  href: `/${locale}/pets/milo`,
                },
                {
                  emoji: "🐕",
                  name: "Rosie",
                  detail: t("liveProofRosie"),
                  href: `/${locale}/pets/rosie`,
                },
              ].map(({ emoji, name, detail, href }) => (
                <Link
                  key={name}
                  href={href}
                  className="lux-card lux-card-hover p-7 flex flex-col gap-4 no-underline"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{emoji}</span>
                    <div>
                      <p className="text-lg font-semibold text-[var(--platinum)]">{name}</p>
                      <p className="text-xs text-[var(--mist-dark)]">{detail}</p>
                    </div>
                  </div>
                  <span className="text-sm text-[var(--champagne)] inline-flex items-center gap-1.5 mt-auto">
                    {t("liveProofCta")} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────────── */}
        <section
          id="how-it-works"
          className="lux-section-raised border-y border-[var(--hairline-soft)] py-24 md:py-32"
        >
          <div className="section-inner">
            <div className="text-center mb-16">
              <p className="ed-eyebrow mb-3">{t("howEyebrow")}</p>
              <h2 className="ed-title mb-5">{t("howTitle")}</h2>
              <p className="text-lg text-[var(--platinum-dim)]">{t("howDesc")}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              {[
                { n: "01", titleKey: "step1Title" as const, descKey: "step1Desc" as const },
                { n: "02", titleKey: "step2Title" as const, descKey: "step2Desc" as const },
                { n: "03", titleKey: "step3Title" as const, descKey: "step3Desc" as const },
              ].map(({ n, titleKey, descKey }, i) => (
                <div key={n} className="text-center relative">
                  {i < 2 && (
                    <div
                      aria-hidden
                      className="hidden md:block absolute top-7 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px bg-[var(--hairline)]"
                    />
                  )}
                  <div className="w-14 h-14 rounded-full ed-num text-xl flex items-center justify-center mx-auto mb-5">
                    {n}
                  </div>
                  <h3 className="font-semibold text-[var(--platinum)] mb-2 text-base">
                    {t(titleKey)}
                  </h3>
                  <p className="text-sm text-[var(--mist-dark)] leading-relaxed">{t(descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────────────────────── */}
        <section id="pricing" className="py-24 md:py-32">
          <div className="section-inner text-center">
            <p className="ed-eyebrow mb-3">{t("pricingEyebrow")}</p>
            <h2 className="ed-title mb-5">{t("pricingTitle")}</h2>
            <p className="text-lg text-[var(--platinum-dim)] max-w-lg mx-auto mb-12 leading-relaxed">
              {t("pricingDesc")}
            </p>

            <div className="lux-card max-w-sm mx-auto p-8 text-left">
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-display text-6xl font-extralight text-[var(--champagne)]">
                  $0
                </span>
                <span className="text-[var(--mist-dark)] text-base">/ month</span>
              </div>
              <p className="text-sm text-[var(--mist-dark)] mb-7">{t("pricingNoCreditCard")}</p>

              <ul className="space-y-3.5 mb-8">
                {PRICING_FEATURES.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-[var(--champagne)] flex-shrink-0" />
                    <span className="text-sm text-[var(--platinum-dim)]">{item}</span>
                  </li>
                ))}
              </ul>

              <Link href="/register" className="btn-editorial w-full justify-center">
                {t("pricingCta")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────────── */}
        <section className="lux-section-deep relative overflow-hidden py-24 md:py-32">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, var(--champagne) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div
            aria-hidden
            className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[var(--champagne)] opacity-[0.06] pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-[var(--champagne)] opacity-[0.06] pointer-events-none"
          />

          <div className="section-inner relative text-center">
            <CalendarDays className="w-11 h-11 text-[var(--champagne)] mx-auto mb-7 opacity-90" />
            <h2 className="ed-title ed-title-on-dark mb-5">
              {t("finalTitle1")}
              <br />
              {t("finalTitle2")}
            </h2>
            <p className="text-lg text-[var(--platinum-dim)] opacity-80 mb-10 max-w-xl mx-auto leading-relaxed">
              {t("finalDesc")}
            </p>
            <Link href="/register" className="btn-editorial-light">
              {t("finalCta")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
