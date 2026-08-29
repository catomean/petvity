import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/auth/guards", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { GET } from "./route";
import { requireAdmin } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const ADMIN_SESSION = {
  user: { id: "admin-1", role: "admin", email: "admin@example.com", name: "Admin" },
  expires: "2099-01-01",
};

const MOCK_USER_ROW = {
  id: "user-1",
  name: "Alice",
  email: "alice@example.com",
  role: "pet_owner",
  createdAt: new Date("2026-01-01"),
  petCount: 2,
};

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("GET /api/admin/users", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
    vi.mocked(requireAdmin).mockResolvedValue({ session: ADMIN_SESSION as any, error: null });
  });

  it("returns 401 when not an admin", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      session: null as any,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 200 with empty list when no users", async () => {
    db._queueSelectResult([]); // users query
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it("returns 200 with users including null isVerified for non-professionals", async () => {
    db._queueSelectResult([MOCK_USER_ROW]); // users query (pet_owner — no professional lookup needed)
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].email).toBe("alice@example.com");
    expect(body.data[0].isVerified).toBeNull();
  });

  it("returns 200 with isVerified set for veterinarian users", async () => {
    const vetRow = { ...MOCK_USER_ROW, id: "vet-1", role: "veterinarian" };
    db._queueSelectResult([vetRow]); // users query
    db._queueSelectResult([{ userId: "vet-1", isVerified: true }]); // vetProfiles
    db._queueSelectResult([]); // sitterProfiles (empty)

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].isVerified).toBe(true);
  });
});
