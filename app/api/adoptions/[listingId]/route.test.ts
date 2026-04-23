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

/* ─── Import after mocks ───────────────────────────────────────────────────── */

import { PATCH, DELETE } from "./route";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

// UUID must have valid version (4) and variant (8–b) bits for Zod v4
const LISTING_ID = "00000000-0000-4000-8000-000000000099";

const OWNER_SESSION = {
  user: { id: "owner-1", role: "pet_owner", email: "owner@example.com", name: "Owner" },
  expires: "2099-01-01",
};

const OTHER_SESSION = {
  user: { id: "other-user", role: "pet_owner", email: "other@example.com", name: "Other" },
  expires: "2099-01-01",
};

const ADMIN_SESSION = {
  user: { id: "admin-1", role: "admin", email: "admin@example.com", name: "Admin" },
  expires: "2099-01-01",
};

const MOCK_LISTING = {
  id: LISTING_ID,
  ownerId: "owner-1",
  petId: "pet-1",
  status: "available",
  title: "Test listing",
};

const ROUTE_CONTEXT = { params: Promise.resolve({ listingId: LISTING_ID }) };

function makePatchRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/adoptions/${LISTING_ID}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest() {
  return new NextRequest(`http://localhost/api/adoptions/${LISTING_ID}`, {
    method: "DELETE",
  });
}

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("PATCH /api/adoptions/[listingId]", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireSession).mockResolvedValue({
      session: null as any,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    });
    const res = await PATCH(makePatchRequest({ status: "on_hold" }), ROUTE_CONTEXT);
    expect(res.status).toBe(401);
  });

  it("returns 404 when listing does not exist", async () => {
    vi.mocked(requireSession).mockResolvedValue({ session: OWNER_SESSION as any, error: null });
    db._queueSelectResult([]); // listing not found
    const res = await PATCH(makePatchRequest({ status: "on_hold" }), ROUTE_CONTEXT);
    expect(res.status).toBe(404);
  });

  it("returns 403 when authenticated user is not the listing owner", async () => {
    vi.mocked(requireSession).mockResolvedValue({ session: OTHER_SESSION as any, error: null });
    db._queueSelectResult([MOCK_LISTING]); // listing belongs to owner-1, not other-user
    const res = await PATCH(makePatchRequest({ status: "on_hold" }), ROUTE_CONTEXT);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
  });

  it("returns 200 when owner patches their own listing", async () => {
    vi.mocked(requireSession).mockResolvedValue({ session: OWNER_SESSION as any, error: null });
    db._queueSelectResult([MOCK_LISTING]);
    const updatedListing = { ...MOCK_LISTING, status: "on_hold" };
    db._updateReturning.mockResolvedValueOnce([updatedListing]);

    const res = await PATCH(makePatchRequest({ status: "on_hold" }), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("allows admin to patch any listing (not their own)", async () => {
    vi.mocked(requireSession).mockResolvedValue({ session: ADMIN_SESSION as any, error: null });
    db._queueSelectResult([MOCK_LISTING]); // listing belongs to owner-1, not admin
    const updatedListing = { ...MOCK_LISTING, status: "adopted" };
    db._updateReturning.mockResolvedValueOnce([updatedListing]);

    const res = await PATCH(makePatchRequest({ status: "adopted" }), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 400 for invalid status value", async () => {
    vi.mocked(requireSession).mockResolvedValue({ session: OWNER_SESSION as any, error: null });
    db._queueSelectResult([MOCK_LISTING]);
    const res = await PATCH(makePatchRequest({ status: "invalid_status" }), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/adoptions/[listingId]", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireSession).mockResolvedValue({
      session: null as any,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    });
    const res = await DELETE(makeDeleteRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated user is not the owner", async () => {
    vi.mocked(requireSession).mockResolvedValue({ session: OTHER_SESSION as any, error: null });
    db._queueSelectResult([MOCK_LISTING]);
    const res = await DELETE(makeDeleteRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(403);
  });

  it("returns 200 when owner deletes their own listing", async () => {
    vi.mocked(requireSession).mockResolvedValue({ session: OWNER_SESSION as any, error: null });
    db._queueSelectResult([MOCK_LISTING]);
    db._deleteReturning.mockResolvedValueOnce([]);
    const res = await DELETE(makeDeleteRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("allows admin to delete any listing", async () => {
    vi.mocked(requireSession).mockResolvedValue({ session: ADMIN_SESSION as any, error: null });
    db._queueSelectResult([MOCK_LISTING]);
    db._deleteReturning.mockResolvedValueOnce([]);
    const res = await DELETE(makeDeleteRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
  });
});
