/**
 * commercekit — the correctness layer under a shop.
 *
 * Deliberately not a commerce framework. It owns the four things every shop
 * rewrites and gets subtly wrong, and knows nothing about your products, your
 * database, your framework or your payment provider.
 *
 * React bindings live in `commercekit/react` so the core stays framework-free.
 */

export * from "./money";
export * from "./cart";
export * from "./address";
export * from "./inventory";
export * from "./buyer";
