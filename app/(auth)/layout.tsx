import Link from "next/link";
import { APP } from "@/lib/config/app";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--off)] flex flex-col items-center justify-center px-4">
      <div className="mb-8">
        <Link
          href="/en"
          className="text-2xl font-bold text-[var(--teal)] no-underline"
        >
          {APP.name}
        </Link>
      </div>
      <div className="w-full max-w-sm bg-white rounded-xl border border-[var(--border)] shadow-sm p-8">
        {children}
      </div>
    </div>
  );
}
