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

const OWNER_SESSION = {
  user: { id: "owner-1", role: "pet_owner", email: "owner@example.com", name: "Owner" },
  expires: "2099-01-01",
};

const MOCK_PET = {
  id: "00000000-0000-4000-8000-000000000001",
  ownerId: "owner-1",
  name: "Buddy",
  species: "dog",
  breed: "Labrador Retriever",
  sex: "male",
  isPublic: false,
  handle: "buddy-000000",
};

function makePostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/pets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = { name: "Buddy", species: "dog", sex: "male" };

/* ─── GET tests ────────────────────────────────────────────────────────────── */

describe("GET /api/pets", () => {
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
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 200 with empty list when owner has no pets", async () => {
    db._queryFindMany.mockResolvedValueOnce([]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it("returns 200 with owner's pets", async () => {
    db._queryFindMany.mockResolvedValueOnce([MOCK_PET]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Buddy");
  });
});

/* ─── POST tests ───────────────────────────────────────────────────────────── */

describe("POST /api/pets", () => {
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

  it("returns 400 when name is missing", async () => {
    const res = await POST(makePostRequest({ species: "dog" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid species", async () => {
    const res = await POST(makePostRequest({ name: "Buddy", species: "dragon" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when weightGrams is a float (storage convention enforced)", async () => {
    const res = await POST(makePostRequest({ ...VALID_BODY, weightGrams: 3.5 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when name exceeds max length", async () => {
    const res = await POST(makePostRequest({ ...VALID_BODY, name: "x".repeat(101) }));
    expect(res.status).toBe(400);
  });

  it("returns 201 with created pet and generated handle on success", async () => {
    const petWithoutHandle = { ...MOCK_PET, handle: null };
    const petWithHandle = { ...MOCK_PET };
    db._insertReturning.mockResolvedValueOnce([petWithoutHandle]); // insert
    db._updateReturning.mockResolvedValueOnce([petWithHandle]); // set handle

    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("Buddy");
    expect(body.data.handle).toBe("buddy-000000");
  });
});
