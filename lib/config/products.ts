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
