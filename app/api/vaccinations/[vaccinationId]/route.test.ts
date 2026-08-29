import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/auth/guards", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { PATCH, DELETE } from "./route";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const VACCINATION_ID = "00000000-0000-4000-8000-000000000022";

const OWNER_SESSION = {
  user: { id: "owner-1", role: "pet_owner", email: "owner@example.com", name: "Owner" },
  expires: "2099-01-01",
};

const MOCK_VACCINATION = {
  id: VACCINATION_ID,
  petId: "pet-1",
  name: "Rabies",
  administeredDate: "2026-01-10",
  nextDueDate: "2027-01-10",
  status: "up_to_date",
  batchNumber: null,
  vetName: "Dr Lee",
  notes: null,
};

const ROUTE_CONTEXT = { params: Promise.resolve({ vaccinationId: VACCINATION_ID }) };

function makePatchRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/vaccinations/${VACCINATION_ID}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest() {
  return new NextRequest(`http://localhost/api/vaccinations/${VACCINATION_ID}`, {
    method: "DELETE",
  });
}

/* ─── PATCH tests ──────────────────────────────────────────────────────────── */

describe("PATCH /api/vaccinations/[vaccinationId]", () => {
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
    const res = await PATCH(makePatchRequest({ name: "DHPP" }), ROUTE_CONTEXT);
    expect(res.status).toBe(401);
  });

  it("returns 404 when vaccination does not belong to the requesting user", async () => {
    db._queueSelectResult([]); // ownership JOIN returns empty
    const res = await PATCH(makePatchRequest({ name: "DHPP" }), ROUTE_CONTEXT);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not found");
  });

  it("returns 400 for invalid status enum value", async () => {
    db._queueSelectResult([{ record: MOCK_VACCINATION }]);
    const res = await PATCH(makePatchRequest({ status: "bad_status" }), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid date format", async () => {
    db._queueSelectResult([{ record: MOCK_VACCINATION }]);
    const res = await PATCH(makePatchRequest({ administeredDate: "01/10/2026" }), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
  });

  it("returns 200 with updated vaccination on success", async () => {
    db._queueSelectResult([{ record: MOCK_VACCINATION }]);
    const updated = { ...MOCK_VACCINATION, status: "overdue" };
    db._updateReturning.mockResolvedValueOnce([updated]);
    const res = await PATCH(makePatchRequest({ status: "overdue" }), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("overdue");
  });
});

/* ─── DELETE tests ─────────────────────────────────────────────────────────── */

describe("DELETE /api/vaccinations/[vaccinationId]", () => {
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
    const res = await DELETE(makeDeleteRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(401);
  });

  it("returns 404 when vaccination does not belong to the requesting user", async () => {
    db._queueSelectResult([]); // ownership JOIN returns empty
    const res = await DELETE(makeDeleteRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not found");
  });

  it("returns 200 when owner deletes their vaccination", async () => {
    db._queueSelectResult([{ record: MOCK_VACCINATION }]);
    const res = await DELETE(makeDeleteRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
