"use client";

/**
 * React bindings.
 *
 * A separate entry point so the core stays framework-free: a Svelte or plain-JS
 * consumer never imports React because of this file.
 */

import { useSyncExternalStore } from "react";
import type { Cart, CartLine } from "./cart";

/**
 * Subscribe to a cart's lines.
 *
 * `getSnapshot` must return a stable reference between changes or this loops
 * forever — the cart caches its parse for exactly that reason.
 */
export function useCartLines(cart: Cart): readonly CartLine[] {
  return useSyncExternalStore(cart.subscribe, cart.getSnapshot, cart.getServerSnapshot);
}

/** Total units, for a nav badge. */
export function useCartCount(cart: Cart): number {
  return useCartLines(cart).reduce((n, l) => n + l.quantity, 0);
}

/** Quantity of one product, for an inline stepper. */
export function useCartQuantity(cart: Cart, productId: string, variantId?: string): number {
  const lines = useCartLines(cart);
  const key = variantId ? `${productId}::${variantId}` : productId;
  return (
    lines.find((l) => (l.variantId ? `${l.productId}::${l.variantId}` : l.productId) === key)
      ?.quantity ?? 0
  );
}
