import Link from "next/link";
import { PawPrint, Activity, Heart, Syringe, BarChart3, Globe } from "lucide-react";
import { APP } from "@/lib/config/app";

const BRAND_FEATURES = [
  { icon: Activity,  text: "Health & vitals tracking" },
  { icon: Heart,     text: "Emotional wellbeing scores" },
  { icon: Syringe,   text: "Vaccination reminders" },
  { icon: BarChart3, text: "Wellness trends over time" },
  { icon: Globe,     text: "9 languages, global community" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* ── Brand panel ── */}
      <div className="hidden lg:flex w-[460px] flex-shrink-0 flex-col section-warm-dark p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div aria-hidden className="absolute -top-20 -end-20 w-80 h-80 rounded-full bg-[var(--gold)]/[0.08] pointer-events-none" />
        <div aria-hidden className="absolute bottom-12 -start-16 w-64 h-64 rounded-full bg-[var(--gold)]/[0.06] pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <Link
            href="/en"
            className="font-bold text-[var(--cream)] no-underline flex items-center gap-2.5"
          >
            <div className="w-9 h-9 rounded-xl bg-[var(--gold)] flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-[var(--warm-dark)]" />
            </div>
            <span className="text-lg">{APP.name}</span>
          </Link>

          {/* Hero copy */}
          <div className="mt-auto mb-8">
            <p className="text-[var(--gold)] text-xs font-medium uppercase tracking-[0.2em] mb-4">
              Pet wellness platform
            </p>
            <h2 className="font-display font-light text-[2.6rem] text-[var(--cream)] leading-[1.08] tracking-tight mb-4">
              Your pet&apos;s health,
              <br />understood.
            </h2>
            <p className="text-[var(--cream-soft)] opacity-80 text-base leading-relaxed">
              Track wellness. Get insights. Build a deeper
              bond through care and data.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-2.5 mb-8">
            {BRAND_FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--gold)]/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[var(--gold)]" />
                </div>
                <span className="text-[var(--cream-soft)] opacity-90 text-sm">{text}</span>
              </li>
            ))}
          </ul>

          {/* Trust */}
          <div className="pt-5 border-t border-[var(--cream)]/15">
            <p className="text-[var(--cream-soft)] opacity-60 text-xs tracking-wide">
              Multi-species · 9 languages · GDPR compliant
            </p>
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[var(--cream)] min-h-screen">
        {/* Mobile logo */}
        <Link
          href="/en"
          className="lg:hidden font-bold text-[var(--warm-ink)] no-underline flex items-center gap-2 mb-8"
        >
          <div className="w-8 h-8 rounded-xl bg-[var(--warm-dark)] flex items-center justify-center">
            <PawPrint className="w-4 h-4 text-[var(--gold)]" />
          </div>
          <span className="text-lg">{APP.name}</span>
        </Link>

        <div className="w-full max-w-[380px]">
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-[var(--shadow-md)] p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
