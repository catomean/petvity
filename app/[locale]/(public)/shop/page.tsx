import { getInstance } from "@/lib/db";
import { products, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { APP } from "@/lib/config/app";
import { PRODUCT_CATEGORY_CONFIG } from "@/lib/config/products";
import type { ProductCategoryId } from "@/lib/config/products";
import { ShoppingBag, PawPrint, Package } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: `Shop · ${APP.name}`,
  description: "Browse pet food, toys, accessories, and supplies from the Petvity marketplace.",
};

/** Revalidate every 60 s — product listings update less frequently than adoptions. */
export const revalidate = 60;

const CATEGORIES = Object.entries(PRODUCT_CATEGORY_CONFIG) as [
  ProductCategoryId,
  { label: string; emoji: string },
][];

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
};

export default async function PublicShopPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { category } = await searchParams;
  const t = await getTranslations({ locale, namespace: "public" });

  const activeCategory =
    category && Object.keys(PRODUCT_CATEGORY_CONFIG).includes(category)
      ? (category as ProductCategoryId)
      : null;

  const db = getInstance();

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      priceCents: products.priceCents,
      imageUrl: products.imageUrl,
      category: products.category,
      stock: products.stock,
      sellerName: users.name,
    })
    .from(products)
    .leftJoin(users, eq(users.id, products.sellerId))
    .where(
      activeCategory
        ? and(eq(products.isActive, true), eq(products.category, activeCategory))
        : eq(products.isActive, true),
    )
    .orderBy(products.name)
    .limit(200);

  return (
    <div className="min-h-screen bg-[var(--off)]">
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

      {/* Hero */}
      <div className="bg-white border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-7 h-7 text-[var(--accent)]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--ink)] mb-3">
            {t("shopHeroTitle")}
          </h1>
          <p className="text-[var(--muted)] text-lg max-w-xl mx-auto mb-6">
            {t("shopHeroDesc")}
          </p>
          <Link href="/register" className="btn-primary inline-flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            {t("shopHeroButton")}
          </Link>
        </div>
      </div>

      {/* Category filter bar */}
      <div className="bg-white border-b border-[var(--border)] sticky top-14 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex gap-2 overflow-x-auto">
          <Link
            href={`/${locale}/shop`}
            className={`flex-shrink-0 text-sm font-medium px-3 py-1.5 rounded-full transition-colors no-underline ${
              !activeCategory
                ? "bg-[var(--teal)] text-white"
                : "bg-[var(--off)] text-[var(--ink2)] hover:bg-[var(--teal-light)]"
            }`}
          >
            {t("shopAll")}
          </Link>
          {CATEGORIES.map(([id, cfg]) => (
            <Link
              key={id}
              href={`/${locale}/shop?category=${id}`}
              className={`flex-shrink-0 flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full transition-colors no-underline ${
                activeCategory === id
                  ? "bg-[var(--teal)] text-white"
                  : "bg-[var(--off)] text-[var(--ink2)] hover:bg-[var(--teal-light)]"
              }`}
            >
              <span>{cfg.emoji}</span>
              {cfg.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        {rows.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl mb-3">🛍️</p>
            <p className="font-medium text-[var(--ink)] mb-1">{t("shopEmptyTitle")}</p>
            <p className="text-sm text-[var(--muted)] mb-5">
              {activeCategory
                ? t("shopEmptyCategory", { category: PRODUCT_CATEGORY_CONFIG[activeCategory].label.toLowerCase() })
                : t("shopEmptyAny")}
            </p>
            <Link href="/register" className="btn-primary">
              {t("shopEmptyAction")}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--muted)] mb-5">
              {t("shopCount", { count: rows.length })}
              {activeCategory ? ` ${t("shopInCategory", { category: PRODUCT_CATEGORY_CONFIG[activeCategory].label })}` : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {rows.map((product) => {
                const catCfg =
                  PRODUCT_CATEGORY_CONFIG[product.category as ProductCategoryId];
                return (
                  <Link
                    key={product.id}
                    href={`/${locale}/shop/${product.id}`}
                    className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden hover:shadow-md transition-shadow group flex flex-col no-underline"
                  >
                    {/* Image */}
                    <div className="aspect-square bg-[var(--off)] flex items-center justify-center text-5xl overflow-hidden">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{catCfg?.emoji ?? "📦"}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1">
                      <p className="font-semibold text-[var(--ink)] leading-snug group-hover:text-[var(--teal)] transition-colors">
                        {product.name}
                      </p>
                      {product.description && (
                        <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <p className="text-xs text-[var(--muted)] mt-1.5">
                        {catCfg?.label ?? product.category}
                        {product.sellerName ? ` · ${t("shopSoldBy", { seller: product.sellerName })}` : ""}
                      </p>
                      {product.stock === 0 && (
                        <p className="text-xs text-[var(--danger)] mt-1">{t("shopOutOfStock")}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-3">
                        <span className="text-lg font-bold text-[var(--ink)]">
                          {formatPrice(product.priceCents)}
                        </span>
                        <span className="btn-primary text-xs py-1.5 px-3">
                          {t("shopView")}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Seller CTA footer */}
      <div className="border-t border-[var(--border)] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-10 text-center">
          <p className="font-medium text-[var(--ink)] mb-2">{t("shopCtaTitle")}</p>
          <p className="text-sm text-[var(--muted)] mb-5">
            {t("shopCtaDesc", { app: APP.name })}
          </p>
          <Link href="/register" className="btn-primary inline-flex items-center gap-2">
            <Package className="w-4 h-4" />
            {t("shopCtaButton")}
          </Link>
        </div>
      </div>
    </div>
  );
}
