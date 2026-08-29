import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/auth/guards", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { GET, PATCH } from "./route";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const LISTING_ID = "00000000-0000-4000-8000-000000000099";
const APP_ID = "00000000-0000-4000-8000-000000000077";

const OWNER_SESSION = {
  user: { id: "owner-1", role: "pet_owner", email: "owner@example.com", name: "Owner" },
  expires: "2099-01-01",
};

const APPLICANT_SESSION = {
  user: { id: "applicant-1", role: "pet_owner", email: "applicant@example.com", name: "Alice" },
  expires: "2099-01-01",
};

const ADMIN_SESSION = {
  user: { id: "admin-1", role: "admin", email: "admin@example.com", name: "Admin" },
  expires: "2099-01-01",
};

const MOCK_LISTING = { ownerId: "owner-1", petId: "pet-1" };

const MOCK_APPLICATION = {
  id: APP_ID,
  listingId: LISTING_ID,
  applicantId: "applicant-1",
  status: "pending",
  message: "I love dogs",
  experience: "5 years",
  housingType: "house",
  createdAt: new Date("2026-04-01"),
};

const ROUTE_CONTEXT = { params: Promise.resolve({ listingId: LISTING_ID }) };

function makeGetRequest() {
  return new NextRequest(`http://localhost/api/adoptions/${LISTING_ID}/applications`, {
    method: "GET",
  });
}

function makePatchRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/adoptions/${LISTING_ID}/applications`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/* ─── GET tests ────────────────────────────────────────────────────────────── */

describe("GET /api/adoptions/[listingId]/applications", () => {
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
    const res = await GET(makeGetRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(401);
  });

  it("returns 404 when listing does not exist", async () => {
    db._queueSelectResult([]); // listing not found
    const res = await GET(makeGetRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(404);
  });

  it("returns 200 with all applications for the listing owner", async () => {
    db._queueSelectResult([MOCK_LISTING]); // listing found (owner-1)
    const appWithApplicant = {
      ...MOCK_APPLICATION,
      applicant: { id: "applicant-1", name: "Alice", email: "applicant@example.com" },
    };
    db._queueSelectResult([appWithApplicant]); // all applications
    const res = await GET(makeGetRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it("returns 200 with only own application for a non-owner applicant", async () => {
    vi.mocked(requireSession).mockResolvedValue({ session: APPLICANT_SESSION as any, error: null });
    db._queueSelectResult([MOCK_LISTING]); // listing found (owner-1, not applicant-1)
    const appWithApplicant = {
      ...MOCK_APPLICATION,
      applicant: { id: "applicant-1", name: "Alice", email: "applicant@example.com" },
    };
    db._queueSelectResult([appWithApplicant]); // only their own application
    const res = await GET(makeGetRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

/* ─── PATCH tests ──────────────────────────────────────────────────────────── */

describe("PATCH /api/adoptions/[listingId]/applications", () => {
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
    const res = await PATCH(
      makePatchRequest({ applicationId: APP_ID, status: "approved" }),
      ROUTE_CONTEXT,
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when listing does not exist", async () => {
    db._queueSelectResult([]); // listing not found
    const res = await PATCH(
      makePatchRequest({ applicationId: APP_ID, status: "approved" }),
      ROUTE_CONTEXT,
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when non-owner tries to update an application", async () => {
    vi.mocked(requireSession).mockResolvedValue({ session: APPLICANT_SESSION as any, error: null });
    db._queueSelectResult([MOCK_LISTING]); // listing belongs to owner-1, not applicant-1
    const res = await PATCH(
      makePatchRequest({ applicationId: APP_ID, status: "approved" }),
      ROUTE_CONTEXT,
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
  });

  it("returns 400 for invalid status value", async () => {
    db._queueSelectResult([MOCK_LISTING]);
    const res = await PATCH(
      makePatchRequest({ applicationId: APP_ID, status: "cancelled" }),
      ROUTE_CONTEXT,
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when applicationId is not a valid UUID", async () => {
    db._queueSelectResult([MOCK_LISTING]);
    const res = await PATCH(
      makePatchRequest({ applicationId: "not-a-uuid", status: "approved" }),
      ROUTE_CONTEXT,
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 when owner approves an application", async () => {
    db._queueSelectResult([MOCK_LISTING]);
    const updatedApp = { ...MOCK_APPLICATION, status: "approved" };
    db._updateReturning.mockResolvedValueOnce([updatedApp]);
    // fire-and-forget email lookups
    db._queueSelectResult([{ name: "Alice", email: "applicant@example.com" }]); // applicant
    db._queueSelectResult([{ name: "Buddy" }]); // pet

    const res = await PATCH(
      makePatchRequest({ applicationId: APP_ID, status: "approved" }),
      ROUTE_CONTEXT,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("approved");
  });

  it("allows admin to approve any application", async () => {
    vi.mocked(requireSession).mockResolvedValue({ session: ADMIN_SESSION as any, error: null });
    db._queueSelectResult([MOCK_LISTING]);
    const updatedApp = { ...MOCK_APPLICATION, status: "approved" };
    db._updateReturning.mockResolvedValueOnce([updatedApp]);
    db._queueSelectResult([{ name: "Alice", email: "applicant@example.com" }]);
    db._queueSelectResult([{ name: "Buddy" }]);

    const res = await PATCH(
      makePatchRequest({ applicationId: APP_ID, status: "approved" }),
      ROUTE_CONTEXT,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("approved");
  });

  it("returns 404 when application does not exist for this listing", async () => {
    db._queueSelectResult([MOCK_LISTING]);
    db._updateReturning.mockResolvedValueOnce([]); // no matching application
    const res = await PATCH(
      makePatchRequest({ applicationId: APP_ID, status: "rejected" }),
      ROUTE_CONTEXT,
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("Application not found");
  });
});
