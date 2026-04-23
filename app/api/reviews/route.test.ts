import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/auth/guards", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { GET, POST } from "./route";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const BOOKING_ID    = "00000000-0000-4000-8000-000000000055";
const PRO_UUID      = "00000000-0000-4000-8000-000000000002";

const OWNER_SESSION = {
  user: { id: "owner-1", role: "pet_owner", email: "owner@example.com", name: "Owner" },
  expires: "2099-01-01",
};

const MOCK_BOOKING_COMPLETED = { ownerId: "owner-1", professionalId: PRO_UUID, status: "completed" };
const MOCK_BOOKING_PENDING   = { ownerId: "owner-1", professionalId: PRO_UUID, status: "pending" };

function makeGetRequest(professionalId?: string) {
  const url = professionalId
    ? `http://localhost/api/reviews?professionalId=${professionalId}`
    : "http://localhost/api/reviews";
  return new NextRequest(url, { method: "GET" });
}

function makePostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = { bookingId: BOOKING_ID, rating: 5, comment: "Excellent service!" };

/* ─── GET tests ────────────────────────────────────────────────────────────── */

describe("GET /api/reviews", () => {
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
    const res = await GET(makeGetRequest(PRO_UUID));
    expect(res.status).toBe(401);
  });

  it("returns 400 when professionalId is missing", async () => {
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(400);
  });

  it("returns 200 with reviews and aggregates", async () => {
    const mockReview = { id: "r-1", rating: 5, comment: "Great!", createdAt: new Date(), reviewerName: "Owner" };
    db._queueSelectResult([mockReview]);           // reviews rows
    db._queueSelectResult([{ avgRating: "4.5", total: 1 }]); // aggregate

    const res = await GET(makeGetRequest(PRO_UUID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.meta.avgRating).toBe(4.5);
    expect(body.meta.total).toBe(1);
  });
});

/* ─── POST tests ───────────────────────────────────────────────────────────── */

describe("POST /api/reviews", () => {
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
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid rating (out of 1-5 range)", async () => {
    const res = await POST(makePostRequest({ ...VALID_BODY, rating: 6 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid rating (zero)", async () => {
    const res = await POST(makePostRequest({ ...VALID_BODY, rating: 0 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid bookingId (not a UUID)", async () => {
    const res = await POST(makePostRequest({ ...VALID_BODY, bookingId: "not-a-uuid" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when booking does not belong to the user", async () => {
    db._queueSelectResult([]); // booking not found for this owner
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("not found");
  });

  it("returns 400 when booking is not completed", async () => {
    db._queueSelectResult([MOCK_BOOKING_PENDING]); // booking exists but pending
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("completed bookings");
  });

  it("returns 409 when booking already has a review (one-per-booking guard)", async () => {
    db._queueSelectResult([MOCK_BOOKING_COMPLETED]);   // booking valid
    db._queueSelectResult([{ id: "existing-review" }]); // existing review found
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("already reviewed");
  });

  it("returns 201 when review is created successfully", async () => {
    db._queueSelectResult([MOCK_BOOKING_COMPLETED]); // booking valid
    db._queueSelectResult([]);                        // no existing review
    const mockReview = {
      id: "review-1", bookingId: BOOKING_ID, reviewerId: "owner-1",
      professionalId: PRO_UUID, rating: 5, comment: "Excellent service!",
    };
    db._insertReturning.mockResolvedValueOnce([mockReview]);

    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.rating).toBe(5);
  });
});
