import { getInstance } from "@/lib/db";
import { products, users } from "@/lib/db/schema";
import { eq, and, or, ilike, asc, desc, type SQL } from "drizzle-orm";
import Link from "next/link";
import { APP } from "@/lib/config/app";
import {
  PRODUCT_CATEGORY_CONFIG,
  PRODUCT_SORT_OPTIONS,
  toProductSort,
} from "@/lib/config/products";
import type { ProductCategoryId } from "@/lib/config/products";
import { ShoppingBag, Package, Search } from "lucide-react";
import { ProductArt } from "@/components/shop/ProductArt";
import ShopNav from "@/components/shop/ShopNav";
import AddToCartButton from "@/components/shop/AddToCartButton";
import { formatPrice } from "@/lib/utils/format";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/i18n/alternates";

/** Revalidate every 60 s — product listings update less frequently than adoptions. */
export const revalidate = 60;

const CATEGORIES = Object.entries(PRODUCT_CATEGORY_CONFIG) as [
  ProductCategoryId,
  { label: string; emoji: string },
][];

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; q?: string; sort?: string }>;
};

/** Order clause per sort id. Kept beside the config it switches on. */
const ORDER_BY: Record<string, SQL> = {
  newest: desc(products.createdAt),
  price_asc: asc(products.priceCents),
  price_desc: desc(products.priceCents),
  name: asc(products.name),
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public" });
  const title = t("shopMetaTitle", { app: APP.name });
  const description = t("shopMetaDesc", { app: APP.name });
  return { title, description, openGraph: { title, description }, twitter: { card: "summary", title, description }, alternates: buildAlternates("/shop") };
}

export default async function PublicShopPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { category, q, sort } = await searchParams;
  const t = await getTranslations({ locale, namespace: "public" });

  const activeCategory =
    category && Object.keys(PRODUCT_CATEGORY_CONFIG).includes(category)
      ? (category as ProductCategoryId)
      : null;

  const query = (q ?? "").trim().slice(0, 100);
  const activeSort = toProductSort(sort);

  /** Preserve the other filters when changing one — a shopper who searched and
   *  then picks a category should not silently lose the search. */
  const hrefWith = (next: { category?: string | null; q?: string; sort?: string }) => {
    const sp = new URLSearchParams();
    const cat = next.category === undefined ? activeCategory : next.category;
    const qq = next.q === undefined ? query : next.q;
    const st = next.sort === undefined ? activeSort : next.sort;
    if (cat) sp.set("category", cat);
    if (qq) sp.set("q", qq);
    if (st !== "newest") sp.set("sort", st);
    const s = sp.toString();
    return `/${locale}/shop${s ? `?${s}` : ""}`;
  };

  const conditions = [eq(products.isActive, true)];
  if (activeCategory) conditions.push(eq(products.category, activeCategory));
  if (query) {
    // Name or description — a shopper searching "harness" should find one
    // whose name is a brand they don't know.
    const like = `%${query}%`;
    conditions.push(
      or(ilike(products.name, like), ilike(products.description, like)) as SQL,
    );
  }

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
    .where(and(...conditions))
    .orderBy(ORDER_BY[activeSort])
    .limit(200);

  return (
    <div className="min-h-screen bg-[var(--off)]">
      <ShopNav locale={locale} />

      {/* Hero */}
      <div className="bg-[var(--light)] border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-12 text-center">
          <div className="w-14 h-14 rounded-2xl ed-icon flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--ink)] mb-3">
            {t("shopHeroTitle")}
          </h1>
          <p className="text-[var(--muted)] text-lg max-w-xl mx-auto mb-3">
            {t("shopHeroDesc")}
          </p>
          {/* No sign-up CTA: the products below are the call to action now. */}
          <p className="text-sm text-[var(--teal)] font-medium">{t("shopNoAccountNeeded")}</p>
        </div>
      </div>

      {/* Category filter bar */}
      <div className="bg-white border-b border-[var(--border)] sticky top-14 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex gap-2 overflow-x-auto">
          <Link
            href={hrefWith({ category: null })}
            className={`flex-shrink-0 text-sm font-medium px-3 py-1.5 rounded-full border transition-colors no-underline ${
              !activeCategory
                ? "bg-[var(--warm-ink)] text-white border-[var(--warm-ink)]"
                : "bg-transparent text-[var(--ink2)] border-[var(--border)] hover:border-[var(--border-hover)]"
            }`}
          >
            {t("shopAll")}
          </Link>
          {CATEGORIES.map(([id, cfg]) => (
            <Link
              key={id}
              href={hrefWith({ category: id })}
              className={`flex-shrink-0 flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-colors no-underline ${
                activeCategory === id
                  ? "bg-[var(--warm-ink)] text-white border-[var(--warm-ink)]"
                  : "bg-transparent text-[var(--ink2)] border-[var(--border)] hover:border-[var(--border-hover)]"
              }`}
            >
              <span>{cfg.emoji}</span>
              {t(`cat_${id}` as Parameters<typeof t>[0])}
            </Link>
          ))}
        </div>
      </div>

      {/* Search + sort. A plain GET form, so results are a shareable URL and
          work with JavaScript disabled — the same reason sort is links. */}
      <div className="max-w-5xl mx-auto px-6 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <form action={`/${locale}/shop`} method="get" className="relative flex-1">
            {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
            {activeSort !== "newest" && <input type="hidden" name="sort" value={activeSort} />}
            <Search className="w-4 h-4 text-[var(--muted)] absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder={t("shopSearchPlaceholder")}
              aria-label={t("shopSearchPlaceholder")}
              className="form-input form-input-icon"
            />
          </form>

          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-[var(--muted)] flex-shrink-0">{t("shopSortLabel")}</span>
            {PRODUCT_SORT_OPTIONS.map((o) => (
              <Link
                key={o.id}
                href={hrefWith({ sort: o.id })}
                className={`flex-shrink-0 text-sm px-2.5 py-1 rounded-lg no-underline transition-colors ${
                  activeSort === o.id
                    ? "bg-[var(--teal-light)] text-[var(--teal)] font-medium"
                    : "text-[var(--ink2)] hover:bg-[var(--light)]"
                }`}
              >
                {t(o.labelKey as Parameters<typeof t>[0])}
              </Link>
            ))}
          </div>
        </div>

        {query && (
          <p className="text-sm text-[var(--muted)] mt-3">
            {t("shopResultCount", { count: rows.length, query })}{" "}
            <Link href={hrefWith({ q: "" })} className="text-[var(--teal)] no-underline">
              {t("shopClearSearch")}
            </Link>
          </p>
        )}
      </div>

      {/* Product grid */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        {rows.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl mb-3">🛍️</p>
            <p className="font-medium text-[var(--ink)] mb-1">{t("shopEmptyTitle")}</p>
            <p className="text-sm text-[var(--muted)] mb-5">
              {query
                ? t("shopEmptySearch", { query })
                : activeCategory
                  ? t("shopEmptyCategory", { category: t(`cat_${activeCategory}` as Parameters<typeof t>[0]).toLowerCase() })
                  : t("shopEmptyAny")}
            </p>
            {/* A search that found nothing needs a way back to everything,
                not a sign-up prompt. */}
            {query ? (
              <Link href={hrefWith({ q: "", category: null })} className="btn-editorial">
                {t("shopSeeEverything")}
              </Link>
            ) : (
              <Link href="/register" className="btn-editorial">
                {t("shopEmptyAction")}
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--muted)] mb-5">
              {t("shopCount", { count: rows.length })}
              {activeCategory ? ` ${t("shopInCategory", { category: t(`cat_${activeCategory}` as Parameters<typeof t>[0]) })}` : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {rows.map((product) => {
                const catCfg =
                  PRODUCT_CATEGORY_CONFIG[product.category as ProductCategoryId];
                return (
                  /* A card, not a link: the buy button lives inside it, and a
                     button nested in an anchor is neither valid nor clickable
                     the way a shopper expects. */
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden hover:shadow-md transition-shadow group flex flex-col"
                  >
                    <Link
                      href={`/${locale}/shop/${product.id}`}
                      className="no-underline flex flex-col flex-1"
                    >
                      {/* Image */}
                      <div className="aspect-square bg-[var(--off)] flex items-center justify-center overflow-hidden">
                        <ProductArt
                          imageUrl={product.imageUrl}
                          alt={product.name}
                          category={product.category}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="p-4 pb-0 flex flex-col flex-1">
                        <p className="font-semibold text-[var(--ink)] leading-snug group-hover:text-[var(--accent)] transition-colors">
                          {product.name}
                        </p>
                        {product.description && (
                          <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        <p className="text-xs text-[var(--muted)] mt-1.5">
                          {catCfg ? t(`cat_${product.category}` as Parameters<typeof t>[0]) : product.category}
                          {product.sellerName ? ` · ${t("shopSoldBy", { seller: product.sellerName })}` : ""}
                        </p>
                      </div>
                    </Link>

                    <div className="p-4 pt-3 mt-auto flex items-center justify-between gap-2">
                      <span className="text-lg font-bold text-[var(--ink)]">
                        {formatPrice(product.priceCents)}
                      </span>
                      <AddToCartButton
                        productId={product.id}
                        outOfStock={product.stock === 0}
                        stock={product.stock}
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Seller CTA footer */}
      <div className="bg-[var(--obsidian)]">
        <div className="max-w-5xl mx-auto px-6 py-10 text-center">
          <p className="ed-title-sm ed-title-on-dark mb-2">{t("shopCtaTitle")}</p>
          <p className="text-sm text-[var(--platinum-dim)] mb-5">
            {t("shopCtaDesc", { app: APP.name })}
          </p>
          <Link href="/register" className="btn-editorial-light inline-flex items-center gap-2">
            <Package className="w-4 h-4" />
            {t("shopCtaButton")}
          </Link>
        </div>
      </div>
    </div>
  );
}
