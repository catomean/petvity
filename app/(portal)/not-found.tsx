import Link from "next/link";
import { PawPrint, Home } from "lucide-react";

export default function PortalNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mb-5">
        <PawPrint className="w-7 h-7 text-[var(--teal)]" />
      </div>

      <h1 className="text-4xl font-extrabold text-[var(--teal)] mb-2">404</h1>
      <p className="text-lg font-semibold text-[var(--ink)] mb-2">
        This page has gone for a walk
      </p>
      <p className="text-sm text-[var(--muted)] max-w-xs mb-7">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>

      <Link href="/portal/dashboard" className="btn-primary flex items-center gap-2">
        <Home className="w-4 h-4" />
        Back to dashboard
      </Link>
    </div>
  );
}
