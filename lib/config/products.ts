/**
 * SSOT for product catalogue config.
 * Enum values must match productCategoryEnum in lib/db/schema.ts.
 */

export const PRODUCT_CATEGORY_CONFIG = {
  food:        { label: "Food",        emoji: "🍖" },
  toys:        { label: "Toys",        emoji: "🎾" },
  health:      { label: "Health",      emoji: "💊" },
  accessories: { label: "Accessories", emoji: "🎀" },
  grooming:    { label: "Grooming",    emoji: "✂️" },
  other:       { label: "Other",       emoji: "📦" },
} as const;

export type ProductCategoryId = keyof typeof PRODUCT_CATEGORY_CONFIG;

/** Flat options list for <select> elements. */
export const PRODUCT_CATEGORY_OPTIONS = (
  Object.entries(PRODUCT_CATEGORY_CONFIG) as [ProductCategoryId, { label: string; emoji: string }][]
).map(([value, { label }]) => ({ value, label }));

/** Quick label lookup for display. Falls back to capitalised id. */
export function productCategoryLabel(category: string): string {
  return PRODUCT_CATEGORY_CONFIG[category as ProductCategoryId]?.label ?? category;
}

/**
 * SSOT for how a shopper can order the catalogue.
 *
 * The id is what appears in the URL (`?sort=price_asc`), so it is part of the
 * page's public contract — shared links and search engines keep it. Add
 * entries; do not rename them.
 */
export const PRODUCT_SORT_OPTIONS = [
  { id: "newest", labelKey: "shopSortNewest" },
  { id: "price_asc", labelKey: "shopSortPriceAsc" },
  { id: "price_desc", labelKey: "shopSortPriceDesc" },
  { id: "name", labelKey: "shopSortName" },
] as const;

export type ProductSortId = (typeof PRODUCT_SORT_OPTIONS)[number]["id"];

export const DEFAULT_PRODUCT_SORT: ProductSortId = "newest";

/** Narrow an untrusted `?sort=` value to a supported one. */
export function toProductSort(value: string | undefined): ProductSortId {
  return PRODUCT_SORT_OPTIONS.some((o) => o.id === value)
    ? (value as ProductSortId)
    : DEFAULT_PRODUCT_SORT;
}

/**
 * Most units of one product a single order may contain.
 *
 * SSOT because it is enforced in three places that must agree: the cart's `+`
 * button stops here, the checkout request is validated against it, and the
 * order schema rejects anything above it. If they disagreed, a shopper could
 * build a cart the server then refuses at the last step.
 */
export const MAX_ITEM_QUANTITY = 99;
