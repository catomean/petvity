"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCartCount } from "@/lib/shop/cart";

/**
 * Cart entry point in the public shop nav.
 *
 * Renders nothing until something is in the cart: an always-visible empty cart
 * on a marketing page is noise, and its absence is the clearest possible
 * "you haven't picked anything yet".
 */
export default function CartLink({ locale }: { locale: string }) {
  const t = useTranslations("public");
  const count = useCartCount();

  if (count === 0) return null;

  return (
    <Link
      href={`/${locale}/shop/checkout`}
      className="relative inline-flex items-center gap-2 text-sm font-medium text-[var(--ink)] hover:text-[var(--accent)] no-underline transition-colors"
    >
      <span className="relative">
        <ShoppingCart className="w-5 h-5" />
        <span className="absolute -top-1.5 -end-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--accent)] text-white text-[11px] font-bold flex items-center justify-center">
          {count}
        </span>
      </span>
      <span className="hidden sm:inline">{t("cartView")}</span>
    </Link>
  );
}
