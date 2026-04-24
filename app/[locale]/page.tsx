import Link from "next/link";
import {
  Activity, Syringe, Pill,
  CalendarDays, CheckCircle, TrendingUp,
  ArrowRight, Zap, Star,
} from "lucide-react";
import { SPECIES_CONFIG } from "@/lib/config/species";
import type { SpeciesId } from "@/lib/config/species";
import MarketingNav from "@/components/sections/MarketingNav";
import MarketingFooter from "@/components/sections/MarketingFooter";

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
                Dogs, cats, horses & more · 7 health metrics · Free to start
              </div>

              <h1 className="text-[2.8rem] md:text-[3.6rem] font-extrabold text-[var(--ink)] leading-[1.05] tracking-tight mb-6">
                Your pet&apos;s health,
                <br />
                <span className="text-[var(--teal)]">understood</span>
              </h1>

              <p className="text-lg md:text-xl text-[var(--muted)] leading-relaxed mb-9 max-w-lg">
                Track vitals, vaccinations, and vet records in one place.
                Petvity tells you when something needs attention —
                <strong className="text-[var(--ink2)] font-medium"> before it&apos;s urgent.</strong>
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
              { n: "03", title: "Log your first check-in", desc: "Record vitals and mood. The wellness signal updates instantly." },
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
            Your pet deserves
            <br />the best care
          </h2>
          <p className="text-lg text-[var(--teal-mid)] mb-10 max-w-xl mx-auto leading-relaxed">
            Start tracking today. It&apos;s free, it takes minutes, and
            it could make all the difference.
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
