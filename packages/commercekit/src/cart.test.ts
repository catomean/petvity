import { describe, it, expect } from "vitest";
import { createCart, memoryStorage, lineKey, type CartStorage } from "./cart";

function cart(opts = {}) {
  return createCart({ storage: memoryStorage(), ...opts });
}

describe("adding and removing", () => {
  it("adds a line", () => {
    const c = cart();
    c.add("apple");
    expect(c.getSnapshot()).toEqual([{ productId: "apple", quantity: 1 }]);
  });

  it("merges a repeat add into the existing line", () => {
    const c = cart();
    c.add("apple", 2);
    c.add("apple", 3);
    expect(c.quantityOf("apple")).toBe(5);
    expect(c.getSnapshot()).toHaveLength(1);
  });

  it("treats variants of one product as separate lines", () => {
    const c = cart();
    c.add("shoe", 1, "42");
    c.add("shoe", 1, "43");
    expect(c.getSnapshot()).toHaveLength(2);
    expect(c.quantityOf("shoe", "42")).toBe(1);
    expect(c.quantityOf("shoe", "44")).toBe(0);
  });

  it("sets an exact quantity", () => {
    const c = cart();
    c.add("apple", 5);
    c.setQuantity("apple", 2);
    expect(c.quantityOf("apple")).toBe(2);
  });

  it("removes a line when quantity reaches zero", () => {
    const c = cart();
    c.add("apple", 2);
    c.setQuantity("apple", 0);
    expect(c.getSnapshot()).toEqual([]);
    expect(c.has("apple")).toBe(false);
  });

  it("removes and clears", () => {
    const c = cart();
    c.add("apple");
    c.add("pear");
    c.remove("apple");
    expect(c.getSnapshot()).toHaveLength(1);
    c.clear();
    expect(c.getSnapshot()).toEqual([]);
  });

  it("counts total units, not lines", () => {
    const c = cart();
    c.add("apple", 3);
    c.add("pear", 2);
    expect(c.count()).toBe(5);
    expect(c.getSnapshot()).toHaveLength(2);
  });
});

describe("limits", () => {
  it("clamps quantity to the maximum", () => {
    const c = cart({ maxQuantity: 5 });
    c.add("apple", 99);
    expect(c.quantityOf("apple")).toBe(5);
    c.setQuantity("apple", 1000);
    expect(c.quantityOf("apple")).toBe(5);
  });

  it("clamps an incremental add that would exceed the maximum", () => {
    const c = cart({ maxQuantity: 5 });
    c.add("apple", 4);
    c.add("apple", 4);
    expect(c.quantityOf("apple")).toBe(5);
  });

  it("refuses to grow past the line limit", () => {
    const c = cart({ maxLines: 2 });
    c.add("a");
    c.add("b");
    c.add("c");
    expect(c.getSnapshot()).toHaveLength(2);
  });

  it("ignores a nonsense quantity rather than storing it", () => {
    const c = cart();
    c.add("apple", 0);
    c.add("pear", -5);
    c.add("plum", NaN);
    expect(c.getSnapshot()).toEqual([]);
  });

  it("truncates a fractional quantity", () => {
    const c = cart();
    c.add("apple", 2.7);
    expect(c.quantityOf("apple")).toBe(2);
  });
});

describe("prices are never stored", () => {
  it("keeps only ids and quantities on the wire", () => {
    // The whole reason a cart may not cache a price: a cart open for a week
    // would show one price and charge another.
    const storage = memoryStorage();
    const c = createCart({ storage });
    c.add("apple", 2, "large");
    const raw = storage.read("commercekit.cart.v1")!;
    expect(JSON.parse(raw)).toEqual([{ productId: "apple", variantId: "large", quantity: 2 }]);
    expect(raw).not.toMatch(/price|amount|currency|total/i);
  });
});

describe("surviving bad storage", () => {
  const load = (value: string): CartStorage => {
    const map = new Map([["commercekit.cart.v1", value]]);
    return { read: (k) => map.get(k) ?? null, write: (k, v) => void map.set(k, v) };
  };

  it("treats unparseable JSON as an empty cart", () => {
    expect(createCart({ storage: load("{not json") }).getSnapshot()).toEqual([]);
  });

  it("ignores a payload that is not a list", () => {
    expect(createCart({ storage: load('{"lines":[]}') }).getSnapshot()).toEqual([]);
  });

  it("drops malformed lines but keeps the good ones", () => {
    const c = createCart({
      storage: load(
        JSON.stringify([
          { productId: "good", quantity: 2 },
          { productId: "", quantity: 1 },
          { quantity: 3 },
          { productId: "bad", quantity: "many" },
          null,
          "nonsense",
          { productId: "alsogood", quantity: 1 },
        ]),
      ),
    });
    expect(c.getSnapshot().map((l) => l.productId)).toEqual(["good", "alsogood"]);
  });

  it("collapses duplicate lines that a bug may have written", () => {
    const c = createCart({
      storage: load(
        JSON.stringify([
          { productId: "apple", quantity: 1 },
          { productId: "apple", quantity: 5 },
        ]),
      ),
    });
    expect(c.getSnapshot()).toHaveLength(1);
  });

  it("clamps a quantity that was tampered with in storage", () => {
    const c = createCart({
      storage: load(JSON.stringify([{ productId: "apple", quantity: 999999 }])),
      maxQuantity: 99,
    });
    expect(c.quantityOf("apple")).toBe(99);
  });
});

describe("subscriptions", () => {
  it("notifies on change", () => {
    const c = cart();
    let calls = 0;
    const stop = c.subscribe(() => calls++);
    c.add("apple");
    c.setQuantity("apple", 3);
    expect(calls).toBe(2);
    stop();
    c.add("pear");
    expect(calls).toBe(2);
  });

  it("keeps the snapshot reference stable between changes", () => {
    // useSyncExternalStore re-renders forever if the snapshot is a new array
    // every call.
    const c = cart();
    c.add("apple");
    expect(c.getSnapshot()).toBe(c.getSnapshot());
  });

  it("returns a new reference after a change", () => {
    const c = cart();
    const before = c.getSnapshot();
    c.add("apple");
    expect(c.getSnapshot()).not.toBe(before);
  });

  it("reports empty on the server, where there is no storage", () => {
    const c = cart();
    c.add("apple");
    expect(c.getServerSnapshot()).toEqual([]);
  });

  it("picks up a change made by another tab", () => {
    const map = new Map<string, string>();
    let notify: (() => void) | null = null;
    const storage: CartStorage = {
      read: (k) => map.get(k) ?? null,
      write: (k, v) => void map.set(k, v),
      subscribe: (_k, onChange) => {
        notify = onChange;
        return () => (notify = null);
      },
    };
    const c = createCart({ storage });
    let calls = 0;
    c.subscribe(() => calls++);

    // Another tab writes, then the storage event fires.
    map.set("commercekit.cart.v1", JSON.stringify([{ productId: "fromOtherTab", quantity: 1 }]));
    notify!();

    expect(calls).toBe(1);
    expect(c.getSnapshot().map((l) => l.productId)).toEqual(["fromOtherTab"]);
  });
});

describe("lineKey", () => {
  it("distinguishes variants and matches plain products", () => {
    expect(lineKey({ productId: "a" })).toBe("a");
    expect(lineKey({ productId: "a", variantId: "x" })).toBe("a::x");
    expect(lineKey({ productId: "a" })).not.toBe(lineKey({ productId: "a", variantId: "x" }));
  });
});

describe("isolation between carts", () => {
  it("keeps separate keys apart", () => {
    const storage = memoryStorage();
    const a = createCart({ storage, key: "shop-a" });
    const b = createCart({ storage, key: "shop-b" });
    a.add("apple");
    expect(b.getSnapshot()).toEqual([]);
  });
});
