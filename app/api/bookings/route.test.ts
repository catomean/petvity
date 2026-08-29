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

// RFC 4122–compliant test UUIDs (version 4, variant 8)
const PET_UUID = "00000000-0000-4000-8000-000000000001";
const PRO_UUID = "00000000-0000-4000-8000-000000000002";

const OWNER_SESSION = {
  user: { id: "owner-1", role: "pet_owner", email: "owner@example.com", name: "Owner" },
  expires: "2099-01-01",
};

const VALID_BODY = {
  petId: PET_UUID,
  professionalId: PRO_UUID,
  startDate: "2026-06-01T10:00:00.000Z",
  endDate: "2026-06-03T10:00:00.000Z",
  notes: "Please bring treats",
};

const MOCK_PET = { id: PET_UUID, name: "Buddy" };
const MOCK_VET = { id: PRO_UUID, role: "veterinarian", email: "vet@example.com", name: "Dr Smith" };
const MOCK_SITTER = { id: PRO_UUID, role: "pet_sitter", email: "sitter@example.com", name: "Jane" };
const MOCK_NON_PRO_USER = {
  id: PRO_UUID,
  role: "pet_owner",
  email: "random@example.com",
  name: "Random",
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("POST /api/bookings", () => {
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
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing required fields", async () => {
    const res = await POST(makeRequest({ petId: PET_UUID })); // missing rest
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid petId (not a UUID)", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, petId: "not-a-uuid" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when endDate is not after startDate", async () => {
    const res = await POST(
      makeRequest({
        ...VALID_BODY,
        startDate: "2026-06-03T10:00:00.000Z",
        endDate: "2026-06-01T10:00:00.000Z", // end before start
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("after start date");
  });

  it("returns 400 when endDate equals startDate", async () => {
    const same = "2026-06-01T10:00:00.000Z";
    const res = await POST(makeRequest({ ...VALID_BODY, startDate: same, endDate: same }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when pet does not belong to the requesting user", async () => {
    db._queueSelectResult([]); // pet not found / not owned
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("Pet not found");
  });

  it("returns 404 when professional user does not exist", async () => {
    db._queueSelectResult([MOCK_PET]); // pet found
    db._queueSelectResult([]); // professional not found
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("Professional not found");
  });

  it("returns 404 when professional is a pet_owner (not vet/sitter)", async () => {
    db._queueSelectResult([MOCK_PET]);
    db._queueSelectResult([MOCK_NON_PRO_USER]);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("Professional not found");
  });

  it("returns 201 when booking is created with a veterinarian", async () => {
    db._queueSelectResult([MOCK_PET]);
    db._queueSelectResult([MOCK_VET]);
    const mockBooking = {
      id: "booking-1",
      petId: PET_UUID,
      professionalId: PRO_UUID,
      professionalRole: "veterinarian",
      status: "pending",
    };
    db._insertReturning.mockResolvedValueOnce([mockBooking]);

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.professionalRole).toBe("veterinarian");
  });

  it("returns 201 when booking is created with a pet_sitter", async () => {
    db._queueSelectResult([MOCK_PET]);
    db._queueSelectResult([MOCK_SITTER]);
    const mockBooking = {
      id: "booking-2",
      petId: PET_UUID,
      professionalId: PRO_UUID,
      professionalRole: "pet_sitter",
      status: "pending",
    };
    db._insertReturning.mockResolvedValueOnce([mockBooking]);

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.professionalRole).toBe("pet_sitter");
  });
});
