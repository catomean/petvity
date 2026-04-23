import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/auth/guards", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { PATCH } from "./route";
import { requireAdmin } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const USER_ID = "00000000-0000-4000-8000-000000000010";

const ADMIN_SESSION = {
  user: { id: "admin-1", role: "admin", email: "admin@example.com", name: "Admin" },
  expires: "2099-01-01",
};

const ROUTE_CONTEXT = { params: Promise.resolve({ userId: USER_ID }) };

function makePatchRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/admin/professionals/${USER_ID}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("PATCH /api/admin/professionals/[userId]", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
    vi.mocked(requireAdmin).mockResolvedValue({ session: ADMIN_SESSION as any, error: null });
  });

  it("returns 401 when not an admin", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      session: null as any,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    });
    const res = await PATCH(makePatchRequest({ isVerified: true }), ROUTE_CONTEXT);
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing isVerified field", async () => {
    const res = await PATCH(makePatchRequest({}), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
  });

  it("returns 404 when user does not exist", async () => {
    db._queueSelectResult([]); // user not found
    const res = await PATCH(makePatchRequest({ isVerified: true }), ROUTE_CONTEXT);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("User not found");
  });

  it("returns 400 when user is not a vet or sitter", async () => {
    db._queueSelectResult([{ role: "pet_owner" }]); // pet_owner cannot be verified
    const res = await PATCH(makePatchRequest({ isVerified: true }), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("not a veterinarian or pet sitter");
  });

  it("returns 200 when verifying a veterinarian", async () => {
    db._queueSelectResult([{ role: "veterinarian" }]);
    db._updateReturning.mockResolvedValueOnce([{ isVerified: true }]);
    const res = await PATCH(makePatchRequest({ isVerified: true }), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.isVerified).toBe(true);
  });

  it("returns 200 when verifying a pet_sitter", async () => {
    db._queueSelectResult([{ role: "pet_sitter" }]);
    db._updateReturning.mockResolvedValueOnce([{ isVerified: true }]);
    const res = await PATCH(makePatchRequest({ isVerified: true }), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.isVerified).toBe(true);
  });

  it("returns 404 when vet profile does not exist (user exists but no profile)", async () => {
    db._queueSelectResult([{ role: "veterinarian" }]);
    db._updateReturning.mockResolvedValueOnce([]); // profile not found
    const res = await PATCH(makePatchRequest({ isVerified: true }), ROUTE_CONTEXT);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("profile not found");
  });
});
