import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/auth/guards", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { PATCH, DELETE } from "./route";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const PET_ID = "00000000-0000-4000-8000-000000000042";

const OWNER_SESSION = {
  user: { id: "owner-1", role: "pet_owner", email: "owner@example.com", name: "Owner" },
  expires: "2099-01-01",
};

const MOCK_PET = {
  id: PET_ID,
  name: "Buddy",
  ownerId: "owner-1",
  species: "dog",
  breed: "Labrador Retriever",
  isPublic: false,
};

const ROUTE_CONTEXT = { params: Promise.resolve({ petId: PET_ID }) };

function makePatchRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/pets/${PET_ID}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest() {
  return new NextRequest(`http://localhost/api/pets/${PET_ID}`, { method: "DELETE" });
}

/* ─── PATCH tests ──────────────────────────────────────────────────────────── */

describe("PATCH /api/pets/[petId]", () => {
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
    const res = await PATCH(makePatchRequest({ name: "Max" }), ROUTE_CONTEXT);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid field (name too long)", async () => {
    const res = await PATCH(makePatchRequest({ name: "x".repeat(101) }), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid handle format (uppercase)", async () => {
    const res = await PATCH(makePatchRequest({ handle: "MY-PET" }), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
  });

  it("returns 404 when pet does not belong to the requesting user", async () => {
    // The pets PATCH uses AND(id, ownerId) in WHERE — returns [] if not owned
    db._updateReturning.mockResolvedValueOnce([]); // no rows updated = not found/not owned
    const res = await PATCH(makePatchRequest({ name: "Max" }), ROUTE_CONTEXT);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not found");
  });

  it("returns 200 with updated pet on success", async () => {
    const updated = { ...MOCK_PET, name: "Max" };
    db._updateReturning.mockResolvedValueOnce([updated]);
    const res = await PATCH(makePatchRequest({ name: "Max" }), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("Max");
  });

  it("returns 200 when setting pet public with valid handle", async () => {
    const updated = { ...MOCK_PET, isPublic: true, handle: "buddy-the-dog" };
    db._updateReturning.mockResolvedValueOnce([updated]);
    const res = await PATCH(
      makePatchRequest({ isPublic: true, handle: "buddy-the-dog" }),
      ROUTE_CONTEXT,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.handle).toBe("buddy-the-dog");
  });
});

/* ─── DELETE tests ─────────────────────────────────────────────────────────── */

describe("DELETE /api/pets/[petId]", () => {
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

  it("returns 404 when pet does not belong to the requesting user", async () => {
    // DELETE uses AND(id, ownerId) in WHERE — returns [] if not owned
    db._deleteReturning.mockResolvedValueOnce([]);
    const res = await DELETE(makeDeleteRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not found");
  });

  it("returns 200 when owner deletes their pet", async () => {
    db._deleteReturning.mockResolvedValueOnce([{ id: PET_ID }]);
    const res = await DELETE(makeDeleteRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
