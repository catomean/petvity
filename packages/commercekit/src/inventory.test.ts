import { describe, it, expect } from "vitest";
import {
  reserveAll,
  releaseAll,
  memoryInventory,
  ReservationError,
  type ReservationAdapter,
} from "./inventory";

describe("reserving", () => {
  it("takes every line when all are available", async () => {
    const inv = memoryInventory({ a: 10, b: 5 });
    const result = await reserveAll(inv.adapter, [
      { sku: "a", quantity: 3 },
      { sku: "b", quantity: 2 },
    ]);
    expect(result.ok).toBe(true);
    expect(inv.get("a")).toBe(7);
    expect(inv.get("b")).toBe(3);
  });

  it("takes exactly the last unit", async () => {
    const inv = memoryInventory({ a: 1 });
    expect((await reserveAll(inv.adapter, [{ sku: "a", quantity: 1 }])).ok).toBe(true);
    expect(inv.get("a")).toBe(0);
  });

  it("refuses one unit more than exists", async () => {
    const inv = memoryInventory({ a: 1 });
    const result = await reserveAll(inv.adapter, [{ sku: "a", quantity: 2 }]);
    expect(result.ok).toBe(false);
    expect(inv.get("a")).toBe(1);
  });

  it("treats unlimited stock as always available", async () => {
    const inv = memoryInventory({ digital: null });
    const result = await reserveAll(inv.adapter, [{ sku: "digital", quantity: 9999 }]);
    expect(result.ok).toBe(true);
    expect(inv.get("digital")).toBe(null);
  });

  it("fails for an unknown sku", async () => {
    const inv = memoryInventory({ a: 5 });
    const result = await reserveAll(inv.adapter, [{ sku: "ghost", quantity: 1 }]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failed.sku).toBe("ghost");
  });
});

describe("all or nothing", () => {
  it("puts back what it took when a later line fails", async () => {
    // The bug this module exists to prevent: a three-line order where the third
    // line fails, leaving the first two decremented forever.
    const inv = memoryInventory({ a: 10, b: 10, c: 1 });
    const result = await reserveAll(inv.adapter, [
      { sku: "a", quantity: 2 },
      { sku: "b", quantity: 2 },
      { sku: "c", quantity: 5 },
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failed.sku).toBe("c");
      expect(result.compensated).toBe(true);
      expect(result.stranded).toEqual([]);
    }
    expect(inv.snapshot()).toEqual({ a: 10, b: 10, c: 1 });
  });

  it("reports stranded stock rather than hiding it", async () => {
    // If compensation itself fails, stock is unbuyable and a human must know.
    const failing: ReservationAdapter = {
      async decrementIfAvailable(sku) {
        return sku !== "c";
      },
      async increment() {
        throw new Error("database is down");
      },
    };
    const result = await reserveAll(failing, [
      { sku: "a", quantity: 1 },
      { sku: "c", quantity: 1 },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.compensated).toBe(false);
      expect(result.stranded.map((s) => s.sku)).toEqual(["a"]);
    }
  });

  it("compensates and rethrows when the adapter throws", async () => {
    const inv = memoryInventory({ a: 10 });
    const flaky: ReservationAdapter = {
      async decrementIfAvailable(sku, quantity) {
        if (sku === "boom") throw new Error("connection reset");
        return inv.adapter.decrementIfAvailable(sku, quantity);
      },
      increment: inv.adapter.increment,
    };
    await expect(
      reserveAll(flaky, [{ sku: "a", quantity: 3 }, { sku: "boom", quantity: 1 }]),
    ).rejects.toThrow(ReservationError);
    expect(inv.get("a")).toBe(10);
  });
});

describe("concurrency", () => {
  it("lets only one of two buyers win the last unit", async () => {
    const inv = memoryInventory({ a: 1 });
    const [first, second] = await Promise.all([
      reserveAll(inv.adapter, [{ sku: "a", quantity: 1 }]),
      reserveAll(inv.adapter, [{ sku: "a", quantity: 1 }]),
    ]);
    expect([first.ok, second.ok].filter(Boolean)).toHaveLength(1);
    expect(inv.get("a")).toBe(0);
  });

  it("never oversells under many concurrent attempts", async () => {
    const inv = memoryInventory({ a: 10 });
    const attempts = Array.from({ length: 50 }, () =>
      reserveAll(inv.adapter, [{ sku: "a", quantity: 1 }]),
    );
    const results = await Promise.all(attempts);
    expect(results.filter((r) => r.ok)).toHaveLength(10);
    expect(inv.get("a")).toBe(0);
  });

  it("demonstrates why the adapter contract says ATOMIC", async () => {
    // memoryInventory decrements synchronously, so the tests above pass
    // trivially — worth being honest about. This is the same workload against
    // an adapter that reads, awaits, then writes, which is exactly what a
    // hand-written `SELECT stock` followed by `UPDATE stock = $n` does.
    // It oversells, and no amount of care in reserveAll can save it.
    let stock = 10;
    const naive: ReservationAdapter = {
      async decrementIfAvailable(_sku, quantity) {
        const current = stock; // read
        await Promise.resolve(); // any I/O at all yields here
        if (current < quantity) return false;
        stock = current - quantity; // write, using a value that may be stale
        return true;
      },
      async increment(_sku, quantity) {
        stock += quantity;
      },
    };

    const results = await Promise.all(
      Array.from({ length: 50 }, () => reserveAll(naive, [{ sku: "a", quantity: 1 }])),
    );

    // 50 buyers are told "yes" against 10 units, and the recorded stock has
    // fallen by exactly 1 — every write clobbered the others with a value
    // computed from the same stale read. That is the lost-update anomaly, and
    // it is what `decrementIfAvailable` must be a single statement to avoid.
    const sold = results.filter((r) => r.ok).length;
    expect(sold).toBe(50);
    expect(stock).toBe(9);

    // The atomic adapter, same workload, sells exactly what exists.
    const inv = memoryInventory({ a: 10 });
    const honest = await Promise.all(
      Array.from({ length: 50 }, () => reserveAll(inv.adapter, [{ sku: "a", quantity: 1 }])),
    );
    expect(honest.filter((r) => r.ok)).toHaveLength(10);
    expect(inv.get("a")).toBe(0);
  });

  it("takes locks in a stable order to avoid deadlocking opposite carts", async () => {
    // Two orders holding the same two products in opposite order can deadlock
    // against row locks. Sorting by sku makes every caller take them the same way.
    const order: string[] = [];
    const adapter: ReservationAdapter = {
      async decrementIfAvailable(sku) {
        order.push(sku);
        return true;
      },
      async increment() {},
    };
    await reserveAll(adapter, [{ sku: "zebra", quantity: 1 }, { sku: "apple", quantity: 1 }]);
    await reserveAll(adapter, [{ sku: "apple", quantity: 1 }, { sku: "zebra", quantity: 1 }]);
    expect(order).toEqual(["apple", "zebra", "apple", "zebra"]);
  });
});

describe("duplicate lines", () => {
  it("merges two lines of the same product into one decrement", async () => {
    // Otherwise the availability check for the second line is made against
    // stock the first line has already taken.
    const inv = memoryInventory({ a: 3 });
    const result = await reserveAll(inv.adapter, [
      { sku: "a", quantity: 2 },
      { sku: "a", quantity: 2 },
    ]);
    expect(result.ok).toBe(false);
    expect(inv.get("a")).toBe(3);
  });

  it("merges when the combined quantity does fit", async () => {
    const inv = memoryInventory({ a: 5 });
    const result = await reserveAll(inv.adapter, [
      { sku: "a", quantity: 2 },
      { sku: "a", quantity: 3 },
    ]);
    expect(result.ok).toBe(true);
    expect(inv.get("a")).toBe(0);
  });
});

describe("input validation", () => {
  it("rejects a quantity that is not a positive whole number", async () => {
    const inv = memoryInventory({ a: 5 });
    for (const quantity of [0, -1, 1.5, NaN]) {
      await expect(reserveAll(inv.adapter, [{ sku: "a", quantity }])).rejects.toThrow(
        ReservationError,
      );
    }
    expect(inv.get("a")).toBe(5);
  });

  it("accepts an empty request as trivially satisfied", async () => {
    const inv = memoryInventory({ a: 5 });
    const result = await reserveAll(inv.adapter, []);
    expect(result.ok).toBe(true);
  });
});

describe("releasing", () => {
  it("gives stock back", async () => {
    const inv = memoryInventory({ a: 5 });
    await reserveAll(inv.adapter, [{ sku: "a", quantity: 3 }]);
    await releaseAll(inv.adapter, [{ sku: "a", quantity: 3 }]);
    expect(inv.get("a")).toBe(5);
  });

  it("reports what it could not release", async () => {
    const adapter: ReservationAdapter = {
      async decrementIfAvailable() {
        return true;
      },
      async increment(sku) {
        if (sku === "bad") throw new Error("gone");
      },
    };
    const result = await releaseAll(adapter, [
      { sku: "good", quantity: 1 },
      { sku: "bad", quantity: 1 },
    ]);
    expect(result.released.map((r) => r.sku)).toEqual(["good"]);
    expect(result.failed.map((r) => r.sku)).toEqual(["bad"]);
  });

  it("leaves unlimited stock unlimited", async () => {
    const inv = memoryInventory({ digital: null });
    await releaseAll(inv.adapter, [{ sku: "digital", quantity: 5 }]);
    expect(inv.get("digital")).toBe(null);
  });
});
