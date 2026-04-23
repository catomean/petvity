import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireAdmin: vi.fn() }));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { GET } from "./route";
import { getInstance } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("GET /api/admin/adoptions", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
    vi.mocked(requireAdmin).mockResolvedValue({ session: { user: { id: "admin-1", role: "admin" } } as any, error: null });
  });

  it("returns 401 when not admin", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce({
      session: null,
      error: NextResponse.json({ success: false, error: "Forbidden" }, { status: 401 }),
    });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 200 with empty array when no listings", async () => {
    db._queueSelectResult([]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it("returns 200 with listings including pet, owner, and counts", async () => {
    const row = {
      id: "listing-1",
      status: "available",
      title: "Golden Retriever needs home",
      location: "Berlin",
      feeCents: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      pet: { id: "pet-1", name: "Buddy", species: "dog", avatarUrl: null },
      owner: { id: "owner-1", name: "Alice", email: "alice@example.com" },
      applicationCount: 3,
      pendingCount: 1,
    };
    db._queueSelectResult([row]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe("Golden Retriever needs home");
    expect(body.data[0].applicationCount).toBe(3);
    expect(body.data[0].pendingCount).toBe(1);
    expect(body.data[0].pet.name).toBe("Buddy");
    expect(body.data[0].owner.email).toBe("alice@example.com");
  });

  it("returns multiple listings ordered by createdAt desc", async () => {
    const rows = [
      { id: "listing-2", status: "available", title: "Cat listing", location: "Paris", feeCents: null,
        createdAt: new Date(), updatedAt: new Date(),
        pet: { id: "pet-2", name: "Whiskers", species: "cat", avatarUrl: null },
        owner: { id: "owner-2", name: "Bob", email: "bob@example.com" },
        applicationCount: 0, pendingCount: 0 },
      { id: "listing-1", status: "closed", title: "Dog listing", location: "Berlin", feeCents: 5000,
        createdAt: new Date(Date.now() - 86400000), updatedAt: new Date(),
        pet: { id: "pet-1", name: "Rex", species: "dog", avatarUrl: null },
        owner: { id: "owner-1", name: "Alice", email: "alice@example.com" },
        applicationCount: 2, pendingCount: 0 },
    ];
    db._queueSelectResult(rows);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
  });
});
