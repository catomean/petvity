import Link from "next/link";
import {
  PawPrint, Heart, Globe, Shield, Zap, ArrowRight,
} from "lucide-react";
import { APP } from "@/lib/config/app";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `About · ${APP.name}`,
  description: `${APP.name} is the global platform for pet care — helping owners track wellness, connect with vets, and give their pets the life they deserve.`,
};

const VALUES = [
  {
    icon: Heart,
    color: "bg-[var(--accent-light)] text-[var(--accent)]",
    title: "Pets deserve better data",
    desc: "Vets can only see what happens in the clinic. What happens at home — the subtle changes in energy, the skipped meal, the restless night — is invisible to everyone. Petvity makes that data visible and actionable.",
  },
  {
    icon: Globe,
    color: "bg-[var(--teal-light)] text-[var(--teal)]",
    title: "Built for a global community",
    desc: "Pets don't respect borders. Neither does our platform. Petvity supports 9 languages — including full right-to-left Arabic — because a pet owner in Tokyo or Istanbul deserves the same tools as one in San Francisco.",
  },
  {
    icon: Shield,
    color: "bg-blue-50 text-blue-600",
    title: "Your data stays yours",
    desc: "We don't sell your data, share it with advertisers, or use it to train AI models without consent. Owner-scoped queries mean you can only ever see your own pets.",
  },
  {
    icon: Zap,
    color: "bg-amber-50 text-amber-600",
    title: "Data without action is noise",
    desc: "Knowing your pet's signal is valuable. But the platform doesn't stop there — it connects you directly to vets who can act on it, products your pet needs, and a network that can find every animal a home.",
  },
];

const STATS = [
  { value: "10", label: "Species supported" },
  { value: "7", label: "Health metrics tracked" },
  { value: "9", label: "Languages available" },
  { value: "Free", label: "For individual owners — forever" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-[var(--off)] via-white to-[#f0fafb] pointer-events-none"
        />
        <div aria-hidden className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[var(--teal-light)] opacity-30 blur-[120px] pointer-events-none -translate-y-1/3 translate-x-1/3" />

        <div className="section-inner relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[var(--teal-light)] text-[var(--teal)] text-xs font-semibold px-3 py-1.5 rounded-full mb-7 border border-[var(--teal-mid)]">
              <PawPrint className="w-3 h-3" />
              Our story
            </div>
            <h1 className="text-[2.8rem] md:text-[3.6rem] font-extrabold text-[var(--ink)] leading-[1.05] tracking-tight mb-6">
              We built the platform<br />
              <span className="text-[var(--teal)]">pet care was missing</span>
            </h1>
            <p className="text-lg md:text-xl text-[var(--muted)] leading-relaxed mb-4">
              {APP.name} was born from a frustrating pattern: noticing something was off
              with a pet, not being able to articulate exactly what, and arriving at the
              vet with a vague &quot;he just seems a bit off.&quot; We wanted data. So we built it.
            </p>
            <p className="text-lg text-[var(--muted)] leading-relaxed">
              Then we kept going — because good data is only half the job. You also need
              a vet who can interpret it, products your pet actually needs, and a network
              that can find every animal a home. That&apos;s Petvity.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-[var(--off)]">
        <div className="section-inner">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-4">Our mission</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--ink)] tracking-tight mb-6">
                Turn a pet owner&apos;s instinct into a signal a vet can act on
              </h2>
              <p className="text-[var(--muted)] leading-relaxed mb-4">
                Every pet owner has an intuition about their animal. Something&apos;s different.
                Quieter than usual. Eating a bit less. Sleeping more. These signals matter —
                but without data, they&apos;re impossible to communicate with precision, and
                easy to dismiss.
              </p>
              <p className="text-[var(--muted)] leading-relaxed mb-4">
                Petvity turns those observations into a structured health record and a living
                Digital Twin. When you arrive at the vet saying &quot;her energy score dropped from
                4 to 2 over the last eight days and her Digital Twin shifted from Thriving to
                Needs Attention,&quot; that&apos;s a workable clinical picture — not a vague feeling.
              </p>
              <p className="text-[var(--muted)] leading-relaxed">
                But data alone isn&apos;t enough. We also connect owners to the vets and sitters
                who can respond, the products their pets need, and a global adoption network
                — because the full care journey happens on one platform, not five.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {STATS.map(({ value, label }) => (
                <div key={label} className="card p-7 text-center">
                  <p className="text-4xl font-extrabold text-[var(--teal)] mb-2">{value}</p>
                  <p className="text-sm text-[var(--muted)]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="section-inner">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-4">What we stand for</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--ink)] tracking-tight">
              How we think about building this
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {VALUES.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="card p-7 flex gap-5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--ink)] mb-2">{title}</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Part of the ecosystem */}
      <section className="py-16 bg-[var(--off)] border-y border-[var(--border)]">
        <div className="section-inner max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-4">
            The long view
          </p>
          <h2 className="text-2xl font-extrabold text-[var(--ink)] mb-4">
            A platform, not a feature
          </h2>
          <p className="text-[var(--muted)] leading-relaxed text-sm mb-4">
            Most pet apps do one thing. Petvity connects the whole picture: daily health
            data feeds a Digital Twin, the twin surfaces a wellness signal, the signal
            tells you whether to book a vet — and the vet is two taps away. That closed
            loop is what makes it useful every day, not just when something goes wrong.
          </p>
          <p className="text-[var(--muted)] leading-relaxed text-sm">
            We also build{" "}
            <span className="font-medium text-[var(--ink2)]">VitaReBa</span>
            {" "}— a clinic management portal for rehabilitation therapists — and are
            exploring how shared health data infrastructure can power better care decisions
            across the human–animal spectrum. Long-term: IoT sensors and cameras feeding
            real-time physiological data directly into each pet&apos;s Digital Twin.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[var(--teal)]">
        <div className="section-inner text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
            Join us in taking pet care seriously
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
            Free for individual pet owners, forever. No credit card required.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-[var(--teal)] font-bold px-8 py-4 rounded-xl text-base hover:bg-[var(--teal-light)] transition-colors">
            Create your free account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
