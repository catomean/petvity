import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireSession: vi.fn() }));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { GET, POST } from "./route";
import { getInstance } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function makeGetRequest(query?: string) {
  return new NextRequest(`http://localhost/api/products${query ? `?${query}` : ""}`);
}

function makePostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const MOCK_PRODUCT = {
  id: "prod-1",
  name: "Dog Food Premium",
  description: "High quality dog food",
  priceCents: 2999,
  stock: 50,
  imageUrl: null,
  category: "food",
  isActive: true,
};

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("GET /api/products", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
  });

  it("returns 200 with empty array when no products", async () => {
    db._queueSelectResult([]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it("returns 200 with active products", async () => {
    db._queueSelectResult([MOCK_PRODUCT]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Dog Food Premium");
  });

  it("filters by category when category query param provided", async () => {
    db._queueSelectResult([MOCK_PRODUCT]); // filtered result from DB
    const res = await GET(makeGetRequest("category=food"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });
});

describe("POST /api/products", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
    vi.mocked(requireSession).mockResolvedValue({ session: { user: { id: "user-1", role: "pet_owner" } } as any, error: null });
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      session: null as any,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    });
    const res = await POST(makePostRequest({ name: "Food", priceCents: 999 }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when required fields missing", async () => {
    const res = await POST(makePostRequest({ description: "No name or price" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when priceCents is not an integer", async () => {
    const res = await POST(makePostRequest({ name: "Food", priceCents: 9.99 }));
    expect(res.status).toBe(400);
  });

  it("returns 201 when product created successfully", async () => {
    db._insertReturning.mockResolvedValueOnce([MOCK_PRODUCT]);
    const res = await POST(makePostRequest({ name: "Dog Food Premium", priceCents: 2999 }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("Dog Food Premium");
  });
});
