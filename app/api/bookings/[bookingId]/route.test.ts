import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/auth/guards", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { PATCH, DELETE } from "./route";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const BOOKING_ID = "00000000-0000-4000-8000-000000000055";

const OWNER_SESSION = {
  user: { id: "owner-1", role: "pet_owner", email: "owner@example.com", name: "Owner" },
  expires: "2099-01-01",
};

const PRO_SESSION = {
  user: { id: "pro-1", role: "veterinarian", email: "vet@example.com", name: "Dr Smith" },
  expires: "2099-01-01",
};

const MOCK_BOOKING_PENDING = {
  id: BOOKING_ID,
  ownerId: "owner-1",
  professionalId: "pro-1",
  petId: "pet-1",
  status: "pending",
  startDate: new Date("2026-06-01"),
  endDate: new Date("2026-06-03"),
};

const ROUTE_CONTEXT = { params: Promise.resolve({ bookingId: BOOKING_ID }) };

function makePatchRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/bookings/${BOOKING_ID}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest() {
  return new NextRequest(`http://localhost/api/bookings/${BOOKING_ID}`, { method: "DELETE" });
}

/* ─── PATCH tests ──────────────────────────────────────────────────────────── */

describe("PATCH /api/bookings/[bookingId]", () => {
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
    const res = await PATCH(makePatchRequest({ status: "rejected" }), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
  });

  it("returns 404 when booking is not accessible to the user", async () => {
    db._queueSelectResult([]); // user is neither owner nor professional
    const res = await PATCH(makePatchRequest({ status: "cancelled" }), ROUTE_CONTEXT);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("not found");
  });

  it("returns 403 when owner tries to set status other than cancelled", async () => {
    db._queueSelectResult([MOCK_BOOKING_PENDING]); // owner-1 is the ownerId
    const res = await PATCH(makePatchRequest({ status: "confirmed" }), ROUTE_CONTEXT);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("cancel");
  });

  it("returns 200 when owner cancels their booking", async () => {
    db._queueSelectResult([MOCK_BOOKING_PENDING]);
    const updated = { ...MOCK_BOOKING_PENDING, status: "cancelled" };
    db._updateReturning.mockResolvedValueOnce([updated]);

    const res = await PATCH(makePatchRequest({ status: "cancelled" }), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("cancelled");
  });

  it("returns 200 when professional confirms a booking", async () => {
    vi.mocked(requireSession).mockResolvedValue({ session: PRO_SESSION as any, error: null });
    db._queueSelectResult([MOCK_BOOKING_PENDING]); // pro-1 is the professionalId
    const updated = { ...MOCK_BOOKING_PENDING, status: "confirmed" };
    db._updateReturning.mockResolvedValueOnce([updated]);
    // fire-and-forget email lookups — queue empty results
    db._queueSelectResult([]); // owner lookup
    db._queueSelectResult([]); // pet lookup

    const res = await PATCH(makePatchRequest({ status: "confirmed" }), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("confirmed");
  });
});

/* ─── DELETE tests ─────────────────────────────────────────────────────────── */

describe("DELETE /api/bookings/[bookingId]", () => {
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
    const res = await DELETE(makeDeleteRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(401);
  });

  it("returns 404 when booking does not belong to the requesting user", async () => {
    db._queueSelectResult([]); // booking not found for this owner
    const res = await DELETE(makeDeleteRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(404);
  });

  it("returns 400 when booking is not in pending status", async () => {
    const confirmedBooking = { ...MOCK_BOOKING_PENDING, status: "confirmed" };
    db._queueSelectResult([confirmedBooking]);
    const res = await DELETE(makeDeleteRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("pending");
  });

  it("returns 200 when owner deletes a pending booking", async () => {
    db._queueSelectResult([MOCK_BOOKING_PENDING]);
    const res = await DELETE(makeDeleteRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
