import Link from "next/link";
import {
  Activity, Syringe, FileText, Pill,
  CalendarDays, CheckCircle, TrendingUp,
  ArrowRight, Globe, Zap,
} from "lucide-react";
import { SPECIES_CONFIG } from "@/lib/config/species";
import type { SpeciesId } from "@/lib/config/species";
import MarketingNav from "@/components/sections/MarketingNav";
import MarketingFooter from "@/components/sections/MarketingFooter";

/* ── Feature definitions ─────────────────────────────────────────────────── */
const CORE_FEATURES = [
  {
    icon: Activity,
    title: "Daily health tracking",
    desc: "Log weight, temperature, heart rate, and emotional metrics in under a minute. Spot trends before they become problems.",
    color: "text-[var(--teal)]",
    bg: "bg-[var(--teal-light)]",
  },
  {
    icon: Zap,
    title: "Wellness signals",
    desc: "Our algorithm scores your pet as Healthy, Watch, or Concern — automatically — based on species-specific normal ranges.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Syringe,
    title: "Vaccination scheduler",
    desc: "Never miss a booster. Track every immunisation, set due dates, and get reminders before they expire.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: FileText,
    title: "Medical records",
    desc: "Vet visits, surgeries, lab results, dental cleanings — a complete longitudinal history always at your fingertips.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Pill,
    title: "Medication log",
    desc: "Track prescriptions with dosage, frequency, and end date. Know exactly what your pet is taking and when.",
    color: "text-[var(--accent)]",
    bg: "bg-[var(--accent-light)]",
  },
  {
    icon: Globe,
    title: "Public pet profiles",
    desc: "Give your pet a shareable profile page. Photos, bio, species, breed — the influencer career starts here.",
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Create your free account",
    desc: "No credit card. Takes 30 seconds.",
  },
  {
    n: "02",
    title: "Add your pet",
    desc: "Name, species, breed, birthdate, and a photo. Supports 10 species.",
  },
  {
    n: "03",
    title: "Log your first check-in",
    desc: "Record vitals and mood. The wellness signal updates instantly.",
  },
];

const SPECIES_DISPLAY = Object.values(SPECIES_CONFIG).filter(
  (s) => s.id !== "other"
) as (typeof SPECIES_CONFIG)[SpeciesId][];

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-24 bg-gradient-to-b from-[var(--off)] to-white">
        {/* Background accent blobs */}
        <div
          aria-hidden
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[var(--teal-light)] opacity-40 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-16 -left-32 w-[400px] h-[400px] rounded-full bg-[var(--accent-light)] opacity-50 blur-3xl pointer-events-none"
        />

        <div className="section-inner relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[var(--teal-light)] text-[var(--teal)] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Zap className="w-3 h-3" />
              Wellness signals · 10 species · Free to start
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-[var(--ink)] leading-[1.1] tracking-tight mb-6">
              Your pet&apos;s health,{" "}
              <span className="text-[var(--teal)]">finally organised</span>
            </h1>

            <p className="text-xl text-[var(--muted)] leading-relaxed mb-10 max-w-2xl mx-auto">
              Track vitals, vaccinations, medications, and vet records in one
              place. Petvity tells you when something needs attention — before
              it&apos;s urgent.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="btn-primary text-base px-8 py-3.5 w-full sm:w-auto justify-center"
              >
                Get started free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="btn-outline text-base px-8 py-3.5 w-full sm:w-auto justify-center"
              >
                See how it works
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-[var(--muted)]">
              {[
                "No credit card required",
                "10 species supported",
                "Free forever plan",
              ].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-[var(--green)] flex-shrink-0" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* App preview card */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="card p-6 shadow-xl border-[var(--border)]">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[var(--border)]">
                <div className="w-10 h-10 rounded-xl bg-[var(--teal-light)] flex items-center justify-center text-xl">
                  🐕
                </div>
                <div>
                  <p className="font-semibold text-[var(--ink)]">Buddy</p>
                  <p className="text-xs text-[var(--muted)]">Golden Retriever · 3 years old</p>
                </div>
                <div className="ms-auto">
                  <span className="inline-flex items-center gap-1 bg-[var(--green-bg)] text-[var(--green)] text-xs font-semibold px-2.5 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Healthy
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Weight", value: "32.4 kg", trend: "↔ stable" },
                  { label: "Temp", value: "38.4°C", trend: "✓ normal" },
                  { label: "Energy", value: "4 / 5", trend: "↑ up" },
                  { label: "Mood", value: "5 / 5", trend: "✓ great" },
                ].map(({ label, value, trend }) => (
                  <div key={label} className="bg-[var(--off)] rounded-xl p-3 text-center">
                    <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
                    <p className="text-sm font-bold text-[var(--ink)]">{value}</p>
                    <p className="text-xs text-[var(--green)] mt-0.5">{trend}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[var(--off)] rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Syringe className="w-3.5 h-3.5 text-[var(--teal)]" />
                    <p className="text-xs font-medium text-[var(--ink)]">Next vaccination</p>
                  </div>
                  <p className="text-xs text-[var(--muted)]">Rabies booster · in 47 days</p>
                </div>
                <div className="flex-1 bg-[var(--off)] rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Pill className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <p className="text-xs font-medium text-[var(--ink)]">Active medication</p>
                  </div>
                  <p className="text-xs text-[var(--muted)]">Heartgard · monthly</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Species strip ─────────────────────────────────────────────────── */}
      <section className="border-y border-[var(--border)] bg-[var(--off)] py-8">
        <div className="section-inner">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-6">
            Every pet, one platform
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {SPECIES_DISPLAY.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 bg-white rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--ink2)] shadow-sm"
              >
                <span className="text-base">{s.emoji}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core features ─────────────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="section-inner">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal)] mb-3">
              Everything in one place
            </p>
            <h2 className="text-4xl font-bold text-[var(--ink)] mb-4">
              The complete pet health toolkit
            </h2>
            <p className="text-lg text-[var(--muted)] max-w-xl mx-auto">
              From daily check-ins to full medical histories — everything your vet
              wishes you tracked.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CORE_FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div
                key={title}
                className="card p-6 hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}
                >
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-semibold text-[var(--ink)] mb-2 text-base">
                  {title}
                </h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Wellness signals callout ──────────────────────────────────────── */}
      <section className="bg-[var(--off)] py-24 border-y border-[var(--border)]">
        <div className="section-inner">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal)] mb-3">
                Intelligent scoring
              </p>
              <h2 className="text-4xl font-bold text-[var(--ink)] mb-5 leading-tight">
                Know your pet&apos;s status
                <br />
                at a glance
              </h2>
              <p className="text-lg text-[var(--muted)] leading-relaxed mb-8">
                Petvity compares your pet&apos;s logged metrics against
                species-specific normal ranges and flags anything that needs
                attention — automatically, every day.
              </p>
              <Link href="/register" className="btn-primary">
                Try it free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {[
                {
                  signal: "Healthy",
                  desc: "All metrics in range. Vaccinations up to date. Keep it up.",
                  badgeClass: "bg-[var(--green-bg)] text-[var(--green)]",
                  borderClass: "border-[var(--green-bg)]",
                  icon: CheckCircle,
                  iconClass: "text-[var(--green)]",
                },
                {
                  signal: "Watch",
                  desc: "One metric slightly outside normal range, or a booster due soon.",
                  badgeClass: "bg-[var(--warn-bg)] text-[var(--warn)]",
                  borderClass: "border-[var(--warn-bg)]",
                  icon: TrendingUp,
                  iconClass: "text-[var(--warn)]",
                },
                {
                  signal: "Needs attention",
                  desc: "Multiple out-of-range readings or an overdue vaccination.",
                  badgeClass: "bg-[var(--danger-bg)] text-[var(--danger)]",
                  borderClass: "border-[var(--danger-bg)]",
                  icon: Activity,
                  iconClass: "text-[var(--danger)]",
                },
              ].map(({ signal, desc, badgeClass, borderClass, icon: Icon, iconClass }) => (
                <div
                  key={signal}
                  className={`card p-5 border-2 ${borderClass} flex items-start gap-4`}
                >
                  <div className={`w-9 h-9 rounded-xl ${badgeClass} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${iconClass}`} />
                  </div>
                  <div>
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1.5 ${badgeClass}`}>
                      {signal}
                    </span>
                    <p className="text-sm text-[var(--ink2)] leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24">
        <div className="section-inner">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal)] mb-3">
              Simple by design
            </p>
            <h2 className="text-4xl font-bold text-[var(--ink)] mb-4">
              Up and running in minutes
            </h2>
            <p className="text-lg text-[var(--muted)]">
              No training required. No setup fees. Just sign up and start.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {STEPS.map(({ n, title, desc }, i) => (
              <div key={n} className="text-center relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div
                    aria-hidden
                    className="hidden md:block absolute top-7 left-[calc(50%+36px)] right-[calc(-50%+36px)] h-px bg-[var(--border)]"
                  />
                )}
                <div className="w-14 h-14 rounded-2xl bg-[var(--teal)] text-white font-bold text-xl flex items-center justify-center mx-auto mb-5">
                  {n}
                </div>
                <h3 className="font-semibold text-[var(--ink)] mb-2">{title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing anchor ───────────────────────────────────────────────── */}
      <section id="pricing" className="bg-[var(--off)] border-y border-[var(--border)] py-24">
        <div className="section-inner text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal)] mb-3">
            Pricing
          </p>
          <h2 className="text-4xl font-bold text-[var(--ink)] mb-4">Free, forever</h2>
          <p className="text-lg text-[var(--muted)] max-w-xl mx-auto mb-10">
            All core features are free. No limits on pets or records.
            Premium features (vet network, marketplace) will be optional when they launch.
          </p>

          <div className="card max-w-sm mx-auto p-8 text-center shadow-lg">
            <p className="text-4xl font-bold text-[var(--ink)] mb-1">
              $0
              <span className="text-base font-medium text-[var(--muted)]"> / month</span>
            </p>
            <p className="text-sm text-[var(--muted)] mb-6">No credit card required</p>
            <ul className="text-sm text-[var(--ink2)] space-y-3 text-start mb-8">
              {[
                "Unlimited pets",
                "Health tracking & charts",
                "Vaccination scheduler",
                "Health records & medications",
                "Public pet profiles",
                "9 languages",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-[var(--green)] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/register" className="btn-primary w-full justify-center py-3">
              Create free account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="bg-[var(--teal)] py-24">
        <div className="section-inner text-center">
          <CalendarDays className="w-10 h-10 text-[var(--teal-light)] mx-auto mb-5" />
          <h2 className="text-4xl font-bold text-white mb-4">
            Your pet deserves the best care
          </h2>
          <p className="text-lg text-[var(--teal-mid)] mb-10 max-w-xl mx-auto">
            Join pet owners who are already tracking their pets&apos; health on
            Petvity. It&apos;s free, it&apos;s simple, and it could save your pet&apos;s life.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-[var(--teal)] font-semibold text-base px-8 py-3.5 rounded-xl hover:bg-[var(--teal-light)] transition-colors no-underline"
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
