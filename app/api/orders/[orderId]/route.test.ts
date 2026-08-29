import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/auth/guards", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { PATCH } from "./route";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const ORDER_ID = "00000000-0000-4000-8000-000000000066";

const OWNER_SESSION = {
  user: { id: "owner-1", role: "pet_owner", email: "owner@example.com", name: "Owner" },
  expires: "2099-01-01",
};

const ADMIN_SESSION = {
  user: { id: "admin-1", role: "admin", email: "admin@example.com", name: "Admin" },
  expires: "2099-01-01",
};

const MOCK_ORDER_PENDING = {
  id: ORDER_ID,
  userId: "owner-1",
  totalCents: 2999,
  status: "pending",
};

const ROUTE_CONTEXT = { params: Promise.resolve({ orderId: ORDER_ID }) };

function makePatchRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/orders/${ORDER_ID}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("PATCH /api/orders/[orderId]", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
    vi.mocked(requireSession).mockResolvedValue({ session: OWNER_SESSION as any, error: null });
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireSession).mockResolvedValue({
      session: null as any,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    });
    const res = await PATCH(makePatchRequest({ status: "cancelled" }), ROUTE_CONTEXT);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid status value", async () => {
    const res = await PATCH(makePatchRequest({ status: "refunded" }), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
  });

  it("returns 404 when order does not belong to the requesting user", async () => {
    db._queueSelectResult([]); // order not found for this user
    const res = await PATCH(makePatchRequest({ status: "cancelled" }), ROUTE_CONTEXT);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("not found");
  });

  it("returns 403 when non-admin tries to set status other than cancelled", async () => {
    db._queueSelectResult([MOCK_ORDER_PENDING]);
    const res = await PATCH(makePatchRequest({ status: "confirmed" }), ROUTE_CONTEXT);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("cancel");
  });

  it("returns 400 when non-admin tries to cancel a non-pending order", async () => {
    const confirmedOrder = { ...MOCK_ORDER_PENDING, status: "confirmed" };
    db._queueSelectResult([confirmedOrder]);
    const res = await PATCH(makePatchRequest({ status: "cancelled" }), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("pending");
  });

  it("returns 200 when owner cancels their pending order", async () => {
    db._queueSelectResult([MOCK_ORDER_PENDING]);
    const updated = { ...MOCK_ORDER_PENDING, status: "cancelled" };
    db._updateReturning.mockResolvedValueOnce([updated]);
    db._queueSelectResult([{ name: "Owner", email: "owner@example.com" }]); // email lookup

    const res = await PATCH(makePatchRequest({ status: "cancelled" }), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("cancelled");
  });

  it("allows admin to set any status (confirmed)", async () => {
    vi.mocked(requireSession).mockResolvedValue({ session: ADMIN_SESSION as any, error: null });
    db._queueSelectResult([MOCK_ORDER_PENDING]); // admin sees all orders
    const updated = { ...MOCK_ORDER_PENDING, status: "confirmed" };
    db._updateReturning.mockResolvedValueOnce([updated]);
    db._queueSelectResult([{ name: "Owner", email: "owner@example.com" }]); // email lookup

    const res = await PATCH(makePatchRequest({ status: "confirmed" }), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("confirmed");
  });

  it("allows admin to mark order as shipped", async () => {
    vi.mocked(requireSession).mockResolvedValue({ session: ADMIN_SESSION as any, error: null });
    const shippedOrder = { ...MOCK_ORDER_PENDING, status: "confirmed" };
    db._queueSelectResult([shippedOrder]);
    const updated = { ...MOCK_ORDER_PENDING, status: "shipped" };
    db._updateReturning.mockResolvedValueOnce([updated]);
    db._queueSelectResult([{ name: "Owner", email: "owner@example.com" }]);

    const res = await PATCH(makePatchRequest({ status: "shipped" }), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("shipped");
  });
});
