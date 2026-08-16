"use client";

/**
 * Petvity's guest cart — a thin binding over `commercekit`.
 *
 * The cart's actual behaviour (id-and-quantity only, never a cached price;
 * cross-tab sync; clamping; surviving corrupted storage) lives in the package,
 * because Petvity is not the only shop in the fleet that needs it. What stays
 * here is only what is genuinely Petvity's: the storage key and the quantity
 * cap, which must agree with the order schema's own cap.
 */

import { createCart, localStorageAdapter, memoryStorage } from "@/packages/commercekit/src/cart";
import {
  useCartLines,
  useCartCount as useCount,
} from "@/packages/commercekit/src/react";
import { MAX_ITEM_QUANTITY } from "@/lib/config/products";

export type { CartLine } from "@/packages/commercekit/src/cart";

/** Versioned, so a future shape change is discarded rather than crashing on
 *  someone's year-old cart. */
const STORAGE_KEY = "petvity.cart.v1";

export const cart = createCart({
  key: STORAGE_KEY,
  // `localStorage` only exists in the browser; the module is imported during
  // SSR too, so the server gets a store that simply holds nothing.
  storage: typeof window === "undefined" ? memoryStorage() : localStorageAdapter(),
  maxQuantity: MAX_ITEM_QUANTITY,
});

export const addToCart = (productId: string, quantity = 1) => cart.add(productId, quantity);
export const setCartQuantity = (productId: string, quantity: number) =>
  cart.setQuantity(productId, quantity);
export const removeFromCart = (productId: string) => cart.remove(productId);
export const clearCart = () => cart.clear();

export function useCart() {
  return useCartLines(cart);
}

export function useCartCount() {
  return useCount(cart);
}
