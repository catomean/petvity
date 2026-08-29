import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/auth/guards", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { GET, POST, PATCH } from "./route";
import { requireRole } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const SITTER_SESSION = {
  user: { id: "sitter-1", role: "pet_sitter", email: "sitter@example.com", name: "Jane" },
  expires: "2099-01-01",
};

const MOCK_PROFILE = {
  userId: "sitter-1",
  bio: "Loving pet sitter",
  services: "walking,boarding",
  pricePerDay: 5000,
  city: "Munich",
  country: "DE",
  phone: "+49987654321",
  isVerified: false,
  isAcceptingClients: true,
};

function makePostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/sitters/me", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makePatchRequest(body: unknown) {
  return new NextRequest("http://localhost/api/sitters/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/* ─── GET tests ────────────────────────────────────────────────────────────── */

describe("GET /api/sitters/me", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
    vi.mocked(requireRole).mockResolvedValue({ session: SITTER_SESSION as any, error: null });
  });

  it("returns 401 when not a pet_sitter", async () => {
    vi.mocked(requireRole).mockResolvedValue({
      session: null as any,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 200 with null when no profile exists yet", async () => {
    db._queryFindFirst.mockResolvedValueOnce(undefined);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeNull();
  });

  it("returns 200 with profile data", async () => {
    db._queryFindFirst.mockResolvedValueOnce(MOCK_PROFILE);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.pricePerDay).toBe(5000);
  });
});

/* ─── POST (upsert) tests ──────────────────────────────────────────────────── */

describe("POST /api/sitters/me", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
    vi.mocked(requireRole).mockResolvedValue({ session: SITTER_SESSION as any, error: null });
  });

  it("returns 401 when not a pet_sitter", async () => {
    vi.mocked(requireRole).mockResolvedValue({
      session: null as any,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    });
    const res = await POST(makePostRequest({ bio: "test" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when pricePerDay is a float (must be integer cents)", async () => {
    const res = await POST(makePostRequest({ pricePerDay: 50.5 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid country code (wrong length)", async () => {
    const res = await POST(makePostRequest({ country: "DEU" }));
    expect(res.status).toBe(400);
  });

  it("returns 201 when profile is created (no existing profile)", async () => {
    db._queryFindFirst.mockResolvedValueOnce(undefined);
    db._insertReturning.mockResolvedValueOnce([MOCK_PROFILE]);
    const res = await POST(makePostRequest({ bio: "Loving pet sitter", pricePerDay: 5000 }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.pricePerDay).toBe(5000);
  });

  it("returns 200 when profile is updated (upsert — profile already exists)", async () => {
    db._queryFindFirst.mockResolvedValueOnce(MOCK_PROFILE);
    const updated = { ...MOCK_PROFILE, pricePerDay: 6000 };
    db._updateReturning.mockResolvedValueOnce([updated]);
    const res = await POST(makePostRequest({ pricePerDay: 6000 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.pricePerDay).toBe(6000);
  });
});

/* ─── PATCH tests ──────────────────────────────────────────────────────────── */

describe("PATCH /api/sitters/me", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
    vi.mocked(requireRole).mockResolvedValue({ session: SITTER_SESSION as any, error: null });
  });

  it("returns 401 when not a pet_sitter", async () => {
    vi.mocked(requireRole).mockResolvedValue({
      session: null as any,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    });
    const res = await PATCH(makePatchRequest({ bio: "test" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when profile does not exist", async () => {
    db._updateReturning.mockResolvedValueOnce([]);
    const res = await PATCH(makePatchRequest({ isAcceptingClients: false }));
    expect(res.status).toBe(404);
  });

  it("returns 200 with updated profile", async () => {
    const updated = { ...MOCK_PROFILE, isAcceptingClients: false };
    db._updateReturning.mockResolvedValueOnce([updated]);
    const res = await PATCH(makePatchRequest({ isAcceptingClients: false }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.isAcceptingClients).toBe(false);
  });
});
