import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { APP } from "@/lib/config/app";
import ShopNav from "@/components/shop/ShopNav";
import GuestCheckout from "@/components/shop/GuestCheckout";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public" });
  return {
    title: t("checkoutMetaTitle", { app: APP.name }),
    // A cart is personal and has nothing to rank for.
    robots: { index: false, follow: false },
  };
}

export default async function GuestCheckoutPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public" });

  return (
    <div className="min-h-screen bg-[var(--off)]">
      <ShopNav locale={locale} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href={`/${locale}/shop`}
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--teal)] no-underline mb-5 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5 flip-rtl" />
          {t("cartKeepShopping")}
        </Link>

        <h1 className="text-2xl font-bold text-[var(--ink)] mb-6">{t("checkoutTitle")}</h1>

        <GuestCheckout locale={locale} />
      </div>
    </div>
  );
}
