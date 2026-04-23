import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/auth/guards", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { POST } from "./route";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const LISTING_ID = "00000000-0000-4000-8000-000000000099";
const APP_ID     = "00000000-0000-4000-8000-000000000088";

const APPLICANT_SESSION = {
  user: { id: "applicant-1", role: "pet_owner", email: "applicant@example.com", name: "Alice" },
  expires: "2099-01-01",
};

const OWNER_SESSION = {
  user: { id: "owner-1", role: "pet_owner", email: "owner@example.com", name: "Owner" },
  expires: "2099-01-01",
};

const MOCK_LISTING_AVAILABLE = {
  id: LISTING_ID, ownerId: "owner-1", status: "available", petId: "pet-1",
};

const MOCK_LISTING_ON_HOLD = {
  id: LISTING_ID, ownerId: "owner-1", status: "on_hold", petId: "pet-1",
};

const ROUTE_CONTEXT = { params: Promise.resolve({ listingId: LISTING_ID }) };

function makePostRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/adoptions/${LISTING_ID}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  message: "I would love to adopt this pet",
  experience: "I have owned dogs before",
  housingType: "house",
};

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("POST /api/adoptions/[listingId]/apply", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
    vi.mocked(requireSession).mockResolvedValue({ session: APPLICANT_SESSION as any, error: null });
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireSession).mockResolvedValue({
      session: null as any,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    });
    const res = await POST(makePostRequest(VALID_BODY), ROUTE_CONTEXT);
    expect(res.status).toBe(401);
  });

  it("returns 404 when listing does not exist", async () => {
    db._queueSelectResult([]); // listing not found
    const res = await POST(makePostRequest(VALID_BODY), ROUTE_CONTEXT);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("not found");
  });

  it("returns 409 when listing is no longer available", async () => {
    db._queueSelectResult([MOCK_LISTING_ON_HOLD]); // listing exists but not available
    const res = await POST(makePostRequest(VALID_BODY), ROUTE_CONTEXT);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("longer accepting");
  });

  it("returns 400 when owner applies to their own listing", async () => {
    vi.mocked(requireSession).mockResolvedValue({ session: OWNER_SESSION as any, error: null });
    db._queueSelectResult([MOCK_LISTING_AVAILABLE]); // listing belongs to owner-1
    const res = await POST(makePostRequest(VALID_BODY), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("own listing");
  });

  it("returns 409 when applicant has already applied (one-per-user guard)", async () => {
    db._queueSelectResult([MOCK_LISTING_AVAILABLE]);       // listing found
    db._queueSelectResult([{ id: APP_ID }]);               // existing application found
    const res = await POST(makePostRequest(VALID_BODY), ROUTE_CONTEXT);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("already applied");
  });

  it("returns 201 when a new application is submitted successfully", async () => {
    db._queueSelectResult([MOCK_LISTING_AVAILABLE]); // listing found
    db._queueSelectResult([]);                        // no existing application
    const mockApplication = {
      id: APP_ID, listingId: LISTING_ID, applicantId: "applicant-1", status: "pending",
      message: VALID_BODY.message, experience: VALID_BODY.experience, housingType: VALID_BODY.housingType,
    };
    db._insertReturning.mockResolvedValueOnce([mockApplication]);
    // fire-and-forget email lookups
    db._queueSelectResult([{ name: "Owner", email: "owner@example.com" }]); // owner
    db._queueSelectResult([{ name: "Buddy" }]);                              // pet

    const res = await POST(makePostRequest(VALID_BODY), ROUTE_CONTEXT);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("pending");
  });
});
