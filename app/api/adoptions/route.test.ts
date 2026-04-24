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

import { GET, POST } from "./route";
import { requireSession } from "@/lib/auth/guards";
import { auth } from "@/lib/auth";
import { getInstance } from "@/lib/db";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const OWNER_SESSION = {
  user: { id: "owner-1", role: "pet_owner", email: "owner@example.com", name: "Owner" },
  expires: "2099-01-01",
};

const APPLICANT_SESSION = {
  user: { id: "applicant-1", role: "pet_owner", email: "applicant@example.com", name: "Applicant" },
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

function makeGetRequest(params = "") {
  return new NextRequest(`http://localhost/api/adoptions${params ? `?${params}` : ""}`);
}

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("GET /api/adoptions (public browse)", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
    vi.mocked(auth).mockResolvedValue(null as any);
  });

  it("returns 200 with available listings", async () => {
    const mockListings = [{ id: "listing-1", title: "Dog available", status: "available" }];
    db._queueSelectResult(mockListings);

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("returns empty array when no listings exist", async () => {
    db._queueSelectResult([]);

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });
});

describe("GET /api/adoptions?applied=1 (applicant view)", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const res = await GET(makeGetRequest("applied=1"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 200 with applicant's submissions when authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(APPLICANT_SESSION as any);
    const mockApps = [
      {
        applicationId: "app-1",
        applicationStatus: "pending",
        listingId: "listing-1",
        listingTitle: "Dog available",
        listingStatus: "available",
        petName: "Rex",
        petSpecies: "dog",
      },
    ];
    db._queueSelectResult(mockApps);

    const res = await GET(makeGetRequest("applied=1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].applicationId).toBe("app-1");
  });

  it("returns empty array when applicant has no applications", async () => {
    vi.mocked(auth).mockResolvedValue(APPLICANT_SESSION as any);
    db._queueSelectResult([]);

    const res = await GET(makeGetRequest("applied=1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });
});

describe("GET /api/adoptions?mine=1 (owner's listings)", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const res = await GET(makeGetRequest("mine=1"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with owner's listings when authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(OWNER_SESSION as any);
    db._queueSelectResult([{ id: "listing-1", ownerId: "owner-1", status: "available" }]);

    const res = await GET(makeGetRequest("mine=1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

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
