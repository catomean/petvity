import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/auth/guards", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  getInstance: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

/* ─── Import after mocks ───────────────────────────────────────────────────── */

import { POST } from "./route";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const MOCK_SESSION = {
  user: { id: "user-1", role: "pet_owner", email: "user@example.com", name: "Test User" },
  expires: "2099-01-01",
};

/** Delivery details every real checkout sends (see the cart drawer). */
const SHIPPING = {
  shippingName: "Test Buyer",
  shippingLine1: "Teststrasse 1",
  shippingPostalCode: "8000",
  shippingCity: "Zurich",
  shippingCountry: "CH",
};

function makeRequest(body: Record<string, unknown>) {
  // Tests post what the client posts: items + address. A body without an
  // address is itself invalid now, so only the explicit validation tests omit it.
  const payload = "items" in body && !("shippingName" in body) ? { ...SHIPPING, ...body } : body;
  return new NextRequest("http://localhost/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function makeProduct(overrides: Partial<{
  id: string; name: string; priceCents: number; isActive: boolean; stock: number | null;
}> = {}) {
  return {
    id: "prod-1",
    name: "Dog Food",
    priceCents: 1000,
    isActive: true,
    stock: null,          // unlimited by default
    imageUrl: null,
    ...overrides,
  };
}

// UUIDs must have valid version (4) and variant (8–b) bits for Zod v4
const PROD_ID_1 = "00000000-0000-4000-8000-000000000001";
const PROD_ID_2 = "00000000-0000-4000-8000-000000000002";

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("POST /api/orders", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
    vi.mocked(requireSession).mockResolvedValue({ session: MOCK_SESSION as any, error: null });
  });

  it("returns 400 for missing items array", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 when the delivery address is missing (an order must be shippable)", async () => {
    const res = await POST(makeRequest({ items: [{ productId: PROD_ID_1, quantity: 1 }], shippingName: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty items array", async () => {
    const res = await POST(makeRequest({ items: [] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for item with quantity < 1", async () => {
    const res = await POST(makeRequest({ items: [{ productId: PROD_ID_1, quantity: 0 }] }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when session is missing", async () => {
    vi.mocked(requireSession).mockResolvedValue({
      session: null as any,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    });
    const res = await POST(makeRequest({ items: [{ productId: PROD_ID_1, quantity: 1 }] }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when a requested product does not exist", async () => {
    db._queueSelectResult([]); // empty product list
    const res = await POST(makeRequest({ items: [{ productId: PROD_ID_1, quantity: 1 }] }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("not found");
  });

  it("returns 400 when product is inactive", async () => {
    const inactive = makeProduct({ id: PROD_ID_1, isActive: false });
    db._queueSelectResult([inactive]);
    const res = await POST(makeRequest({ items: [{ productId: PROD_ID_1, quantity: 1 }] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("no longer available");
  });

  it("returns 400 when stock is insufficient", async () => {
    const lowStock = makeProduct({ id: PROD_ID_1, stock: 2 });
    db._queueSelectResult([lowStock]);
    const res = await POST(makeRequest({ items: [{ productId: PROD_ID_1, quantity: 5 }] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Insufficient stock");
  });

  it("calculates total correctly: 2×$10 + 1×$25 = $45 (4500 cents)", async () => {
    const prod1 = makeProduct({ id: PROD_ID_1, priceCents: 1000 });
    const prod2 = makeProduct({ id: PROD_ID_2, priceCents: 2500 });
    db._queueSelectResult([prod1, prod2]); // products lookup
    // Stock is now reserved through commercekit's conditional UPDATE, which
    // runs for unlimited-stock products too (`stock IS NULL OR stock >= n`,
    // where NULL - n stays NULL). A matching UPDATE returns its row, so the
    // mock has to say so — returning [] would mean "sold out".
    db._updateReturning.mockResolvedValue([{ id: PROD_ID_1 }]);
    db._queueSelectResult([{ name: "Test", email: "t@t.com" }]); // user email lookup

    let capturedTotalCents: number | undefined;
    db.insert.mockImplementation(() => ({
      values: vi.fn().mockImplementation((vals: unknown) => {
        // Capture only the order insert — it's a single object with totalCents.
        // The orderItems insert passes an array, so we skip it.
        if (vals && !Array.isArray(vals) && typeof (vals as any).totalCents === "number") {
          capturedTotalCents = (vals as any).totalCents;
        }
        return { returning: db._insertReturning };
      }),
    }));
    db._insertReturning
      .mockResolvedValueOnce([{ id: "order-1", totalCents: 4500, userId: "user-1", status: "pending", notes: null }])
      .mockResolvedValueOnce([]); // order items

    await POST(makeRequest({
      items: [
        { productId: PROD_ID_1, quantity: 2 },
        { productId: PROD_ID_2, quantity: 1 },
      ],
    }));

    expect(capturedTotalCents).toBe(2 * 1000 + 1 * 2500); // 4500 cents = $45
  });

  it("returns 201 with order data on success", async () => {
    const prod = makeProduct({ id: PROD_ID_1 });
    db._queueSelectResult([prod]);                                       // products
    // Stock is now reserved through commercekit's conditional UPDATE, which
    // runs for unlimited-stock products too (`stock IS NULL OR stock >= n`,
    // where NULL - n stays NULL). A matching UPDATE returns its row, so the
    // mock has to say so — returning [] would mean "sold out".
    db._updateReturning.mockResolvedValue([{ id: PROD_ID_1 }]);
    db._queueSelectResult([{ name: "Test", email: "t@t.com" }]);        // user email

    const mockOrder = { id: "order-1", totalCents: 1000, userId: "user-1", status: "pending", notes: null };
    const mockItems = [{ id: "item-1", orderId: "order-1", productId: PROD_ID_1, quantity: 1, priceCents: 1000 }];
    db._insertReturning
      .mockResolvedValueOnce([mockOrder])
      .mockResolvedValueOnce(mockItems);

    const res = await POST(makeRequest({ items: [{ productId: PROD_ID_1, quantity: 1 }] }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe("order-1");
  });
});
