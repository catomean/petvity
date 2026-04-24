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
import type { Metadata } from "next";
import { APP } from "@/lib/config/app";

export const metadata: Metadata = {
  title: `${APP.name} — The global platform for pet care`,
  description: "Track your pet's health signals, connect with vets and sitters, shop essentials, and manage adoption — all in one place. Free forever.",
  openGraph: {
    title: `${APP.name} — The global platform for pet care`,
    description: "Track your pet's health signals, connect with vets and sitters, shop essentials, and manage adoption — all in one place. Free forever.",
    type: "website",
  },
};

const SPECIES_DISPLAY = Object.values(SPECIES_CONFIG).filter(
  (s) => s.id !== "other"
) as (typeof SPECIES_CONFIG)[SpeciesId][];

const TESTIMONIALS = [
  {
    quote:
      "Petvity flagged Luna's energy dropping for three days in a row. I took her in — caught an ear infection before it got serious. My vet was genuinely impressed I noticed so quickly.",
    name: "Sarah M.",
    pet: "Luna, Border Collie · 4 years old",
    initials: "SM",
    color: "bg-[var(--teal-light)] text-[var(--teal)]",
  },
  {
    quote:
      "I was always second-guessing myself as a first-time cat owner. Now I have data. Mochi's mood scores helped me realise she was stressed by the new furniture — who knew.",
    name: "James T.",
    pet: "Mochi, Persian Cat · 2 years old",
    initials: "JT",
    color: "bg-amber-50 text-amber-700",
  },
  {
    quote:
      "Two rabbits, two vaccination schedules, one app. The reminders alone save me a dozen panicked searches per month. It just works.",
    name: "Amara O.",
    pet: "Pepper & Basil, Rabbits",
    initials: "AO",
    color: "bg-purple-50 text-purple-700",
  },
];

const FEATURE_SECTIONS = [
  {
    eyebrow: "Daily health tracking",
    title: "Know what's normal. Catch what isn't.",
    body: "Log weight, temperature, heart rate, energy, and mood in under a minute. Petvity compares every entry against species-specific normal ranges — automatically flagging anything worth watching.",
    cta: "Start tracking",
    visual: {
      heading: "Today's check-in",
      metrics: [
        { label: "Weight", value: "32.4 kg", ok: true },
        { label: "Temperature", value: "38.4 °C", ok: true },
        { label: "Heart rate", value: "72 bpm", ok: true },
        { label: "Energy", value: "4 / 5", ok: true },
        { label: "Mood", value: "5 / 5", ok: true },
        { label: "Anxiety", value: "2 / 5", ok: true },
      ],
      badge: { label: "Healthy", cls: "bg-[var(--green-bg)] text-[var(--green)]" },
    },
    flip: false,
  },
  {
    eyebrow: "Full medical history",
    title: "Everything your vet wishes you tracked.",
    body: "Vet visits, vaccinations, medications, lab results, surgeries — all in one place, always at your fingertips. Bring a complete history to every appointment instead of relying on memory.",
    cta: "See what's tracked",
    visual: {
      records: [
        { icon: "💉", label: "Rabies booster", meta: "Due in 47 days", cls: "text-purple-600 bg-purple-50" },
        { icon: "🩺", label: "Annual wellness exam", meta: "3 months ago", cls: "text-[var(--teal)] bg-[var(--teal-light)]" },
        { icon: "💊", label: "Heartgard · monthly", meta: "Active", cls: "text-[var(--accent)] bg-[var(--accent-light)]" },
        { icon: "🔬", label: "Full blood panel", meta: "All values normal", cls: "text-blue-600 bg-blue-50" },
      ],
    },
    flip: true,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <MarketingNav />

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
                10 species · Digital Twin · Free forever
              </div>

              <h1 className="text-[2.8rem] md:text-[3.6rem] font-extrabold text-[var(--ink)] leading-[1.05] tracking-tight mb-6">
                Your pet has a signal.
                <br />
                <span className="text-[var(--teal)]">Now you can read it.</span>
              </h1>

              <p className="text-lg md:text-xl text-[var(--muted)] leading-relaxed mb-9 max-w-lg">
                One daily check-in builds a living Digital Twin — physical vitals
                plus emotional state, compared against species-specific norms.
                When something shifts,{" "}
                <strong className="text-[var(--ink2)] font-medium">
                  Petvity tells you what, and connects you to a vet who can act on it.
                </strong>
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/register" className="btn-primary text-base px-7 py-3.5 justify-center">
                  Get started free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="#how-it-works" className="btn-outline text-base px-7 py-3.5 justify-center">
                  See how it works
                </Link>
              </div>

              {/* Trust strip */}
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {["No credit card", "Unlimited pets", "Cancel anytime"].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)]">
                    <CheckCircle className="w-3.5 h-3.5 text-[var(--green)] flex-shrink-0" />
                    {t}
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
                  <span className="bg-[var(--green-bg)] text-[var(--green)] text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Healthy
                  </span>
                </div>

                {/* Metrics grid */}
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: "Weight", value: "32.4 kg", sub: "↔ stable" },
                      { label: "Temp", value: "38.4°C", sub: "✓ normal" },
                      { label: "Heart", value: "72 bpm", sub: "✓ normal" },
                      { label: "Energy", value: "4 / 5", sub: "↑ up" },
                      { label: "Mood", value: "5 / 5", sub: "✓ great" },
                      { label: "Anxiety", value: "2 / 5", sub: "✓ calm" },
                    ].map(({ label, value, sub }) => (
                      <div key={label} className="bg-[var(--off)] rounded-xl p-3 text-center">
                        <p className="text-[10px] text-[var(--muted)] mb-1 uppercase tracking-wide">{label}</p>
                        <p className="text-sm font-bold text-[var(--ink)]">{value}</p>
                        <p className="text-[10px] text-[var(--green)] mt-0.5">{sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[var(--off)] rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Syringe className="w-3 h-3 text-[var(--teal)]" />
                        <p className="text-[11px] font-semibold text-[var(--ink)]">Next vaccine</p>
                      </div>
                      <p className="text-xs text-[var(--muted)]">Rabies · 47 days</p>
                    </div>
                    <div className="bg-[var(--off)] rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Pill className="w-3 h-3 text-[var(--accent)]" />
                        <p className="text-[11px] font-semibold text-[var(--ink)]">Medication</p>
                      </div>
                      <p className="text-xs text-[var(--muted)]">Heartgard · monthly</p>
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
            Every pet, one platform
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {SPECIES_DISPLAY.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 bg-white border border-[var(--border)] text-[var(--ink2)] text-xs font-medium px-3.5 py-1.5 rounded-full shadow-sm"
              >
                <span className="text-sm">{s.emoji}</span>
                {s.label}
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
              Built for real pet care
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] tracking-tight mb-5">
              The complete toolkit
            </h2>
            <p className="text-lg text-[var(--muted)] max-w-xl mx-auto leading-relaxed">
              From daily check-ins to full medical histories — everything
              your vet wishes you kept track of.
            </p>
          </div>

          <div className="space-y-24">
            {FEATURE_SECTIONS.map(({ eyebrow, title, body, cta, visual, flip }) => (
              <div
                key={title}
                className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${flip ? "lg:[direction:rtl]" : ""}`}
              >
                <div className={flip ? "lg:[direction:ltr]" : ""}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal)] mb-3">{eyebrow}</p>
                  <h3 className="text-3xl md:text-4xl font-extrabold text-[var(--ink)] tracking-tight mb-5 leading-tight">
                    {title}
                  </h3>
                  <p className="text-lg text-[var(--muted)] leading-relaxed mb-8">{body}</p>
                  <Link href="/register" className="btn-primary">
                    {cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Visual */}
                <div className={flip ? "lg:[direction:ltr]" : ""}>
                  {"metrics" in visual && visual.metrics ? (
                    <div className="card shadow-[var(--shadow-md)] p-5">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-[var(--ink)]">{visual.heading}</p>
                        {visual.badge && (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${visual.badge.cls}`}>
                            {visual.badge.label}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2.5">
                        {visual.metrics.map(({ label, value, ok }) => (
                          <div key={label} className="bg-[var(--off)] rounded-xl p-3 text-center">
                            <p className="text-[10px] text-[var(--muted)] mb-1 uppercase tracking-wide">{label}</p>
                            <p className="text-sm font-bold text-[var(--ink)]">{value}</p>
                            {ok && <div className="w-1.5 h-1.5 bg-[var(--green)] rounded-full mx-auto mt-1.5" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="card shadow-[var(--shadow-md)] p-5 space-y-2.5">
                      {visual.records.map(({ icon, label, meta, cls }) => (
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
                  )}
                </div>
              </div>
            ))}
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
                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Digital Twin</p>
                    <span className="inline-flex items-center gap-1.5 bg-[var(--green-bg)] text-[var(--green)] text-xs font-bold px-3 py-1 rounded-full">
                      <Brain className="w-3 h-3" />
                      Thriving
                    </span>
                  </div>

                  {/* Trend */}
                  <div className="flex items-center gap-1.5 mb-5">
                    <TrendingUp className="w-3.5 h-3.5 text-[var(--green)]" />
                    <p className="text-xs text-[var(--green)] font-medium">Improving over the last 7 days</p>
                  </div>

                  {/* Metric bars */}
                  <div className="space-y-2.5">
                    {[
                      { label: "Mood",          value: 4, max: 5, invert: false },
                      { label: "Energy",         value: 4, max: 5, invert: false },
                      { label: "Socialization",  value: 5, max: 5, invert: false },
                      { label: "Calm",           value: 4, max: 5, invert: true,  note: "low anxiety" },
                    ].map(({ label, value, max, note }) => (
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
                  <p className="text-[11px] text-[var(--faint)] mt-4 text-center">Based on 28 check-ins · last 30 days</p>
                </div>
              </div>
            </div>

            {/* Copy */}
            <div className="order-1 lg:order-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 mb-3">Digital twin</p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] tracking-tight mb-6 leading-tight">
                See how your pet
                <br /><span className="text-violet-600">feels</span>, not just
                <br />how they measure
              </h2>
              <p className="text-lg text-[var(--muted)] leading-relaxed mb-5">
                Vitals tell you what. The Digital Twin tells you how. It combines mood, energy, anxiety, and socialization into a single living portrait — updated every time you log a check-in.
              </p>
              <p className="text-base text-[var(--muted)] leading-relaxed mb-8">
                Four emotional states — <strong className="text-[var(--ink2)] font-medium">Thriving</strong>, <strong className="text-[var(--ink2)] font-medium">Doing Well</strong>, <strong className="text-[var(--ink2)] font-medium">Needs Attention</strong>, or <strong className="text-[var(--ink2)] font-medium">Struggling</strong> — plus a trend indicator so you can see whether things are improving or declining before they become a problem.
              </p>
              <Link href="/register" className="btn-primary">
                See your pet&apos;s twin
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
                Intelligent scoring
              </p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] tracking-tight mb-6 leading-tight">
                Know your pet&apos;s
                <br />status at a glance
              </h2>
              <p className="text-lg text-[var(--muted)] leading-relaxed mb-8">
                Every day, Petvity compares your pet&apos;s metrics against
                species-specific normal ranges. Three states. No guesswork.
                One clear signal.
              </p>
              <Link href="/register" className="btn-primary">
                Try it free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {[
                {
                  signal: "Healthy",
                  desc: "All metrics in range. Vaccinations current. Keep doing what you're doing.",
                  badge: "bg-[var(--green-bg)] text-[var(--green)]",
                  border: "border-[#bbf7d0]",
                  icon: CheckCircle,
                },
                {
                  signal: "Watch",
                  desc: "One metric slightly outside normal range, or a booster coming due soon.",
                  badge: "bg-[var(--warn-bg)] text-[var(--warn)]",
                  border: "border-[#fde68a]",
                  icon: TrendingUp,
                },
                {
                  signal: "Needs attention",
                  desc: "Multiple out-of-range readings, or an overdue vaccination. Book a vet visit.",
                  badge: "bg-[var(--danger-bg)] text-[var(--danger)]",
                  border: "border-[#fca5a5]",
                  icon: Activity,
                },
              ].map(({ signal, desc, badge, border, icon: Icon }) => (
                <div key={signal} className={`card border-2 ${border} p-5 flex items-start gap-4`}>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 mt-0.5 ${badge} flex items-center gap-1`}>
                    <Icon className="w-3 h-3" />
                    {signal}
                  </span>
                  <p className="text-sm text-[var(--ink2)] leading-relaxed">{desc}</p>
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
              The full platform
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] tracking-tight mb-5">
              Everything pet care needs
            </h2>
            <p className="text-lg text-[var(--muted)] max-w-xl mx-auto leading-relaxed">
              Health tracking is just the start. Petvity is the only platform that covers the complete care journey — from daily check-ins to finding a vet to giving a pet a home.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Find a Pro */}
            <div className="card p-7 flex flex-col gap-5 hover:shadow-[var(--shadow-md)] transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-[var(--teal)]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--ink)] mb-2">Find a Vet or Sitter</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  Search verified veterinarians and pet sitters near you. Read reviews, check availability, and book directly — without leaving the app.
                </p>
              </div>
              <div className="space-y-2.5 mt-auto">
                {[
                  { icon: "🔍", text: "Search by specialty or location" },
                  { icon: "⭐", text: "Verified reviews from real bookings" },
                  { icon: "📅", text: "Book and manage appointments" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <span className="text-base w-5 flex-shrink-0">{icon}</span>
                    <span className="text-sm text-[var(--ink2)]">{text}</span>
                  </div>
                ))}
              </div>
              <Link href="/register" className="btn-outline text-sm justify-center mt-2">
                Find a pro <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Marketplace */}
            <div className="card p-7 flex flex-col gap-5 hover:shadow-[var(--shadow-md)] transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--ink)] mb-2">Pet Care Marketplace</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  Shop food, supplements, toys, and accessories — all in the same app you use to track health. No switching between sites.
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
              <Link href="/register" className="btn-outline text-sm justify-center mt-2">
                Browse shop <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Adoption */}
            <div className="card p-7 flex flex-col gap-5 hover:shadow-[var(--shadow-md)] transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center">
                <Heart className="w-6 h-6 text-pink-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--ink)] mb-2">Pet Adoption</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  List a pet for adoption or find your next companion. Full application workflow, cross-border listings, and direct messaging between owners.
                </p>
              </div>
              <div className="space-y-2.5 mt-auto">
                {[
                  { icon: "📋", text: "Structured adoption applications" },
                  { icon: "🌍", text: "Cross-border listings supported" },
                  { icon: "✅", text: "Owner-managed approvals" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <span className="text-base w-5 flex-shrink-0">{icon}</span>
                    <span className="text-sm text-[var(--ink2)]">{text}</span>
                  </div>
                ))}
              </div>
              <Link href="/register" className="btn-outline text-sm justify-center mt-2">
                Browse adoptions <ArrowRight className="w-3.5 h-3.5" />
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
              From pet owners
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] tracking-tight">
              They caught it early
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
              Simple by design
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] tracking-tight mb-5">
              Up and running in minutes
            </h2>
            <p className="text-lg text-[var(--muted)]">
              No training. No setup fee. Just sign up and start.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { n: "01", title: "Create your free account", desc: "Email and password. 30 seconds." },
              { n: "02", title: "Add your pet", desc: "Name, species, breed, birthdate, photo. Dogs, cats, horses, and more." },
              { n: "03", title: "Log your first check-in", desc: "Record vitals and mood. The wellness signal and Digital Twin update instantly." },
            ].map(({ n, title, desc }, i) => (
              <div key={n} className="text-center relative">
                {i < 2 && (
                  <div aria-hidden className="hidden md:block absolute top-7 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px bg-[var(--border)]" />
                )}
                <div className="w-14 h-14 rounded-2xl bg-[var(--teal)] text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-5 shadow-[0_4px_12px_rgb(13_110_120/0.25)]">
                  {n}
                </div>
                <h3 className="font-bold text-[var(--ink)] mb-2 text-base">{title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 md:py-32">
        <div className="section-inner text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal)] mb-3">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] tracking-tight mb-5">Free, forever</h2>
          <p className="text-lg text-[var(--muted)] max-w-lg mx-auto mb-12 leading-relaxed">
            Every feature — health tracking, digital twin, vet network, marketplace,
            and adoption listings — is included free with no pet limits.
          </p>

          <div className="card max-w-sm mx-auto p-8 text-left shadow-[var(--shadow-lg)]">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-5xl font-extrabold text-[var(--ink)] tracking-tight">$0</span>
              <span className="text-[var(--muted)] text-base">/ month</span>
            </div>
            <p className="text-sm text-[var(--muted)] mb-7">No credit card required</p>

            <ul className="space-y-3.5 mb-8">
              {[
                "Unlimited pets",
                "7 health metrics with digital twin",
                "Vaccination scheduler & reminders",
                "Full health records & medications",
                "Find & book vets and pet sitters",
                "Pet care marketplace",
                "Adoption listings & applications",
                "Public shareable pet profiles",
                "9 languages including Arabic",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-[var(--green)] flex-shrink-0" />
                  <span className="text-sm text-[var(--ink2)]">{item}</span>
                </li>
              ))}
            </ul>

            <Link href="/register" className="btn-primary w-full justify-center py-3 text-base">
              Create free account
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
            Start reading
            <br />your pet&apos;s signal
          </h2>
          <p className="text-lg text-[var(--teal-mid)] mb-10 max-w-xl mx-auto leading-relaxed">
            Free forever. No credit card. Add your first pet in under a minute —
            and see your Digital Twin on your first check-in.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-[var(--teal)] font-bold text-base px-8 py-4 rounded-xl hover:bg-[var(--teal-light)] transition-colors no-underline shadow-[0_4px_20px_rgb(0_0_0/0.15)]"
          >
            Get started free — it&apos;s $0
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
