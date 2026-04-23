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

const MOCK_PET = { id: PET_ID, ownerId: "owner-1", name: "Buddy", species: "dog" };

const MOCK_RECORD = {
  id: "record-1", petId: PET_ID, type: "vet_visit", title: "Annual checkup",
  date: "2026-01-15", vetName: "Dr Jones", clinic: "City Vet", notes: null,
};

function makeGetRequest(petId?: string) {
  const url = petId
    ? `http://localhost/api/health/records?petId=${petId}`
    : "http://localhost/api/health/records";
  return new NextRequest(url, { method: "GET" });
}

function makePostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/health/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  petId: PET_ID, type: "vet_visit", title: "Annual checkup", date: "2026-04-23",
};

/* ─── GET tests ────────────────────────────────────────────────────────────── */

describe("GET /api/health/records", () => {
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
    const res = await GET(makeGetRequest(PET_ID));
    expect(res.status).toBe(401);
  });

  it("returns 400 when petId is missing", async () => {
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(400);
  });

  it("returns 404 when pet does not belong to user", async () => {
    db._queryFindFirst.mockResolvedValueOnce(undefined); // pet not found for owner
    const res = await GET(makeGetRequest(PET_ID));
    expect(res.status).toBe(404);
  });

  it("returns 200 with records list", async () => {
    db._queryFindFirst.mockResolvedValueOnce(MOCK_PET);
    db._queryFindMany.mockResolvedValueOnce([MOCK_RECORD]);
    const res = await GET(makeGetRequest(PET_ID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe("Annual checkup");
  });
});

/* ─── POST tests ───────────────────────────────────────────────────────────── */

describe("POST /api/health/records", () => {
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

  it("returns 400 for invalid type enum", async () => {
    const res = await POST(makePostRequest({ ...VALID_BODY, type: "checkup" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid date format", async () => {
    const res = await POST(makePostRequest({ ...VALID_BODY, date: "04/23/2026" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when title is missing", async () => {
    const { title: _omit, ...bodyWithoutTitle } = VALID_BODY;
    const res = await POST(makePostRequest(bodyWithoutTitle));
    expect(res.status).toBe(400);
  });

  it("returns 404 when pet does not belong to user", async () => {
    db._queryFindFirst.mockResolvedValueOnce(undefined);
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(404);
  });

  it("returns 201 when record is created successfully", async () => {
    db._queryFindFirst.mockResolvedValueOnce(MOCK_PET);
    db._insertReturning.mockResolvedValueOnce([MOCK_RECORD]);
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe("Annual checkup");
  });
});
