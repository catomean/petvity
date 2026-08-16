/**
 * A cart that survives tabs, reloads and stale prices.
 *
 * Two decisions carry most of the value here:
 *
 * 1. **A line stores an id and a quantity. Never a price.** A cart left open
 *    for a week would otherwise show a shopper one price and charge another —
 *    and the version they saw is the one they will argue about. Prices are
 *    re-read from the server at checkout, always.
 *
 * 2. **No framework.** The store is a subscribe/snapshot pair, which is enough
 *    to drive React, Svelte, Vue or nothing at all. The React binding is a
 *    separate entry point so a non-React consumer pays nothing for it.
 *
 * Storage is injected, so the same store works in a browser, on a server, and
 * in a test without stubbing globals.
 */

export type CartLine = {
  /** Whatever the catalogue calls this product. Opaque to the cart. */
  productId: string;
  /** Size, colour, plan — anything that makes two lines of the same product
   *  genuinely different. Absent means the product has no variants. */
  variantId?: string;
  quantity: number;
};

export type CartState = {
  lines: readonly CartLine[];
};

export type CartStorage = {
  read(key: string): string | null;
  write(key: string, value: string): void;
  /** Called when another tab changes the same key. Return an unsubscribe. */
  subscribe?(key: string, onChange: () => void): () => void;
};

export type CartOptions = {
  /** Namespaced and versioned, so a future shape change is recognised and
   *  discarded rather than crashing on someone's year-old cart. */
  key?: string;
  storage?: CartStorage;
  /** Most units of one line. */
  maxQuantity?: number;
  /** Most distinct lines. A cart beyond this is a script, not a shopper. */
  maxLines?: number;
};

const DEFAULTS = {
  key: "commercekit.cart.v1",
  maxQuantity: 99,
  maxLines: 100,
};

/** Storage that forgets everything, for SSR and tests. */
export function memoryStorage(): CartStorage {
  const map = new Map<string, string>();
  return {
    read: (k) => map.get(k) ?? null,
    write: (k, v) => void map.set(k, v),
  };
}

/** Browser localStorage, including the cross-tab change event. */
export function localStorageAdapter(): CartStorage {
  return {
    read: (k) => {
      try {
        return window.localStorage.getItem(k);
      } catch {
        // Private browsing and disabled storage both throw. A cart that
        // forgets is better than a shop that will not load.
        return null;
      }
    },
    write: (k, v) => {
      try {
        window.localStorage.setItem(k, v);
      } catch {
        /* quota or disabled — the in-memory snapshot still works this session */
      }
    },
    subscribe: (k, onChange) => {
      const handler = (e: StorageEvent) => {
        if (e.key === null || e.key === k) onChange();
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    },
  };
}

export function lineKey(line: Pick<CartLine, "productId" | "variantId">): string {
  return line.variantId ? `${line.productId}::${line.variantId}` : line.productId;
}

export type Cart = {
  /** Current lines. Stable by reference between changes, so it can drive
   *  useSyncExternalStore without looping. */
  getSnapshot(): readonly CartLine[];
  /** Always empty — a server has no storage to read. */
  getServerSnapshot(): readonly CartLine[];
  subscribe(listener: () => void): () => void;

  add(productId: string, quantity?: number, variantId?: string): void;
  setQuantity(productId: string, quantity: number, variantId?: string): void;
  remove(productId: string, variantId?: string): void;
  clear(): void;

  count(): number;
  has(productId: string, variantId?: string): boolean;
  quantityOf(productId: string, variantId?: string): number;
};

const EMPTY: readonly CartLine[] = Object.freeze([]);

function parse(raw: string | null, maxQuantity: number, maxLines: number): readonly CartLine[] {
  if (!raw) return EMPTY;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Corrupt or hand-edited storage is not worth breaking the shop over.
    return EMPTY;
  }
  if (!Array.isArray(parsed)) return EMPTY;

  const seen = new Set<string>();
  const lines: CartLine[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "object" || entry === null) continue;
    const { productId, variantId, quantity } = entry as Record<string, unknown>;
    if (typeof productId !== "string" || productId.length === 0) continue;
    if (typeof quantity !== "number" || !Number.isFinite(quantity)) continue;
    if (variantId !== undefined && typeof variantId !== "string") continue;

    const line: CartLine = {
      productId,
      ...(variantId ? { variantId } : {}),
      quantity: Math.min(Math.max(Math.trunc(quantity), 1), maxQuantity),
    };
    const key = lineKey(line);
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(line);
    if (lines.length >= maxLines) break;
  }
  return Object.freeze(lines);
}

export function createCart(options: CartOptions = {}): Cart {
  const key = options.key ?? DEFAULTS.key;
  const maxQuantity = options.maxQuantity ?? DEFAULTS.maxQuantity;
  const maxLines = options.maxLines ?? DEFAULTS.maxLines;
  const storage = options.storage ?? memoryStorage();

  const listeners = new Set<() => void>();

  // Cached so the snapshot reference is stable between real changes.
  let cachedRaw: string | null = null;
  let cachedLines: readonly CartLine[] = EMPTY;
  let primed = false;

  function read(): readonly CartLine[] {
    const raw = storage.read(key);
    if (!primed || raw !== cachedRaw) {
      cachedRaw = raw;
      cachedLines = parse(raw, maxQuantity, maxLines);
      primed = true;
    }
    return cachedLines;
  }

  function write(next: CartLine[]): void {
    const kept = next.filter((l) => l.quantity > 0).slice(0, maxLines);
    storage.write(key, JSON.stringify(kept));
    // A storage event only fires in OTHER tabs, so this one is told by hand.
    read();
    for (const listener of listeners) listener();
  }

  return {
    getSnapshot: read,
    getServerSnapshot: () => EMPTY,

    subscribe(listener) {
      listeners.add(listener);
      const unsubscribeStorage = storage.subscribe?.(key, () => {
        read();
        listener();
      });
      return () => {
        listeners.delete(listener);
        unsubscribeStorage?.();
      };
    },

    add(productId, quantity = 1, variantId) {
      if (!Number.isFinite(quantity) || quantity < 1) return;
      const lines = [...read()];
      const target = lineKey({ productId, variantId });
      const existing = lines.findIndex((l) => lineKey(l) === target);

      if (existing >= 0) {
        lines[existing] = {
          ...lines[existing],
          quantity: Math.min(lines[existing].quantity + Math.trunc(quantity), maxQuantity),
        };
      } else {
        if (lines.length >= maxLines) return;
        lines.push({
          productId,
          ...(variantId ? { variantId } : {}),
          quantity: Math.min(Math.trunc(quantity), maxQuantity),
        });
      }
      write(lines);
    },

    setQuantity(productId, quantity, variantId) {
      const target = lineKey({ productId, variantId });
      const next = Math.min(Math.trunc(quantity), maxQuantity);
      if (next <= 0) {
        write(read().filter((l) => lineKey(l) !== target));
        return;
      }
      write(read().map((l) => (lineKey(l) === target ? { ...l, quantity: next } : l)));
    },

    remove(productId, variantId) {
      const target = lineKey({ productId, variantId });
      write(read().filter((l) => lineKey(l) !== target));
    },

    clear() {
      write([]);
    },

    count() {
      return read().reduce((n, l) => n + l.quantity, 0);
    },

    has(productId, variantId) {
      const target = lineKey({ productId, variantId });
      return read().some((l) => lineKey(l) === target);
    },

    quantityOf(productId, variantId) {
      const target = lineKey({ productId, variantId });
      return read().find((l) => lineKey(l) === target)?.quantity ?? 0;
    },
  };
}
