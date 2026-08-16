"use client";

/**
 * The guest cart: SSOT for what a signed-out shopper has picked up.
 *
 * It stores ONLY `{productId, quantity}`. Names and prices are deliberately not
 * kept here — they are read fresh from the server on the checkout page, so a
 * cart left open for a week can never show a shopper one price and charge them
 * another. localStorage is the store because the whole point of the feature is
 * that there is no session to hang a server-side cart on.
 */

import { useSyncExternalStore } from "react";
import { MAX_ITEM_QUANTITY } from "@/lib/config/products";

/** Versioned so a future shape change can be recognised and discarded, not crash. */
const STORAGE_KEY = "petvity.cart.v1";

export type CartLine = { productId: string; quantity: number };

const listeners = new Set<() => void>();

/** Cached parse. useSyncExternalStore requires a stable reference between
 *  notifications, and re-parsing on every render would return a new array each
 *  time and loop forever. */
let snapshot: CartLine[] = [];
let snapshotRaw: string | null = null;

const EMPTY: CartLine[] = [];

function parse(raw: string | null): CartLine[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.flatMap((entry): CartLine[] => {
      if (typeof entry !== "object" || entry === null) return [];
      const { productId, quantity } = entry as Record<string, unknown>;
      if (typeof productId !== "string" || typeof quantity !== "number") return [];
      const qty = Math.min(Math.max(Math.trunc(quantity), 1), MAX_ITEM_QUANTITY);
      return [{ productId, quantity: qty }];
    });
  } catch {
    // Corrupted or hand-edited storage is not worth a crash on the shop page.
    return EMPTY;
  }
}

function read(): CartLine[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== snapshotRaw) {
    snapshotRaw = raw;
    snapshot = parse(raw);
  }
  return snapshot;
}

function write(lines: CartLine[]) {
  const kept = lines.filter((l) => l.quantity > 0);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
  // localStorage's own `storage` event only fires in OTHER tabs, so this tab
  // has to be told by hand.
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Keep a cart in sync across tabs — two windows on the same shop is normal.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Server render has no localStorage; an empty cart is the honest answer. */
function serverSnapshot(): CartLine[] {
  return EMPTY;
}

/* ─── Mutations ───────────────────────────────────────────────────────────── */

export function addToCart(productId: string, quantity = 1) {
  const lines = read();
  const existing = lines.find((l) => l.productId === productId);
  const next = existing
    ? lines.map((l) =>
        l.productId === productId
          ? { ...l, quantity: Math.min(l.quantity + quantity, MAX_ITEM_QUANTITY) }
          : l,
      )
    : [...lines, { productId, quantity: Math.min(quantity, MAX_ITEM_QUANTITY) }];
  write(next);
}

/** Set an exact quantity; 0 or less removes the line. */
export function setCartQuantity(productId: string, quantity: number) {
  write(
    read().map((l) =>
      l.productId === productId
        ? { ...l, quantity: Math.min(quantity, MAX_ITEM_QUANTITY) }
        : l,
    ),
  );
}

export function removeFromCart(productId: string) {
  write(read().filter((l) => l.productId !== productId));
}

export function clearCart() {
  write([]);
}

/* ─── Read hooks ──────────────────────────────────────────────────────────── */

export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, read, serverSnapshot);
}

/** Total units, for the nav badge. */
export function useCartCount(): number {
  return useCart().reduce((sum, l) => sum + l.quantity, 0);
}
