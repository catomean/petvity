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

const MEDICATION_ID = "00000000-0000-4000-8000-000000000033";

const OWNER_SESSION = {
  user: { id: "owner-1", role: "pet_owner", email: "owner@example.com", name: "Owner" },
  expires: "2099-01-01",
};

const MOCK_MEDICATION = {
  id: MEDICATION_ID,
  petId: "pet-1",
  name: "Frontline",
  dosage: "1 pipette",
  frequency: "monthly",
  startDate: "2026-01-01",
  endDate: null,
  prescribedBy: "Dr Smith",
  status: "active",
  notes: null,
};

const ROUTE_CONTEXT = { params: Promise.resolve({ medicationId: MEDICATION_ID }) };

function makePatchRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/medications/${MEDICATION_ID}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest() {
  return new NextRequest(`http://localhost/api/medications/${MEDICATION_ID}`, { method: "DELETE" });
}

/* ─── PATCH tests ──────────────────────────────────────────────────────────── */

describe("PATCH /api/medications/[medicationId]", () => {
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
    const res = await PATCH(makePatchRequest({ name: "Advocate" }), ROUTE_CONTEXT);
    expect(res.status).toBe(401);
  });

  it("returns 404 when medication does not belong to the requesting user", async () => {
    db._queueSelectResult([]); // ownership JOIN returns empty
    const res = await PATCH(makePatchRequest({ name: "Advocate" }), ROUTE_CONTEXT);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not found");
  });

  it("returns 400 for invalid status enum value", async () => {
    db._queueSelectResult([{ record: MOCK_MEDICATION }]);
    const res = await PATCH(makePatchRequest({ status: "paused" }), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid date format", async () => {
    db._queueSelectResult([{ record: MOCK_MEDICATION }]);
    const res = await PATCH(makePatchRequest({ startDate: "2026/01/01" }), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
  });

  it("returns 200 with updated medication on success", async () => {
    db._queueSelectResult([{ record: MOCK_MEDICATION }]);
    const updated = { ...MOCK_MEDICATION, status: "completed" };
    db._updateReturning.mockResolvedValueOnce([updated]);
    const res = await PATCH(makePatchRequest({ status: "completed" }), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("completed");
  });
});

/* ─── DELETE tests ─────────────────────────────────────────────────────────── */

describe("DELETE /api/medications/[medicationId]", () => {
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

  it("returns 404 when medication does not belong to the requesting user", async () => {
    db._queueSelectResult([]); // ownership JOIN returns empty
    const res = await DELETE(makeDeleteRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not found");
  });

  it("returns 200 when owner deletes their medication", async () => {
    db._queueSelectResult([{ record: MOCK_MEDICATION }]);
    const res = await DELETE(makeDeleteRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
