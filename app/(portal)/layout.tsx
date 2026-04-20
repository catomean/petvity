import Link from "next/link";
import { auth } from "@/lib/auth";
import { APP } from "@/lib/config/app";
import { redirect } from "next/navigation";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-[var(--off)]">
      <nav className="bg-white border-b border-[var(--border)] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/portal/dashboard"
            className="font-bold text-[var(--teal)] text-lg no-underline"
          >
            {APP.name}
          </Link>
          <div className="hidden md:flex items-center gap-4 text-sm text-[var(--ink2)]">
            <Link
              href="/portal/dashboard"
              className="hover:text-[var(--teal)] no-underline"
            >
              Dashboard
            </Link>
            <Link
              href="/portal/pets"
              className="hover:text-[var(--teal)] no-underline"
            >
              My Pets
            </Link>
            <Link
              href="/portal/checkin"
              className="hover:text-[var(--teal)] no-underline"
            >
              Check-in
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-[var(--muted)]">{session.user.name}</span>
          <Link
            href="/portal/settings"
            className="text-[var(--muted)] hover:text-[var(--teal)] no-underline"
          >
            Settings
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-[var(--muted)] hover:text-[var(--danger)] text-sm cursor-pointer border-none bg-none"
            >
              Log out
            </button>
          </form>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
