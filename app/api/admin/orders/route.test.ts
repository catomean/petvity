import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireAdmin: vi.fn() }));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { GET } from "./route";
import { getInstance } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("GET /api/admin/orders", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
    vi.mocked(requireAdmin).mockResolvedValue({ session: { user: { id: "admin-1", role: "admin" } } as any, error: null });
  });

  it("returns 401 when not admin", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce({
      session: null,
      error: NextResponse.json({ success: false, error: "Forbidden" }, { status: 401 }),
    });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 200 with empty array when no orders", async () => {
    db._queueSelectResult([]); // allOrders empty → early return
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it("returns 200 with orders and their items", async () => {
    const order = {
      id: "order-1",
      status: "pending",
      totalCents: 4999,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: { id: "user-1", name: "Alice", email: "alice@example.com" },
    };
    const item = {
      id: "item-1",
      orderId: "order-1",
      productId: "prod-1",
      quantity: 2,
      priceCents: 2499,
      productName: "Dog Food",
      productImageUrl: null,
    };
    db._queueSelectResult([order]); // allOrders
    db._queueSelectResult([item]);  // items for the order

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe("order-1");
    expect(body.data[0].customer.email).toBe("alice@example.com");
    expect(body.data[0].items).toHaveLength(1);
    expect(body.data[0].items[0].productName).toBe("Dog Food");
  });

  it("returns orders with empty items array when no items exist for order", async () => {
    const order = {
      id: "order-2",
      status: "delivered",
      totalCents: 1000,
      notes: "gift",
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: { id: "user-2", name: "Bob", email: "bob@example.com" },
    };
    db._queueSelectResult([order]); // allOrders
    db._queueSelectResult([]);       // no items

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].items).toEqual([]);
  });

  it("groups items correctly across multiple orders", async () => {
    const orders = [
      { id: "order-1", status: "pending", totalCents: 1000, notes: null,
        createdAt: new Date(), updatedAt: new Date(),
        customer: { id: "user-1", name: "Alice", email: "alice@example.com" } },
      { id: "order-2", status: "shipped", totalCents: 2000, notes: null,
        createdAt: new Date(), updatedAt: new Date(),
        customer: { id: "user-2", name: "Bob", email: "bob@example.com" } },
    ];
    const items = [
      { id: "item-1", orderId: "order-1", productId: "p1", quantity: 1, priceCents: 1000, productName: "A", productImageUrl: null },
      { id: "item-2", orderId: "order-2", productId: "p2", quantity: 2, priceCents: 500, productName: "B", productImageUrl: null },
      { id: "item-3", orderId: "order-2", productId: "p3", quantity: 1, priceCents: 1000, productName: "C", productImageUrl: null },
    ];
    db._queueSelectResult(orders);
    db._queueSelectResult(items);

    const res = await GET();
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.data.find((o: any) => o.id === "order-1").items).toHaveLength(1);
    expect(body.data.find((o: any) => o.id === "order-2").items).toHaveLength(2);
  });
});
