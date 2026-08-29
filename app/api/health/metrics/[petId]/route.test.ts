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

const PET_ID = "00000000-0000-4000-8000-000000000044";

const OWNER_SESSION = {
  user: { id: "owner-1", role: "pet_owner", email: "owner@example.com", name: "Owner" },
  expires: "2099-01-01",
};

const MOCK_PET = { id: PET_ID, ownerId: "owner-1", species: "dog", name: "Buddy" };

const ROUTE_CONTEXT = { params: Promise.resolve({ petId: PET_ID }) };

function makeGetRequest(days?: number) {
  const url = days
    ? `http://localhost/api/health/metrics/${PET_ID}?days=${days}`
    : `http://localhost/api/health/metrics/${PET_ID}`;
  return new NextRequest(url, { method: "GET" });
}

function makePostRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/health/metrics/${PET_ID}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  date: "2026-04-23",
  weightGrams: 28500, // 28.5 kg stored as integer grams
  temperatureCentidegrees: 3855, // 38.55°C stored as integer centidegrees
  heartRateBpm: 80,
  energy: 4,
  mood: 4,
  anxiety: 2,
  socialization: 3,
};

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("GET /api/health/metrics/[petId]", () => {
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
    const res = await GET(makeGetRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(401);
  });

  it("returns 404 when pet does not belong to the requesting user", async () => {
    db._queryFindFirst.mockResolvedValueOnce(undefined);
    const res = await GET(makeGetRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not found");
  });

  it("returns 200 with empty array when no metrics exist", async () => {
    db._queryFindFirst.mockResolvedValueOnce(MOCK_PET);
    db._queryFindMany.mockResolvedValueOnce([]);
    const res = await GET(makeGetRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it("returns 200 with metrics for the date range", async () => {
    const mockMetric = { petId: PET_ID, date: "2026-04-23", weightGrams: 28500 };
    db._queryFindFirst.mockResolvedValueOnce(MOCK_PET);
    db._queryFindMany.mockResolvedValueOnce([mockMetric]);
    const res = await GET(makeGetRequest(30), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].weightGrams).toBe(28500);
  });
});

describe("POST /api/health/metrics/[petId]", () => {
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
    const res = await POST(makePostRequest(VALID_BODY), ROUTE_CONTEXT);
    expect(res.status).toBe(401);
  });

  it("returns 400 when date is missing", async () => {
    const { date: _, ...bodyWithoutDate } = VALID_BODY;
    const res = await POST(makePostRequest(bodyWithoutDate), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid date format", async () => {
    const res = await POST(makePostRequest({ ...VALID_BODY, date: "23/04/2026" }), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
  });

  it("returns 400 for a future date", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDate = tomorrow.toISOString().slice(0, 10);
    const res = await POST(makePostRequest({ ...VALID_BODY, date: futureDate }), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid input");
  });

  it("returns 400 when weightGrams is a float (storage convention enforced)", async () => {
    // Storage rule: weight must be integer grams, not a decimal kg value
    const res = await POST(makePostRequest({ ...VALID_BODY, weightGrams: 28.5 }), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
  });

  it("returns 400 when temperatureCentidegrees is a float (storage convention enforced)", async () => {
    // Storage rule: temperature must be integer centidegrees, not decimal °C
    const res = await POST(
      makePostRequest({ ...VALID_BODY, temperatureCentidegrees: 38.55 }),
      ROUTE_CONTEXT,
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when emotional metric is out of range (>5)", async () => {
    const res = await POST(makePostRequest({ ...VALID_BODY, energy: 6 }), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
  });

  it("returns 400 when emotional metric is out of range (<1)", async () => {
    const res = await POST(makePostRequest({ ...VALID_BODY, mood: 0 }), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
  });

  it("returns 404 when pet does not belong to the requesting user", async () => {
    db._queryFindFirst.mockResolvedValueOnce(undefined); // pet not found / not owned
    const res = await POST(makePostRequest(VALID_BODY), ROUTE_CONTEXT);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not found");
  });

  it("returns 201 on successful log with integer storage values", async () => {
    const mockRow = {
      petId: PET_ID,
      date: "2026-04-23",
      weightGrams: 28500,
      temperatureCentidegrees: 3855,
    };
    db._queryFindFirst.mockResolvedValueOnce(MOCK_PET); // pet ownership check
    db._insertReturning.mockResolvedValueOnce([mockRow]); // upsert
    db._queryFindMany.mockResolvedValueOnce([mockRow]); // recentMetrics
    db._queryFindMany.mockResolvedValueOnce([]); // vaccinations

    const res = await POST(makePostRequest(VALID_BODY), ROUTE_CONTEXT);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.weightGrams).toBe(28500);
    expect(body.data.temperatureCentidegrees).toBe(3855);
  });
});
