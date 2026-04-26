import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireSession: vi.fn() }));

import { GET } from "./route";
import { getInstance } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";

const USER_ID = "00000000-0000-4000-8000-000000000001";
const PET_ID = "00000000-0000-4000-8000-0000000000aa";

const MOCK_SESSION = {
  user: { id: USER_ID, role: "pet_owner", email: "owner@example.com", name: "Owner" },
  expires: "2099-01-01",
};

describe("GET /api/account/export", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
    vi.mocked(requireSession).mockResolvedValue({ session: MOCK_SESSION as any, error: null });
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      session: null as any,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 404 when account row is gone", async () => {
    db._queueSelectResult([]); // user lookup empty
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns a JSON download with all expected sections", async () => {
    // Order matches the await Promise.all() sequence in route.ts:
    // 1. user lookup, 2. pets, 3. metrics, 4. records, 5. vaccinations,
    // 6. medications, 7. signalHistory, 8. bookings, 9. reviews, 10. orders,
    // 11. listed products, 12. adoption listings, 13. applications,
    // 14. order items
    const userRow = {
      id: USER_ID, name: "Owner", email: "owner@example.com", role: "pet_owner",
      locale: "en", digestOptOut: false, createdAt: new Date(),
    };
    db._queueSelectResult([userRow]);
    db._queueSelectResult([{ id: PET_ID, ownerId: USER_ID, name: "Luna" }]); // pets
    db._queueSelectResult([{ id: "m1", petId: PET_ID, weightGrams: 4500 }]); // metrics
    db._queueSelectResult([]);                                               // records
    db._queueSelectResult([]);                                               // vaccinations
    db._queueSelectResult([]);                                               // medications
    db._queueSelectResult([]);                                               // signalHistory
    db._queueSelectResult([]);                                               // bookings
    db._queueSelectResult([]);                                               // reviews
    db._queueSelectResult([{ id: "o1", userId: USER_ID, totalCents: 1000 }]); // orders
    db._queueSelectResult([]);                                               // products listed
    db._queueSelectResult([]);                                               // adoption listings
    db._queueSelectResult([]);                                               // applications
    db._queueSelectResult([{ id: "i1", orderId: "o1", productId: "p1", quantity: 1 }]); // order items

    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(res.headers.get("content-disposition")).toMatch(/attachment; filename="petvity-export-/);
    expect(res.headers.get("cache-control")).toBe("private, no-store");

    const body = await res.json();
    expect(body.schemaVersion).toBe(1);
    expect(body.account.id).toBe(USER_ID);
    expect(body.pets).toHaveLength(1);
    expect(body.healthMetrics).toHaveLength(1);
    expect(body.orders).toHaveLength(1);
    expect(body.orderItems).toHaveLength(1);
  });

  it("never includes the password hash in the account section", async () => {
    const userRow = {
      id: USER_ID, name: "Owner", email: "owner@example.com", role: "pet_owner",
      locale: null, digestOptOut: false, createdAt: new Date(),
    };
    db._queueSelectResult([userRow]);
    // No pets — skip the dependent queries (route checks petIds.length and uses [] inline)
    db._queueSelectResult([]); // pets
    // The remaining 6 unconditional queries (bookings, reviews, orders, products, listings, applications)
    db._queueSelectResult([]); db._queueSelectResult([]); db._queueSelectResult([]);
    db._queueSelectResult([]); db._queueSelectResult([]); db._queueSelectResult([]);

    const res = await GET();
    const body = await res.json();
    expect(body.account).not.toHaveProperty("password");
  });
});
