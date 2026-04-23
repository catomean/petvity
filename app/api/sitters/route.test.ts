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
  return new NextRequest(`http://localhost/api/sitters${query ? `?${query}` : ""}`);
}

const MOCK_SITTER = {
  id: "sp-1",
  userId: "user-1",
  name: "Jane Sitter",
  bio: "Loves dogs",
  services: "walking,boarding",
  pricePerDay: 3500, // cents
  city: "Munich",
  country: "DE",
  phone: "+49999",
  isAcceptingClients: true,
  isVerified: false,
};

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("GET /api/sitters", () => {
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

  it("returns 200 with empty array when no sitters found", async () => {
    db._queueSelectResult([]);
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it("returns 200 with sitters and review aggregates", async () => {
    db._queueSelectResult([MOCK_SITTER]);
    db._queueSelectResult([{ professionalId: "user-1", avgRating: "4.8", reviewCount: 5 }]);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Jane Sitter");
    expect(body.data[0].pricePerDay).toBe(3500);
    expect(body.data[0].avgRating).toBe(4.8);
    expect(body.data[0].reviewCount).toBe(5);
  });

  it("returns null avgRating when sitter has no reviews", async () => {
    db._queueSelectResult([MOCK_SITTER]);
    db._queueSelectResult([]);

    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.data[0].avgRating).toBeNull();
    expect(body.data[0].reviewCount).toBe(0);
  });

  it("filters by city (case-insensitive, client-side)", async () => {
    const sitterMunich  = { ...MOCK_SITTER };
    const sitterHamburg = { ...MOCK_SITTER, id: "sp-2", userId: "user-2", city: "Hamburg" };
    db._queueSelectResult([sitterMunich, sitterHamburg]);
    db._queueSelectResult([]); // no reviews

    const res = await GET(makeRequest("city=munich"));
    const body = await res.json();
    expect(body.data.every((s: any) => s.city.toLowerCase().includes("munich"))).toBe(true);
  });
});
