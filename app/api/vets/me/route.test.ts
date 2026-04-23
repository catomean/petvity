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

const VET_SESSION = {
  user: { id: "vet-1", role: "veterinarian", email: "vet@example.com", name: "Dr Smith" },
  expires: "2099-01-01",
};

const MOCK_PROFILE = {
  userId: "vet-1", bio: "Experienced vet", specialty: "Small animals",
  clinicName: "City Vet", city: "Berlin", country: "DE",
  phone: "+49123456789", isVerified: false, isAcceptingClients: true,
};

function makePostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/vets/me", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makePatchRequest(body: unknown) {
  return new NextRequest("http://localhost/api/vets/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/* ─── GET tests ────────────────────────────────────────────────────────────── */

describe("GET /api/vets/me", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
    vi.mocked(requireRole).mockResolvedValue({ session: VET_SESSION as any, error: null });
  });

  it("returns 401 when not a veterinarian", async () => {
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
    expect(body.data.specialty).toBe("Small animals");
  });
});

/* ─── POST (upsert) tests ──────────────────────────────────────────────────── */

describe("POST /api/vets/me", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
    vi.mocked(requireRole).mockResolvedValue({ session: VET_SESSION as any, error: null });
  });

  it("returns 401 when not a veterinarian", async () => {
    vi.mocked(requireRole).mockResolvedValue({
      session: null as any,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    });
    const res = await POST(makePostRequest({ bio: "test" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid country code (wrong length)", async () => {
    const res = await POST(makePostRequest({ country: "DEU" })); // must be 2 chars
    expect(res.status).toBe(400);
  });

  it("returns 201 when profile is created (no existing profile)", async () => {
    db._queryFindFirst.mockResolvedValueOnce(undefined); // no existing profile
    db._insertReturning.mockResolvedValueOnce([MOCK_PROFILE]);
    const res = await POST(makePostRequest({ bio: "Experienced vet", specialty: "Small animals" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.specialty).toBe("Small animals");
  });

  it("returns 200 when profile is updated (upsert — profile already exists)", async () => {
    db._queryFindFirst.mockResolvedValueOnce(MOCK_PROFILE); // existing profile
    const updated = { ...MOCK_PROFILE, bio: "Updated bio" };
    db._updateReturning.mockResolvedValueOnce([updated]);
    const res = await POST(makePostRequest({ bio: "Updated bio" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.bio).toBe("Updated bio");
  });
});

/* ─── PATCH tests ──────────────────────────────────────────────────────────── */

describe("PATCH /api/vets/me", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
    vi.mocked(requireRole).mockResolvedValue({ session: VET_SESSION as any, error: null });
  });

  it("returns 401 when not a veterinarian", async () => {
    vi.mocked(requireRole).mockResolvedValue({
      session: null as any,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    });
    const res = await PATCH(makePatchRequest({ bio: "test" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when profile does not exist", async () => {
    db._updateReturning.mockResolvedValueOnce([]); // no row updated
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
