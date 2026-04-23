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

const USER_ID   = "00000000-0000-4000-8000-000000000010";
const ADMIN_ID  = "00000000-0000-4000-8000-000000000001";

const ADMIN_SESSION = {
  user: { id: ADMIN_ID, role: "admin", email: "admin@example.com", name: "Admin" },
  expires: "2099-01-01",
};

const ROUTE_CONTEXT = { params: Promise.resolve({ userId: USER_ID }) };
const SELF_CONTEXT  = { params: Promise.resolve({ userId: ADMIN_ID }) };

function makePatchRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/admin/users/${USER_ID}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("PATCH /api/admin/users/[userId]", () => {
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
    const res = await PATCH(makePatchRequest({ role: "pet_owner" }), ROUTE_CONTEXT);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid role value", async () => {
    const res = await PATCH(makePatchRequest({ role: "superuser" }), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
  });

  it("returns 400 when admin tries to demote themselves", async () => {
    const res = await PATCH(makePatchRequest({ role: "pet_owner" }), SELF_CONTEXT);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("own role");
  });

  it("returns 400 when demoting the last admin", async () => {
    // Target user IS an admin, and there are 0 other admins
    db._queryFindFirst.mockResolvedValueOnce({ id: USER_ID, role: "admin" }); // target is admin
    db._queueSelectResult([{ remaining: 0 }]); // no other admins
    const res = await PATCH(makePatchRequest({ role: "pet_owner" }), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("last admin");
  });

  it("returns 200 when demoting a non-last admin to pet_owner", async () => {
    db._queryFindFirst.mockResolvedValueOnce({ id: USER_ID, role: "admin" }); // target is admin
    db._queueSelectResult([{ remaining: 1 }]); // 1 other admin remains
    db._updateReturning.mockResolvedValueOnce([{ id: USER_ID, role: "pet_owner" }]);
    const res = await PATCH(makePatchRequest({ role: "pet_owner" }), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.role).toBe("pet_owner");
  });

  it("returns 200 when promoting a pet_owner to veterinarian (no last-admin check needed)", async () => {
    // role !== "admin" and target is not currently admin — skips the last-admin check
    db._queryFindFirst.mockResolvedValueOnce({ id: USER_ID, role: "pet_owner" }); // not currently admin
    db._updateReturning.mockResolvedValueOnce([{ id: USER_ID, role: "veterinarian" }]);
    const res = await PATCH(makePatchRequest({ role: "veterinarian" }), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.role).toBe("veterinarian");
  });

  it("returns 404 when user does not exist", async () => {
    // role === "admin" — no last-admin check; update returns nothing
    db._updateReturning.mockResolvedValueOnce([]); // no user found
    const res = await PATCH(makePatchRequest({ role: "admin" }), ROUTE_CONTEXT);
    expect(res.status).toBe(404);
  });
});
