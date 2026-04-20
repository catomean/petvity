import Link from "next/link";
import { APP } from "@/lib/config/app";

const BRAND_FEATURES = [
  { emoji: "🏥", text: "Health & vitals tracking" },
  { emoji: "❤️", text: "Emotional wellbeing scores" },
  { emoji: "💉", text: "Vaccination reminders" },
  { emoji: "📊", text: "Wellness trends over time" },
  { emoji: "🌍", text: "9 languages, global community" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* ── Brand panel ── */}
      <div className="hidden lg:flex w-[440px] flex-shrink-0 flex-col bg-[var(--teal)] p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -end-20 w-72 h-72 rounded-full bg-white/8 pointer-events-none" />
        <div className="absolute bottom-16 -start-12 w-52 h-52 rounded-full bg-white/6 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <Link
            href="/en"
            className="text-xl font-bold text-white no-underline flex items-center gap-2.5"
          >
            <span className="text-2xl">🐾</span>
            <span>{APP.name}</span>
          </Link>

          {/* Hero copy */}
          <div className="mt-auto mb-8">
            <p className="text-white/60 text-sm font-medium uppercase tracking-wider mb-3">
              Pet wellness platform
            </p>
            <h2 className="text-[2rem] font-bold text-white leading-tight mb-4">
              Your pet&apos;s health,<br />understood.
            </h2>
            <p className="text-white/70 text-base leading-relaxed">
              Track wellness. Get insights. Build a deeper bond through care and data.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3 mb-8">
            {BRAND_FEATURES.map(({ emoji, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center text-base flex-shrink-0">
                  {emoji}
                </span>
                <span className="text-white/80 text-sm">{text}</span>
              </li>
            ))}
          </ul>

          {/* Trust */}
          <div className="pt-6 border-t border-white/15">
            <p className="text-white/40 text-xs">
              Multi-species · 9 languages · GDPR compliant
            </p>
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[var(--off)] min-h-screen">
        {/* Mobile logo */}
        <Link
          href="/en"
          className="lg:hidden text-xl font-bold text-[var(--teal)] no-underline flex items-center gap-2 mb-8"
        >
          <span className="text-2xl">🐾</span> {APP.name}
        </Link>

        <div className="w-full max-w-[360px]">
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
