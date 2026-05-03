import Link from "next/link";
import {
  Activity, Syringe, Pill,
  CalendarDays, CheckCircle, TrendingUp,
  ArrowRight, Zap, Star,
  Brain, Stethoscope, ShoppingBag, Heart,
} from "lucide-react";
import { SPECIES_CONFIG } from "@/lib/config/species";
import type { SpeciesId } from "@/lib/config/species";
import MarketingNav from "@/components/sections/MarketingNav";
import MarketingFooter from "@/components/sections/MarketingFooter";
import { HeroCTA } from "@/components/sections/HeroCTA";
import type { Metadata } from "next";
import { APP } from "@/lib/config/app";
import { getTranslations } from "next-intl/server";

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
  };
}

const SPECIES_DISPLAY = Object.values(SPECIES_CONFIG).filter(
  (s) => s.id !== "other"
) as (typeof SPECIES_CONFIG)[SpeciesId][];

export default async function HomePage({ params }: Params) {
  const { locale } = await params;
  const [t, tPub] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "public" }),
  ]);

  const trustItems = [
    t("trustNoCreditCard"),
    t("trustUnlimitedPets"),
    t("trustCancelAnytime"),
  ];

  const TESTIMONIALS = [
    {
      quote: t("t1Quote"),
      name: "Sarah M.",
      pet: t("t1Pet"),
      initials: "SM",
      color: "bg-[var(--teal-light)] text-[var(--teal)]",
    },
    {
      quote: t("t2Quote"),
      name: "James T.",
      pet: t("t2Pet"),
      initials: "JT",
      color: "bg-amber-50 text-amber-700",
    },
    {
      quote: t("t3Quote"),
      name: "Amara O.",
      pet: t("t3Pet"),
      initials: "AO",
      color: "bg-purple-50 text-purple-700",
    },
  ];

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
    { label: t("mockWeight"),  value: "32.4 kg", sub: t("mockStable") },
    { label: t("mockTemp"),    value: "38.4°C",  sub: t("mockNormal") },
    { label: t("mockHeart"),   value: "72 bpm",  sub: t("mockNormal") },
    { label: t("mockEnergy"),  value: "4 / 5",   sub: t("mockUp") },
    { label: t("mockMood"),    value: "5 / 5",   sub: t("mockGreat") },
    { label: t("mockAnxiety"), value: "2 / 5",   sub: t("mockCalmSub") },
  ];

  const trackingMetrics = [
    { label: t("mockWeight"),      value: "32.4 kg" },
    { label: t("mockTemperature"), value: "38.4 °C" },
    { label: t("mockHeartRate"),   value: "72 bpm" },
    { label: t("mockEnergy"),      value: "4 / 5" },
    { label: t("mockMood"),        value: "5 / 5" },
    { label: t("mockAnxiety"),     value: "2 / 5" },
  ];

  const recordsMock = [
    { icon: "💉", label: "Rabies booster",        meta: t("mockDueDays"),    cls: "text-purple-600 bg-purple-50" },
    { icon: "🩺", label: t("mockRecordExam"),      meta: t("mockMonthsAgo"), cls: "text-[var(--teal)] bg-[var(--teal-light)]" },
    { icon: "💊", label: "Heartgard · monthly",    meta: t("mockActive"),    cls: "text-[var(--accent)] bg-[var(--accent-light)]" },
    { icon: "🔬", label: t("mockRecordPanel"),     meta: t("mockAllNormal"), cls: "text-blue-600 bg-blue-50" },
  ];

  const twinMetrics = [
    { label: t("mockMood"),          value: 4, max: 5, note: undefined },
    { label: t("mockEnergy"),        value: 4, max: 5, note: undefined },
    { label: t("mockSocialization"), value: 5, max: 5, note: undefined },
    { label: t("mockCalm"),          value: 4, max: 5, note: t("mockLowAnxiety") },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <MarketingNav />

      <main>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28">
        {/* Warm gradient background */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-[var(--off)] via-white to-[#f0fafb] pointer-events-none"
        />
        {/* Decorative blobs */}
        <div aria-hidden className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[var(--teal-light)] opacity-30 blur-[120px] pointer-events-none -translate-y-1/3 translate-x-1/3" />
        <div aria-hidden className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[var(--accent-light)] opacity-40 blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/3" />

        <div className="section-inner relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[var(--teal-light)] text-[var(--teal)] text-xs font-semibold px-3 py-1.5 rounded-full mb-7 border border-[var(--teal-mid)]">
                <Zap className="w-3 h-3" />
                {t("heroBadge")}
              </div>

              <h1 className="text-[2.8rem] md:text-[3.6rem] font-extrabold text-[var(--ink)] leading-[1.05] tracking-tight mb-6">
                {t("heroTitle1")}
                <br />
                <span className="text-[var(--teal)]">{t("heroTitle2")}</span>
              </h1>

              <p className="text-lg md:text-xl text-[var(--muted)] leading-relaxed mb-9 max-w-lg">
                {t("heroSubtitle", { app: APP.name })}
              </p>

              <HeroCTA />

              {/* Trust strip */}
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {trustItems.map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)]">
                    <CheckCircle className="w-3.5 h-3.5 text-[var(--green-text)] flex-shrink-0" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: App mockup */}
            <div className="relative">
              {/* Glow behind card */}
              <div aria-hidden className="absolute inset-8 bg-[var(--teal)] opacity-10 blur-3xl rounded-3xl pointer-events-none" />

              <div className="card relative shadow-[var(--shadow-lg)] rounded-2xl overflow-hidden">
                {/* Card header */}
                <div className="bg-[var(--teal)] px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">🐕</div>
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
                        <p className="text-[10px] text-[var(--muted)] mb-1 uppercase tracking-wide">{label}</p>
                        <p className="text-sm font-bold text-[var(--ink)]">{value}</p>
                        <p className="text-[10px] text-[var(--green-text)] mt-0.5">{sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[var(--off)] rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Syringe className="w-3 h-3 text-[var(--teal)]" />
                        <p className="text-[11px] font-semibold text-[var(--ink)]">{t("mockNextVaccine")}</p>
                      </div>
                      <p className="text-xs text-[var(--muted)]">{t("mockRabiesDays")}</p>
                    </div>
                    <div className="bg-[var(--off)] rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Pill className="w-3 h-3 text-[var(--accent)]" />
                        <p className="text-[11px] font-semibold text-[var(--ink)]">{t("mockMedication")}</p>
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
      <div className="border-y border-[var(--border)] bg-[var(--off)]">
        <div className="section-inner py-6">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--faint)] mb-5">
            {t("speciesEyebrow")}
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {SPECIES_DISPLAY.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 bg-white border border-[var(--border)] text-[var(--ink2)] text-xs font-medium px-3.5 py-1.5 rounded-full shadow-sm"
              >
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
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal)] mb-3">
              {t("featuresEyebrow")}
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] tracking-tight mb-5">
              {t("featuresTitle")}
            </h2>
            <p className="text-lg text-[var(--muted)] max-w-xl mx-auto leading-relaxed">
              {t("featuresDesc")}
            </p>
          </div>

          <div className="space-y-24">
            {/* Tracking section */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal)] mb-3">{t("trackingEyebrow")}</p>
                <h3 className="text-3xl md:text-4xl font-extrabold text-[var(--ink)] tracking-tight mb-5 leading-tight">
                  {t("trackingTitle")}
                </h3>
                <p className="text-lg text-[var(--muted)] leading-relaxed mb-8">{t("trackingBody")}</p>
                <Link href="/register" className="btn-primary">
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
                        <p className="text-[10px] text-[var(--muted)] mb-1 uppercase tracking-wide">{label}</p>
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
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal)] mb-3">{t("recordsEyebrow")}</p>
                <h3 className="text-3xl md:text-4xl font-extrabold text-[var(--ink)] tracking-tight mb-5 leading-tight">
                  {t("recordsTitle")}
                </h3>
                <p className="text-lg text-[var(--muted)] leading-relaxed mb-8">{t("recordsBody")}</p>
                <Link href="/register" className="btn-primary">
                  {t("recordsCta")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="lg:[direction:ltr]">
                <div className="card shadow-[var(--shadow-md)] p-5 space-y-2.5">
                  {recordsMock.map(({ icon, label, meta, cls }) => (
                    <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--off)]">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${cls}`}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--ink)] truncate">{label}</p>
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
      <section className="py-24 md:py-32 bg-gradient-to-br from-violet-50 via-white to-[var(--teal-light)]">
        <div className="section-inner">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Visual */}
            <div className="order-2 lg:order-1">
              <div className="card shadow-[var(--shadow-lg)] rounded-2xl overflow-hidden max-w-sm mx-auto">
                {/* Card header */}
                <div className="bg-gradient-to-r from-violet-600 to-[var(--teal)] px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">🐕</div>
                  <div>
                    <p className="font-bold text-white text-sm">Buddy</p>
                    <p className="text-white/60 text-xs">Golden Retriever · 3 yr</p>
                  </div>
                </div>
                <div className="p-5">
                  {/* Twin state badge */}
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">{t("twinMockLabel")}</p>
                    <span className="inline-flex items-center gap-1.5 bg-[var(--green-bg)] text-[var(--green-text)] text-xs font-bold px-3 py-1 rounded-full">
                      <Brain className="w-3 h-3" />
                      {t("mockThriving")}
                    </span>
                  </div>

                  {/* Trend */}
                  <div className="flex items-center gap-1.5 mb-5">
                    <TrendingUp className="w-3.5 h-3.5 text-[var(--green-text)]" />
                    <p className="text-xs text-[var(--green-text)] font-medium">{t("twinMockTrend")}</p>
                  </div>

                  {/* Metric bars */}
                  <div className="space-y-2.5">
                    {twinMetrics.map(({ label, value, max, note }) => (
                      <div key={label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-[var(--ink2)] font-medium">{label}</span>
                          <span className="text-xs text-[var(--muted)]">{note ?? `${value}/${max}`}</span>
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
                  <p className="text-[11px] text-[var(--faint)] mt-4 text-center">{t("twinMockHistory")}</p>
                </div>
              </div>
            </div>

            {/* Copy */}
            <div className="order-1 lg:order-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 mb-3">{t("twinEyebrow")}</p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] tracking-tight mb-6 leading-tight">
                {t("twinTitle1")}
                <br /><span className="text-violet-600">{t("twinTitle2")}</span>, {t("twinTitle3")}
              </h2>
              <p className="text-lg text-[var(--muted)] leading-relaxed mb-5">
                {t("twinP1")}
              </p>
              <p className="text-base text-[var(--muted)] leading-relaxed mb-8">
                {t("twinP2")}
              </p>
              <Link href="/register" className="btn-primary">
                {t("twinCta")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Wellness signals ─────────────────────────────────────────────── */}
      <section className="bg-[var(--off)] border-y border-[var(--border)] py-24 md:py-32">
        <div className="section-inner">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal)] mb-3">
                {t("signalsEyebrow")}
              </p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] tracking-tight mb-6 leading-tight">
                {t("signalsTitle1")}
                <br />{t("signalsTitle2")}
              </h2>
              <p className="text-lg text-[var(--muted)] leading-relaxed mb-8">
                {t("signalsP")}
              </p>
              <Link href="/register" className="btn-primary">
                {t("signalsCta")} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {[
                {
                  signalKey: "signalHealthy" as const,
                  descKey: "signalHealthyDesc" as const,
                  badge: "bg-[var(--green-bg)] text-[var(--green-text)]",
                  border: "border-[#bbf7d0]",
                  icon: CheckCircle,
                },
                {
                  signalKey: "signalWatch" as const,
                  descKey: "signalWatchDesc" as const,
                  badge: "bg-[var(--warn-bg)] text-[var(--warn-text)]",
                  border: "border-[#fde68a]",
                  icon: TrendingUp,
                },
                {
                  signalKey: "signalConcern" as const,
                  descKey: "signalConcernDesc" as const,
                  badge: "bg-[var(--danger-bg)] text-[var(--danger-text)]",
                  border: "border-[#fca5a5]",
                  icon: Activity,
                },
              ].map(({ signalKey, descKey, badge, border, icon: Icon }) => (
                <div key={signalKey} className={`card border-2 ${border} p-5 flex items-start gap-4`}>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 mt-0.5 ${badge} flex items-center gap-1`}>
                    <Icon className="w-3 h-3" />
                    {t(signalKey)}
                  </span>
                  <p className="text-sm text-[var(--ink2)] leading-relaxed">{t(descKey)}</p>
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
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal)] mb-3">
              {t("ecosystemEyebrow")}
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] tracking-tight mb-5">
              {t("ecosystemTitle")}
            </h2>
            <p className="text-lg text-[var(--muted)] max-w-xl mx-auto leading-relaxed">
              {t("ecosystemDesc")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Find a Pro */}
            <div className="card p-7 flex flex-col gap-5 hover:shadow-[var(--shadow-md)] transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-[var(--teal)]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--ink)] mb-2">{t("vetTitle")}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  {t("vetDesc")}
                </p>
              </div>
              <div className="space-y-2.5 mt-auto">
                {[
                  { icon: "🔍", text: t("vetBullet1") },
                  { icon: "⭐", text: t("vetBullet2") },
                  { icon: "📅", text: t("vetBullet3") },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <span className="text-base w-5 flex-shrink-0">{icon}</span>
                    <span className="text-sm text-[var(--ink2)]">{text}</span>
                  </div>
                ))}
              </div>
              <Link href="/register" className="btn-outline text-sm justify-center mt-2">
                {t("vetCta")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Marketplace */}
            <div className="card p-7 flex flex-col gap-5 hover:shadow-[var(--shadow-md)] transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--ink)] mb-2">{t("mktTitle")}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  {t("mktDesc")}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-auto">
                {[
                  { icon: "🦴", name: "Dental Chews", price: "$18.99" },
                  { icon: "🐟", name: "Omega-3",      price: "$24.99" },
                  { icon: "🛏️", name: "Ortho Bed",    price: "$89.99" },
                  { icon: "💊", name: "Probiotics",   price: "$22.99" },
                ].map(({ icon, name, price }) => (
                  <div key={name} className="bg-[var(--off)] rounded-xl p-2.5 flex items-center gap-2">
                    <span className="text-base">{icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--ink)] truncate">{name}</p>
                      <p className="text-xs text-[var(--teal)] font-semibold">{price}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href={`/${locale}/shop`} className="btn-outline text-sm justify-center mt-2">
                {t("mktCta")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Adoption */}
            <div className="card p-7 flex flex-col gap-5 hover:shadow-[var(--shadow-md)] transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center">
                <Heart className="w-6 h-6 text-pink-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--ink)] mb-2">{t("adoptTitle")}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
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
                    <span className="text-sm text-[var(--ink2)]">{text}</span>
                  </div>
                ))}
              </div>
              <Link href={`/${locale}/adopt`} className="btn-outline text-sm justify-center mt-2">
                {t("adoptCta")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="section-inner">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal)] mb-3">
              {t("testimonialsEyebrow")}
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] tracking-tight">
              {t("testimonialsTitle")}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ quote, name, pet, initials, color }) => (
              <div key={name} className="card card-hover p-7 flex flex-col gap-5">
                {/* Stars */}
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="text-sm text-[var(--ink2)] leading-relaxed flex-1">
                  &ldquo;{quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${color}`}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">{name}</p>
                    <p className="text-xs text-[var(--muted)]">{pet}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-[var(--off)] border-y border-[var(--border)] py-24 md:py-32">
        <div className="section-inner">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal)] mb-3">
              {t("howEyebrow")}
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] tracking-tight mb-5">
              {t("howTitle")}
            </h2>
            <p className="text-lg text-[var(--muted)]">
              {t("howDesc")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { n: "01", titleKey: "step1Title" as const, descKey: "step1Desc" as const },
              { n: "02", titleKey: "step2Title" as const, descKey: "step2Desc" as const },
              { n: "03", titleKey: "step3Title" as const, descKey: "step3Desc" as const },
            ].map(({ n, titleKey, descKey }, i) => (
              <div key={n} className="text-center relative">
                {i < 2 && (
                  <div aria-hidden className="hidden md:block absolute top-7 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px bg-[var(--border)]" />
                )}
                <div className="w-14 h-14 rounded-2xl bg-[var(--teal)] text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-5 shadow-[0_4px_12px_rgb(13_110_120/0.25)]">
                  {n}
                </div>
                <h3 className="font-bold text-[var(--ink)] mb-2 text-base">{t(titleKey)}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 md:py-32">
        <div className="section-inner text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal)] mb-3">{t("pricingEyebrow")}</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] tracking-tight mb-5">{t("pricingTitle")}</h2>
          <p className="text-lg text-[var(--muted)] max-w-lg mx-auto mb-12 leading-relaxed">
            {t("pricingDesc")}
          </p>

          <div className="card max-w-sm mx-auto p-8 text-left shadow-[var(--shadow-lg)]">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-5xl font-extrabold text-[var(--ink)] tracking-tight">$0</span>
              <span className="text-[var(--muted)] text-base">/ month</span>
            </div>
            <p className="text-sm text-[var(--muted)] mb-7">{t("pricingNoCreditCard")}</p>

            <ul className="space-y-3.5 mb-8">
              {PRICING_FEATURES.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-[var(--green-text)] flex-shrink-0" />
                  <span className="text-sm text-[var(--ink2)]">{item}</span>
                </li>
              ))}
            </ul>

            <Link href="/register" className="btn-primary w-full justify-center py-3 text-base">
              {t("pricingCta")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[var(--teal)] py-24 md:py-32">
        <div aria-hidden className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div aria-hidden className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
        <div aria-hidden className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />

        <div className="section-inner relative text-center">
          <CalendarDays className="w-12 h-12 text-[var(--teal-light)] mx-auto mb-6 opacity-80" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
            {t("finalTitle1")}
            <br />{t("finalTitle2")}
          </h2>
          <p className="text-lg text-[var(--teal-mid)] mb-10 max-w-xl mx-auto leading-relaxed">
            {t("finalDesc")}
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-[var(--teal)] font-bold text-base px-8 py-4 rounded-xl hover:bg-[var(--teal-light)] transition-colors no-underline shadow-[0_4px_20px_rgb(0_0_0/0.15)]"
          >
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
