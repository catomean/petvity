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

const RECORD_ID = "00000000-0000-4000-8000-000000000011";

const OWNER_SESSION = {
  user: { id: "owner-1", role: "pet_owner", email: "owner@example.com", name: "Owner" },
  expires: "2099-01-01",
};

const MOCK_RECORD = {
  id: RECORD_ID, petId: "pet-1", type: "vet_visit", title: "Annual checkup",
  date: "2026-01-15", vetName: "Dr Jones", clinic: "City Vet", notes: null,
};

const ROUTE_CONTEXT = { params: Promise.resolve({ recordId: RECORD_ID }) };

function makePatchRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/health/records/${RECORD_ID}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest() {
  return new NextRequest(`http://localhost/api/health/records/${RECORD_ID}`, { method: "DELETE" });
}

/* ─── PATCH tests ──────────────────────────────────────────────────────────── */

describe("PATCH /api/health/records/[recordId]", () => {
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
    const res = await PATCH(makePatchRequest({ title: "Updated" }), ROUTE_CONTEXT);
    expect(res.status).toBe(401);
  });

  it("returns 404 when record does not belong to the requesting user", async () => {
    db._queueSelectResult([]); // ownership JOIN returns empty
    const res = await PATCH(makePatchRequest({ title: "Updated" }), ROUTE_CONTEXT);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not found");
  });

  it("returns 400 for invalid field (title too long)", async () => {
    db._queueSelectResult([{ record: MOCK_RECORD }]);
    const res = await PATCH(makePatchRequest({ title: "x".repeat(201) }), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid type enum value", async () => {
    db._queueSelectResult([{ record: MOCK_RECORD }]);
    const res = await PATCH(makePatchRequest({ type: "invalid_type" }), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
  });

  it("returns 200 with updated record on success", async () => {
    db._queueSelectResult([{ record: MOCK_RECORD }]);
    const updated = { ...MOCK_RECORD, title: "Updated checkup" };
    db._updateReturning.mockResolvedValueOnce([updated]);
    const res = await PATCH(makePatchRequest({ title: "Updated checkup" }), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe("Updated checkup");
  });
});

/* ─── DELETE tests ─────────────────────────────────────────────────────────── */

describe("DELETE /api/health/records/[recordId]", () => {
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

  it("returns 404 when record does not belong to the requesting user", async () => {
    db._queueSelectResult([]); // ownership JOIN returns empty
    const res = await DELETE(makeDeleteRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not found");
  });

  it("returns 200 when owner deletes their record", async () => {
    db._queueSelectResult([{ record: MOCK_RECORD }]);
    const res = await DELETE(makeDeleteRequest(), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
