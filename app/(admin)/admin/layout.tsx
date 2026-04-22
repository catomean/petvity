import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PawPrint, Users, LogOut, Package } from "lucide-react";
import { APP } from "@/lib/config/app";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/portal/dashboard");

  return (
    <div className="min-h-screen bg-[var(--off)] flex">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 bg-[var(--ink)] flex flex-col fixed inset-y-0 start-0">
        <div className="h-14 flex items-center px-4 border-b border-white/10">
          <Link href="/admin/users" className="flex items-center gap-2 no-underline">
            <div className="w-7 h-7 rounded-lg bg-[var(--teal)] flex items-center justify-center">
              <PawPrint className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">{APP.name}</span>
          </Link>
          <span className="ms-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
            Admin
          </span>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5">
          <Link
            href="/admin/users"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors no-underline"
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            Users
          </Link>
          <Link
            href="/admin/products"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors no-underline"
          >
            <Package className="w-4 h-4 flex-shrink-0" />
            Products
          </Link>
        </nav>

        <div className="px-2 pb-4 border-t border-white/10 pt-4">
          <div className="px-3 mb-3">
            <p className="text-xs font-medium text-white/80 truncate">{session.user.name ?? session.user.email}</p>
            <p className="text-[11px] text-white/40 truncate">{session.user.email}</p>
          </div>
          <Link
            href="/portal/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors no-underline"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Back to portal
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ms-52 min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
