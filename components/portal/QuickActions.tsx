import Link from "next/link";
import { Search, ShoppingBag, Heart, Store, Briefcase, CalendarCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

/**
 * The dashboard used to answer one question — "how are my pets?" — and left
 * every other thing the platform does undiscovered behind the sidebar. These
 * are the jobs an owner actually comes here for, stated as jobs rather than
 * as destinations, and adapted to which side of the marketplace they are on.
 */
export default async function QuickActions({
  locale,
  isProfessional,
  isSeller,
}: {
  locale: string;
  isProfessional: boolean;
  isSeller: boolean;
}) {
  const t = await getTranslations({ locale, namespace: "portal" });

  const actions: { href: string; icon: React.ElementType; title: string; desc: string }[] = [
    { href: "/portal/find", icon: Search, title: t("qaFindTitle"), desc: t("qaFindDesc") },
    { href: "/portal/shop", icon: ShoppingBag, title: t("qaShopTitle"), desc: t("qaShopDesc") },
    { href: "/portal/adopt", icon: Heart, title: t("qaAdoptTitle"), desc: t("qaAdoptDesc") },
  ];

  if (isProfessional) {
    actions.push({
      href: "/portal/bookings",
      icon: CalendarCheck,
      title: t("qaBookingsTitle"),
      desc: t("qaBookingsDesc"),
    });
  } else {
    actions.push({
      href: "/portal/become-a-pro",
      icon: Briefcase,
      title: t("qaOfferTitle"),
      desc: t("qaOfferDesc"),
    });
  }

  actions.push(
    isSeller
      ? {
          href: "/portal/my-products",
          icon: Store,
          title: t("qaMyStoreTitle"),
          desc: t("qaMyStoreDesc"),
        }
      : {
          href: "/portal/seller-profile",
          icon: Store,
          title: t("qaSellTitle"),
          desc: t("qaSellDesc"),
        },
  );

  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold text-[var(--ink)] mb-1">{t("qaHeading")}</h2>
      <p className="text-sm text-[var(--muted)] mb-4">{t("qaSubheading")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="card card-hover p-4 flex items-start gap-3 no-underline"
          >
            <div className="icon-tile bg-[var(--teal-light)]">
              <Icon className="w-5 h-5 text-[var(--teal)]" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[var(--ink)] text-sm">{title}</p>
              <p className="text-xs text-[var(--muted)] mt-0.5 leading-snug">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
