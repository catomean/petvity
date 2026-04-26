import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireAdmin: vi.fn() }));

import { GET } from "./route";
import { getInstance } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";

describe("GET /api/admin/products", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
    vi.mocked(requireAdmin).mockResolvedValue({
      session: { user: { id: "admin-1", role: "admin" } } as any,
      error: null,
    });
  });

  it("returns 401 when caller is not admin", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce({
      session: null as any,
      error: NextResponse.json({ success: false, error: "Forbidden" }, { status: 401 }),
    });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 200 with empty array when no products", async () => {
    db._queueSelectResult([]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it("returns products with seller info from the LEFT JOIN", async () => {
    const rows = [
      {
        id: "p1", name: "Platform treats", description: null, priceCents: 999,
        imageUrl: null, category: "food", stock: 50, isActive: true,
        sellerId: null, sellerName: null, sellerEmail: null,
        createdAt: new Date(), updatedAt: new Date(),
      },
      {
        id: "p2", name: "Alice's toy", description: null, priceCents: 2500,
        imageUrl: null, category: "toys", stock: 10, isActive: true,
        sellerId: "seller-1", sellerName: "Alice", sellerEmail: "alice@example.com",
        createdAt: new Date(), updatedAt: new Date(),
      },
    ];
    db._queueSelectResult(rows);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);

    const platform = body.data.find((p: any) => p.id === "p1");
    const seller = body.data.find((p: any) => p.id === "p2");

    expect(platform.sellerId).toBeNull();
    expect(platform.sellerName).toBeNull();

    expect(seller.sellerId).toBe("seller-1");
    expect(seller.sellerName).toBe("Alice");
    expect(seller.sellerEmail).toBe("alice@example.com");
  });
});
