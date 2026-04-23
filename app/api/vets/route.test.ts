import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireSession: vi.fn() }));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { GET } from "./route";
import { getInstance } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function makeRequest(query?: string) {
  return new NextRequest(`http://localhost/api/vets${query ? `?${query}` : ""}`);
}

const MOCK_VET = {
  id: "vp-1",
  userId: "user-1",
  name: "Dr. Smith",
  specialty: "General",
  clinicName: "PawClinic",
  city: "Berlin",
  country: "DE",
  bio: "Experienced vet",
  phone: "+49123456",
  isAcceptingClients: true,
  isVerified: true,
};

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("GET /api/vets", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
    vi.mocked(requireSession).mockResolvedValue({ session: { user: { id: "user-1" } } as any, error: null });
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      session: null,
      error: NextResponse.json({ success: false, error: "Forbidden" }, { status: 401 }),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 200 with empty array when no vets found", async () => {
    db._queueSelectResult([]); // no vet profiles
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it("returns 200 with vets and their review aggregates", async () => {
    db._queueSelectResult([MOCK_VET]); // vet profiles
    db._queueSelectResult([{ professionalId: "user-1", avgRating: "4.5", reviewCount: 10 }]); // ratings

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Dr. Smith");
    expect(body.data[0].avgRating).toBe(4.5);
    expect(body.data[0].reviewCount).toBe(10);
  });

  it("returns null avgRating when vet has no reviews", async () => {
    db._queueSelectResult([MOCK_VET]); // vet profiles
    db._queueSelectResult([]);          // no reviews

    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.data[0].avgRating).toBeNull();
    expect(body.data[0].reviewCount).toBe(0);
  });

  it("filters results by city (case-insensitive, client-side)", async () => {
    const vetBerlin = { ...MOCK_VET, city: "Berlin" };
    const vetParis  = { ...MOCK_VET, id: "vp-2", userId: "user-2", city: "Paris" };
    db._queueSelectResult([vetBerlin, vetParis]); // both returned by DB
    db._queueSelectResult([]); // no reviews

    const res = await GET(makeRequest("city=berlin")); // city filter applied client-side
    const body = await res.json();
    // Only Berlin vet should survive the filter
    expect(body.data.every((v: any) => v.city.toLowerCase().includes("berlin"))).toBe(true);
  });
});
