import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInstance } from "@/lib/db";
import { users, pets, orders, adoptionListings } from "@/lib/db/schema";
import { count, eq, ne, sum } from "drizzle-orm";
import Link from "next/link";
import { Users, PawPrint, ShoppingBag, Heart, Package, TrendingUp } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";

export default async function AdminOverviewPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/portal/dashboard");

  const db = getInstance();

  const [
    [{ totalUsers }],
    [{ totalPets }],
    [{ pendingOrders }],
    [{ totalOrders }],
    [{ revenue }],
    [{ activeListings }],
  ] = await Promise.all([
    db.select({ totalUsers: count() }).from(users),
    db.select({ totalPets: count() }).from(pets),
    db.select({ pendingOrders: count() }).from(orders).where(eq(orders.status, "pending")),
    db.select({ totalOrders: count() }).from(orders).where(ne(orders.status, "cancelled")),
    db.select({ revenue: sum(orders.totalCents) }).from(orders).where(ne(orders.status, "cancelled")),
    db.select({ activeListings: count() }).from(adoptionListings).where(eq(adoptionListings.status, "available")),
  ]);

  const revenueFormatted = formatPrice(revenue ? Number(revenue) : 0);

  const stats = [
    { label: "Total users",        value: totalUsers,        icon: Users,       href: "/admin/users",     color: "text-[var(--teal)]",    bg: "bg-[var(--teal-light)]" },
    { label: "Total pets",         value: totalPets,         icon: PawPrint,    href: "/admin/users",     color: "text-[var(--teal)]",    bg: "bg-[var(--teal-light)]" },
    { label: "Active adoptions",   value: activeListings,    icon: Heart,       href: "/admin/adoptions", color: "text-[var(--accent)]",  bg: "bg-[var(--accent-light)]" },
    { label: "Pending orders",     value: pendingOrders,     icon: ShoppingBag, href: "/admin/orders",    color: "text-[var(--warn-text)]",    bg: "bg-[var(--warn-bg)]", urgent: pendingOrders > 0 },
    { label: "Total orders",       value: totalOrders,       icon: Package,     href: "/admin/orders",    color: "text-[var(--ink2)]",    bg: "bg-[var(--off)]" },
    { label: "Revenue",            value: revenueFormatted,  icon: TrendingUp,  href: "/admin/orders",    color: "text-[var(--green-text)]",   bg: "bg-[var(--green-bg)]" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--ink)]">Overview</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">Platform at a glance</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, href, color, bg, urgent }) => (
          <Link
            key={label}
            href={href}
            className={`card p-5 no-underline hover:shadow-md transition-all group ${urgent ? "border-[var(--warn)]" : ""}`}
          >
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-[var(--muted)] mt-0.5 group-hover:text-[var(--ink2)] transition-colors">{label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-semibold text-[var(--ink)] mb-4">Quick links</h2>
          <div className="space-y-2">
            {[
              { href: "/admin/users",     label: "Manage users & roles" },
              { href: "/admin/products",  label: "Manage products & stock" },
              { href: "/admin/orders",    label: "Fulfil orders" },
              { href: "/admin/adoptions", label: "Moderate adoption listings" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between text-sm text-[var(--ink2)] hover:text-[var(--teal)] no-underline py-1.5 border-b border-[var(--border)] last:border-0 transition-colors"
              >
                {label}
                <span className="text-[var(--faint)]">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
