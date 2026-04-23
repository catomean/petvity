import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireAdmin: vi.fn() }));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { PATCH, DELETE } from "./route";
import { getInstance } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const PRODUCT_ID = "00000000-0000-4000-8000-000000000001";

function makeParams(productId = PRODUCT_ID) {
  return { params: Promise.resolve({ productId }) };
}

function makePatchRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/products/${PRODUCT_ID}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest() {
  return new NextRequest(`http://localhost/api/products/${PRODUCT_ID}`, { method: "DELETE" });
}

const MOCK_PRODUCT = {
  id: PRODUCT_ID,
  name: "Updated Dog Food",
  priceCents: 3499,
  stock: 40,
  isActive: true,
};

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("PATCH /api/products/[productId]", () => {
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
    const res = await PATCH(makePatchRequest({ name: "New Name" }), makeParams());
    expect(res.status).toBe(401);
  });

  it("returns 400 when priceCents is not an integer", async () => {
    const res = await PATCH(makePatchRequest({ priceCents: 9.99 }), makeParams());
    expect(res.status).toBe(400);
  });

  it("returns 404 when product not found", async () => {
    db._updateReturning.mockResolvedValueOnce([]);
    const res = await PATCH(makePatchRequest({ name: "New Name" }), makeParams());
    expect(res.status).toBe(404);
  });

  it("returns 200 with updated product", async () => {
    db._updateReturning.mockResolvedValueOnce([MOCK_PRODUCT]);
    const res = await PATCH(makePatchRequest({ name: "Updated Dog Food", priceCents: 3499 }), makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("Updated Dog Food");
  });
});

describe("DELETE /api/products/[productId]", () => {
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
    const res = await DELETE(makeDeleteRequest(), makeParams());
    expect(res.status).toBe(401);
  });

  it("returns 404 when product not found", async () => {
    db._updateReturning.mockResolvedValueOnce([]);
    const res = await DELETE(makeDeleteRequest(), makeParams());
    expect(res.status).toBe(404);
  });

  it("returns 200 on successful soft-delete", async () => {
    db._updateReturning.mockResolvedValueOnce([{ id: PRODUCT_ID, isActive: false }]);
    const res = await DELETE(makeDeleteRequest(), makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
