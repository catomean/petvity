import Link from "next/link";
import { PawPrint } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { APP } from "@/lib/config/app";
import CartLink from "@/components/shop/CartLink";

/**
 * The public storefront's one navigation bar.
 *
 * Shared by the catalogue, the product page, checkout and the receipt so the
 * cart badge is in the same place on every step — a cart that appears only on
 * some pages reads as a cart that lost its contents.
 */
export default async function ShopNav({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "public" });

  return (
    <nav className="bg-[var(--card)] border-b border-[var(--border)] px-6 h-14 flex items-center justify-between sticky top-0 z-20">
      <Link
        href={`/${locale}/shop`}
        className="font-bold text-[var(--teal)] text-lg no-underline flex items-center gap-2"
      >
        <PawPrint className="w-5 h-5" />
        {APP.name}
      </Link>
      <div className="flex items-center gap-4">
        <CartLink locale={locale} />
        <Link
          href="/login"
          className="text-sm text-[var(--ink2)] hover:text-[var(--teal)] no-underline transition-colors"
        >
          {t("signIn")}
        </Link>
      </div>
    </nav>
  );
}
