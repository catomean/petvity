import Link from "next/link";
import { PawPrint, Home, Search } from "lucide-react";
import { APP } from "@/lib/config/app";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--off)] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mb-6">
        <PawPrint className="w-8 h-8 text-[var(--teal)]" />
      </div>

      <h1 className="text-6xl font-extrabold text-[var(--teal)] mb-2">404</h1>
      <h2 className="text-xl font-semibold text-[var(--ink)] mb-3">
        This page has gone for a walk
      </h2>
      <p className="text-[var(--muted)] max-w-sm mb-8">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        Let&apos;s get you back on track.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link href="/portal/dashboard" className="btn-primary flex items-center gap-2">
          <Home className="w-4 h-4" />
          Go to dashboard
        </Link>
        <Link href="/portal/adopt" className="btn-outline flex items-center gap-2">
          <Search className="w-4 h-4" />
          Browse adoptions
        </Link>
      </div>

      <p className="mt-12 text-xs text-[var(--faint)]">{APP.name}</p>
    </div>
  );
}
