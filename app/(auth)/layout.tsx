import Link from "next/link";
import { APP } from "@/lib/config/app";

const BRAND_EMOJIS = ["🐕", "🐈", "🐴", "🦜", "🐰", "🐹", "🦎", "🐠", "🐇", "🦔"];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Brand panel — hidden on mobile */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 flex-col bg-[var(--teal)] p-10 text-white relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white" />
          <div className="absolute bottom-12 -left-16 w-48 h-48 rounded-full bg-white" />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <Link
            href="/en"
            className="text-2xl font-bold text-white no-underline flex items-center gap-2"
          >
            <span>🐾</span> {APP.name}
          </Link>

          {/* Main copy */}
          <div className="mt-auto mb-10">
            <h2 className="text-3xl font-bold leading-snug mb-4">
              Your pet&apos;s digital twin
            </h2>
            <p className="text-white/75 text-base leading-relaxed">
              Track health, emotions, and wellbeing for every pet in your
              family. Build a deeper bond through care and understanding.
            </p>
          </div>

          {/* Pet emoji grid */}
          <div className="grid grid-cols-5 gap-2">
            {BRAND_EMOJIS.map((emoji) => (
              <div
                key={emoji}
                className="aspect-square bg-white/15 rounded-2xl flex items-center justify-center text-2xl"
              >
                {emoji}
              </div>
            ))}
          </div>

          {/* Trust line */}
          <p className="mt-6 text-white/50 text-xs">
            Multi-species · 9 languages · GDPR compliant
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[var(--off)] min-h-screen">
        {/* Mobile logo */}
        <Link
          href="/en"
          className="lg:hidden text-2xl font-bold text-[var(--teal)] no-underline flex items-center gap-2 mb-8"
        >
          <span>🐾</span> {APP.name}
        </Link>

        <div className="w-full max-w-sm bg-white rounded-2xl border border-[var(--border)] shadow-sm p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
