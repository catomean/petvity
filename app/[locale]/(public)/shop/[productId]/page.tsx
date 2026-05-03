import { notFound } from "next/navigation";
import { getInstance } from "@/lib/db";
import { products, users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { APP, APP_URL } from "@/lib/config/app";
import { PRODUCT_CATEGORY_CONFIG } from "@/lib/config/products";
import type { ProductCategoryId } from "@/lib/config/products";
import { ShoppingBag, PawPrint, ChevronLeft, Package, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/i18n/alternates";

export const revalidate = 60;

type Params = { params: Promise<{ locale: string; productId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { productId } = await params;
  const db = getInstance();
  const [row] = await db
    .select({ name: products.name, description: products.description, priceCents: products.priceCents })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.isActive, true)))
    .limit(1);

  if (!row) return { title: APP.name };
  return {
    title: `${row.name} · ${APP.name} Shop`,
    description: row.description ?? `${row.name} — ${formatPrice(row.priceCents)} on ${APP.name}`,
    alternates: buildAlternates(`/shop/${productId}`),
  };
}

export default async function PublicProductDetailPage({ params }: Params) {
  const { locale, productId } = await params;
  const t = await getTranslations({ locale, namespace: "public" });
  const db = getInstance();

  const [row] = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      priceCents: products.priceCents,
      imageUrl: products.imageUrl,
      category: products.category,
      stock: products.stock,
      sellerName: users.name,
      sellerEmail: users.email,
    })
    .from(products)
    .leftJoin(users, eq(users.id, products.sellerId))
    .where(and(eq(products.id, productId), eq(products.isActive, true)))
    .limit(1);

  if (!row) notFound();

  const catCfg = PRODUCT_CATEGORY_CONFIG[row.category as ProductCategoryId];
  const outOfStock = row.stock === 0;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: row.name,
    description: row.description ?? undefined,
    image: row.imageUrl ?? undefined,
    url: `${APP_URL}/${locale}/shop/${row.id}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (row.priceCents / 100).toFixed(2),
      availability: outOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: row.sellerName ?? APP.name },
    },
  };

  return (
    <div className="min-h-screen bg-[var(--off)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      {/* Nav */}
      <nav className="bg-white border-b border-[var(--border)] px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <Link
          href={`/${locale}`}
          className="font-bold text-[var(--teal)] text-lg no-underline flex items-center gap-2"
        >
          <PawPrint className="w-5 h-5" />
          {APP.name}
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-[var(--ink2)] hover:text-[var(--teal)] no-underline transition-colors"
          >
            {t("signIn")}
          </Link>
          <Link href="/register" className="btn-primary text-sm py-2 px-4">
            {t("joinFree")}
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back */}
        <Link
          href={`/${locale}/shop`}
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--teal)] no-underline mb-5 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          {t("browseShop")}
        </Link>

        {/* Product card */}
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm mb-5">
          {/* Image */}
          <div className="aspect-video bg-[var(--off)] flex items-center justify-center text-8xl overflow-hidden">
            {row.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.imageUrl}
                alt={row.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{catCfg?.emoji ?? "📦"}</span>
            )}
          </div>

          <div className="p-6">
            {/* Category + stock */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium bg-[var(--off)] text-[var(--ink2)] px-2.5 py-1 rounded-full">
                {catCfg?.emoji} {catCfg ? t(`cat_${row.category}` as Parameters<typeof t>[0]) : row.category}
              </span>
              {outOfStock && (
                <span className="text-xs font-medium text-[var(--danger)] bg-[var(--danger-bg)] px-2.5 py-1 rounded-full">
                  {t("shopOutOfStock")}
                </span>
              )}
              {row.stock !== null && row.stock > 0 && (
                <span className="text-xs text-[var(--muted)]">
                  {t("shopStockLeft", { count: row.stock })}
                </span>
              )}
            </div>

            {/* Name + price */}
            <h1 className="text-2xl font-bold text-[var(--ink)] mb-1">{row.name}</h1>
            <p className="text-3xl font-bold text-[var(--teal)] mb-4">
              {formatPrice(row.priceCents)}
            </p>

            {/* Seller */}
            {row.sellerName && (
              <p className="text-sm text-[var(--muted)] mb-4">
                {t("shopListedBy", { seller: row.sellerName })}
              </p>
            )}

            {/* Description */}
            {row.description && (
              <div className="border-t border-[var(--border)] pt-4">
                <p className="text-sm text-[var(--ink2)] leading-relaxed whitespace-pre-line">
                  {row.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Buy CTA */}
        <div className="bg-white rounded-2xl border border-[var(--border)] p-6 text-center shadow-sm">
          <ShoppingBag className="w-8 h-8 text-[var(--accent)] mx-auto mb-3" />
          <p className="font-semibold text-[var(--ink)] mb-1">
            {outOfStock ? t("shopGetNotified") : t("shopReadyToBuy", { name: row.name })}
          </p>
          <p className="text-sm text-[var(--muted)] mb-5">
            {outOfStock
              ? t("shopNotifyDesc", { app: APP.name })
              : t("shopBuyDesc", { app: APP.name })}
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href={`/register?returnTo=/portal/shop`}
              className="btn-primary flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              {outOfStock ? t("shopSignUpAlerts") : t("shopSignUpBuy")}
            </Link>
            <Link href="/login" className="btn-outline">
              {t("signIn")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
