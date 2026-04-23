import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/auth/guards", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  getInstance: vi.fn(),
}));

/* ─── Import after mocks ───────────────────────────────────────────────────── */

import { POST } from "./route";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const OWNER_SESSION = {
  user: { id: "owner-1", role: "pet_owner", email: "owner@example.com", name: "Owner" },
  expires: "2099-01-01",
};

const MOCK_PET = { id: "pet-1" };

// UUIDs must have valid version (4) and variant (8–b) bits for Zod v4
const PET_UUID = "00000000-0000-4000-8000-000000000001";

const VALID_BODY = {
  petId: PET_UUID,
  title: "Sweet dog looking for a home",
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/adoptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("POST /api/adoptions", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
    vi.mocked(requireSession).mockResolvedValue({ session: OWNER_SESSION as any, error: null });
  });

  it("returns 400 for missing required fields", async () => {
    const res = await POST(makeRequest({ petId: "00000000-0000-0000-0000-000000000001" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 for invalid petId (not a UUID)", async () => {
    const res = await POST(makeRequest({ petId: "not-a-uuid-at-all", title: "Test" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireSession).mockResolvedValue({
      session: null as any,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it("returns 404 when pet does not belong to the requesting user", async () => {
    db._queueSelectResult([]); // pet not found / not owned by this user
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("not found");
  });

  it("returns 409 when an active listing already exists for the pet", async () => {
    db._queueSelectResult([MOCK_PET]);               // pet found
    db._queueSelectResult([{ id: "existing-1" }]);  // existing listing found
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("active adoption listing");
  });

  it("returns 201 when listing is created successfully", async () => {
    db._queueSelectResult([MOCK_PET]); // pet found
    db._queueSelectResult([]);          // no existing listing

    const mockListing = {
      id: "listing-1",
      petId: PET_UUID,
      ownerId: "owner-1",
      title: VALID_BODY.title,
      status: "available",
    };
    db._insertReturning.mockResolvedValueOnce([mockListing]);

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe("listing-1");
  });
});
