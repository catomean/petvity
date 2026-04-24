import Link from "next/link";
import {
  Stethoscope, Heart, CheckCircle, ArrowRight, Star,
  CalendarDays, Shield, TrendingUp, Users, Brain, Zap,
} from "lucide-react";
import type { Metadata } from "next";
import { APP } from "@/lib/config/app";

export const metadata: Metadata = {
  title: `For Professionals · ${APP.name}`,
  description: "Join Petvity as a veterinarian or pet sitter. Get discovered by owners who track their pet's health data — and bring that data to every appointment.",
};

const VET_BENEFITS = [
  {
    icon: Brain,
    title: "Clients arrive prepared",
    desc: "Pet owners using Petvity log daily vitals, mood, and energy scores. When they book you, they bring months of structured health history — not vague descriptions.",
  },
  {
    icon: TrendingUp,
    title: "Trend data at every appointment",
    desc: "See how weight, temperature, and emotional state have changed over weeks. Spot patterns that would take hours of questioning to reconstruct from memory.",
  },
  {
    icon: Shield,
    title: "Admin-verified badge",
    desc: "Once verified, your profile shows a trusted badge. Pet owners can book confidently knowing you've been reviewed by the Petvity team.",
  },
  {
    icon: Star,
    title: "Reviews from real bookings only",
    desc: "Reviews are locked to completed bookings — no anonymous reviews, no fake ratings. Your reputation reflects real client experiences.",
  },
  {
    icon: CalendarDays,
    title: "Booking management built in",
    desc: "Set up your profile in minutes. Clients book directly, you confirm, mark complete, and collect reviews — all without a separate scheduling app.",
  },
  {
    icon: Users,
    title: "Growing owner community",
    desc: "Petvity owners are health-aware by definition. They've already committed to tracking their pet's wellbeing — the most engaged clientele you can find.",
  },
];

const SITTER_BENEFITS = [
  {
    icon: Heart,
    title: "Know the pet before you meet",
    desc: "Owners share their pet's Digital Twin — emotional state, anxiety levels, socialization history. You arrive knowing whether the dog is anxious or easygoing.",
  },
  {
    icon: TrendingUp,
    title: "Log health during stays",
    desc: "Record weight and mood during boarding. Owners get peace of mind; you get a documented, professional record of every stay.",
  },
  {
    icon: Shield,
    title: "Verified sitter profile",
    desc: "Once your profile is verified, pet owners see a trust badge. Set your daily rate, describe your services, and list what you specialise in.",
  },
  {
    icon: Star,
    title: "Real reviews, real trust",
    desc: "Every review is tied to a real booking. Build a reputation that accurately reflects your care — and grow from it.",
  },
  {
    icon: CalendarDays,
    title: "Simple booking flow",
    desc: "Clients request dates, you confirm. Clear start/end dates, optional notes, and status tracking — manage everything from your Petvity dashboard.",
  },
  {
    icon: Zap,
    title: "Zero setup cost",
    desc: "Creating a professional profile is free. No monthly subscription, no listing fee. You pay nothing until the platform evolves to paid tiers.",
  },
];

const HOW_IT_WORKS_VET = [
  { n: "01", title: "Create your free account", desc: "Sign up and select 'Veterinarian' as your role. Takes 30 seconds." },
  { n: "02", title: "Build your professional profile", desc: "Add your specialty, clinic details, city, and a short bio. Set whether you're accepting clients." },
  { n: "03", title: "Get discovered and verified", desc: "Pet owners in your area can find and book you. Our team verifies credentials to unlock your trust badge." },
];

const HOW_IT_WORKS_SITTER = [
  { n: "01", title: "Create your free account", desc: "Sign up and select 'Pet Sitter' as your role. Takes 30 seconds." },
  { n: "02", title: "Set up your sitter profile", desc: "Describe your services (boarding, day care, walks), set your daily rate, and list your location." },
  { n: "03", title: "Start accepting bookings", desc: "Owners find you, request dates, and you confirm. Reviews build your reputation automatically." },
];

export default function ProsPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-[var(--off)] via-white to-[#f0fafb] pointer-events-none"
        />
        <div aria-hidden className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[var(--teal-light)] opacity-30 blur-[120px] pointer-events-none -translate-y-1/3 translate-x-1/3" />

        <div className="section-inner relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[var(--teal-light)] text-[var(--teal)] text-xs font-semibold px-3 py-1.5 rounded-full mb-7 border border-[var(--teal-mid)]">
              <Stethoscope className="w-3 h-3" />
              For vets &amp; pet sitters · Free to join
            </div>

            <h1 className="text-[2.8rem] md:text-[3.6rem] font-extrabold text-[var(--ink)] leading-[1.05] tracking-tight mb-6">
              Your clients are already
              <br />
              <span className="text-[var(--teal)]">tracking their pets.</span>
              <br />
              Meet them here.
            </h1>

            <p className="text-lg md:text-xl text-[var(--muted)] leading-relaxed mb-9 max-w-2xl">
              Petvity owners log daily vitals, emotional state, and health records.
              When they book you, they arrive with structured data — not vague feelings.
              Build your profile, get verified, and let the data work for you.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link href="/register?role=vet" className="btn-primary text-base px-7 py-3.5 justify-center">
                <Stethoscope className="w-4 h-4" />
                Join as a veterinarian
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/register?role=sitter" className="btn-outline text-base px-7 py-3.5 justify-center">
                <Heart className="w-4 h-4" />
                Join as a pet sitter
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {["Free to create a profile", "No monthly fee", "Verified badge included"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)]">
                  <CheckCircle className="w-3.5 h-3.5 text-[var(--green-text)] flex-shrink-0" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vet benefits */}
      <section id="veterinarians" className="py-24 md:py-32 bg-[var(--off)]">
        <div className="section-inner">
          <div className="text-center mb-16">
            <div className="w-14 h-14 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-5">
              <Stethoscope className="w-7 h-7 text-[var(--teal)]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal)] mb-3">
              For veterinarians
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] tracking-tight mb-5">
              Better appointments start<br />with better data
            </h2>
            <p className="text-lg text-[var(--muted)] max-w-xl mx-auto leading-relaxed">
              When clients track daily health data, your diagnostic work changes fundamentally.
              You spend less time reconstructing history and more time acting on it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {VET_BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-7">
                <div className="w-10 h-10 rounded-xl bg-[var(--teal-light)] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[var(--teal)]" />
                </div>
                <h3 className="font-bold text-[var(--ink)] mb-2">{title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div className="bg-white rounded-2xl border border-[var(--border)] p-8">
            <h3 className="text-xl font-bold text-[var(--ink)] mb-8 text-center">
              From sign-up to your first booking
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {HOW_IT_WORKS_VET.map(({ n, title, desc }, i) => (
                <div key={n} className="text-center relative">
                  {i < 2 && (
                    <div aria-hidden className="hidden md:block absolute top-7 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px bg-[var(--border)]" />
                  )}
                  <div className="w-14 h-14 rounded-2xl bg-[var(--teal)] text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-4 shadow-[0_4px_12px_rgb(13_110_120/0.25)]">
                    {n}
                  </div>
                  <h4 className="font-bold text-[var(--ink)] mb-2 text-sm">{title}</h4>
                  <p className="text-sm text-[var(--muted)]">{desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/register?role=vet" className="btn-primary">
                Create your vet profile
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sitter benefits */}
      <section id="sitters" className="py-24 md:py-32 bg-white">
        <div className="section-inner">
          <div className="text-center mb-16">
            <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto mb-5">
              <Heart className="w-7 h-7 text-pink-500" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-pink-500 mb-3">
              For pet sitters
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] tracking-tight mb-5">
              Know the pet before<br />you meet them
            </h2>
            <p className="text-lg text-[var(--muted)] max-w-xl mx-auto leading-relaxed">
              Petvity owners share their pet&apos;s Digital Twin — emotional state, anxiety levels,
              socialization history. You start every stay with context that takes weeks to build in person.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {SITTER_BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-7">
                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-pink-500" />
                </div>
                <h3 className="font-bold text-[var(--ink)] mb-2">{title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div className="bg-[var(--off)] rounded-2xl p-8">
            <h3 className="text-xl font-bold text-[var(--ink)] mb-8 text-center">
              From sign-up to your first booking
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {HOW_IT_WORKS_SITTER.map(({ n, title, desc }, i) => (
                <div key={n} className="text-center relative">
                  {i < 2 && (
                    <div aria-hidden className="hidden md:block absolute top-7 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px bg-[var(--border)]" />
                  )}
                  <div className="w-14 h-14 rounded-2xl bg-pink-500 text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-4 shadow-[0_4px_12px_rgb(236_72_153/0.25)]">
                    {n}
                  </div>
                  <h4 className="font-bold text-[var(--ink)] mb-2 text-sm">{title}</h4>
                  <p className="text-sm text-[var(--muted)]">{desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/register?role=sitter" className="btn-primary" style={{ background: "var(--accent)" }}>
                Create your sitter profile
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What owners see */}
      <section className="py-24 md:py-32 bg-[var(--off)] border-y border-[var(--border)]">
        <div className="section-inner">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal)] mb-3">
                What you&apos;re getting
              </p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] tracking-tight mb-6 leading-tight">
                Clients with data.<br />Not just symptoms.
              </h2>
              <p className="text-lg text-[var(--muted)] leading-relaxed mb-5">
                Most owners arrive with &ldquo;she just seems off.&rdquo; Petvity owners arrive with{" "}
                <strong className="text-[var(--ink2)] font-medium">
                  &ldquo;her energy dropped from 4 to 2 over 8 days and her Digital Twin shifted
                  from Thriving to Needs Attention.&rdquo;
                </strong>
              </p>
              <p className="text-base text-[var(--muted)] leading-relaxed mb-8">
                That&apos;s not just a better client experience. It&apos;s a fundamentally different
                — and more efficient — clinical conversation.
              </p>
              <div className="space-y-3">
                {[
                  "Daily weight, temperature, and heart rate logs",
                  "7-day wellness signal (Healthy / Watch / Concern)",
                  "30-day Digital Twin trend (Thriving → Struggling)",
                  "Full vaccination and medication history",
                  "Vet visit records and lab results",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[var(--green-text)] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[var(--ink2)]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock client card */}
            <div className="card shadow-[var(--shadow-lg)] rounded-2xl overflow-hidden max-w-sm mx-auto">
              <div className="bg-[var(--teal)] px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">🐕</div>
                <div>
                  <p className="font-bold text-white text-sm">Luna</p>
                  <p className="text-white/60 text-xs">Border Collie · 4 yr · Owner: Sarah M.</p>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {/* Signal */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Signal</span>
                  <span className="bg-[var(--warn-bg)] text-[var(--warn-text)] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Watch
                  </span>
                </div>
                {/* Twin */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Digital Twin</span>
                    <span className="text-xs text-[var(--warn-text)] font-medium">Needs Attention · declining</span>
                  </div>
                  <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--warn)] rounded-full" style={{ width: "38%" }} />
                  </div>
                </div>
                {/* 8-day trend */}
                <div className="bg-[var(--off)] rounded-xl p-3">
                  <p className="text-xs font-semibold text-[var(--ink2)] mb-2">Energy — last 8 days</p>
                  <div className="flex items-end gap-1 h-10">
                    {[4, 4, 3, 4, 3, 2, 2, 2].map((v, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-sm ${v <= 2 ? "bg-[var(--warn)]" : "bg-[var(--teal-light)]"}`}
                        style={{ height: `${(v / 5) * 100}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-[var(--muted)]">8d ago</span>
                    <span className="text-[10px] text-[var(--muted)]">today</span>
                  </div>
                </div>
                {/* Vaccinations */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--muted)]">Rabies booster</span>
                  <span className="text-[var(--warn-text)] font-medium">Overdue 12 days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-[var(--teal)] py-24 md:py-32">
        <div aria-hidden className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="section-inner relative text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
            Join the professionals<br />already on Petvity
          </h2>
          <p className="text-lg text-[var(--teal-mid)] mb-10 max-w-xl mx-auto leading-relaxed">
            Free to join. No monthly subscription. Build your reputation with real reviews
            from clients who already care about their pets&apos; health.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register?role=vet"
              className="inline-flex items-center gap-2 bg-white text-[var(--teal)] font-bold text-base px-8 py-4 rounded-xl hover:bg-[var(--teal-light)] transition-colors no-underline shadow-[0_4px_20px_rgb(0_0_0/0.15)]"
            >
              <Stethoscope className="w-4 h-4" />
              Join as a veterinarian
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register?role=sitter"
              className="inline-flex items-center gap-2 bg-white/10 text-white font-bold text-base px-8 py-4 rounded-xl hover:bg-white/20 transition-colors no-underline border border-white/20"
            >
              <Heart className="w-4 h-4" />
              Join as a pet sitter
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
