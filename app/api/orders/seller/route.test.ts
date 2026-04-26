import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireSession: vi.fn() }));

import { GET } from "./route";
import { getInstance } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";

const SELLER_ID = "00000000-0000-4000-8000-000000000001";
const ORDER_A = "00000000-0000-4000-8000-0000000000aa";
const ORDER_B = "00000000-0000-4000-8000-0000000000bb";

const MOCK_SESSION = {
  user: { id: SELLER_ID, role: "pet_owner", email: "seller@example.com", name: "Alice" },
  expires: "2099-01-01",
};

describe("GET /api/orders/seller", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
    vi.mocked(requireSession).mockResolvedValue({ session: MOCK_SESSION as any, error: null });
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      session: null as any,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns empty array when seller has no order items", async () => {
    db._queueSelectResult([]); // sellerItems lookup
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it("groups items by order and computes per-seller subtotal", async () => {
    // Three items across two orders, all belong to this seller
    const sellerItems = [
      { id: "i1", orderId: ORDER_A, productId: "p1", quantity: 2, priceCents: 1000, productName: "Treats", productImageUrl: null },
      { id: "i2", orderId: ORDER_A, productId: "p2", quantity: 1, priceCents: 2500, productName: "Toy",    productImageUrl: null },
      { id: "i3", orderId: ORDER_B, productId: "p1", quantity: 3, priceCents: 1000, productName: "Treats", productImageUrl: null },
    ];
    const orderRows = [
      {
        id: ORDER_A, status: "pending", totalCents: 5000, notes: null,
        createdAt: new Date("2026-04-01T10:00:00Z"),
        buyerName: "Bob", buyerEmail: "bob@example.com",
      },
      {
        id: ORDER_B, status: "shipped", totalCents: 3000, notes: "ship fast",
        createdAt: new Date("2026-04-02T10:00:00Z"),
        buyerName: null, buyerEmail: "carol@example.com",
      },
    ];
    db._queueSelectResult(sellerItems);
    db._queueSelectResult(orderRows);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);

    const orderA = body.data.find((o: any) => o.id === ORDER_A);
    const orderB = body.data.find((o: any) => o.id === ORDER_B);

    // Order A: 2×1000 + 1×2500 = 4500
    expect(orderA.items).toHaveLength(2);
    expect(orderA.sellerSubtotalCents).toBe(4500);
    expect(orderA.buyerName).toBe("Bob");

    // Order B: 3×1000 = 3000
    expect(orderB.items).toHaveLength(1);
    expect(orderB.sellerSubtotalCents).toBe(3000);
    expect(orderB.buyerEmail).toBe("carol@example.com");
  });

  it("subtotal is the seller's items only — never the order's overall total", async () => {
    // Buyer placed an order totaling $100 but only $25 is for this seller
    const sellerItems = [
      { id: "i1", orderId: ORDER_A, productId: "p1", quantity: 1, priceCents: 2500, productName: "Toy", productImageUrl: null },
    ];
    const orderRows = [
      {
        id: ORDER_A, status: "pending", totalCents: 10000, notes: null,
        createdAt: new Date("2026-04-01T10:00:00Z"),
        buyerName: "Bob", buyerEmail: "bob@example.com",
      },
    ];
    db._queueSelectResult(sellerItems);
    db._queueSelectResult(orderRows);

    const res = await GET();
    const body = await res.json();
    expect(body.data[0].sellerSubtotalCents).toBe(2500);
    expect(body.data[0].totalCents).toBe(10000); // raw order total still passed through for context
  });
});
