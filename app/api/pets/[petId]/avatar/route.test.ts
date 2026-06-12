import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/auth/guards", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));
vi.mock("@/lib/storage", () => ({
  putLocal: vi.fn().mockResolvedValue({ url: "/uploads/pets/pet-1/avatar-abc123" }),
}));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { POST } from "./route";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { putLocal } from "@/lib/storage";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const PET_ID = "00000000-0000-4000-8000-000000000042";

const OWNER_SESSION = {
  user: { id: "owner-1", role: "pet_owner", email: "owner@example.com", name: "Owner" },
  expires: "2099-01-01",
};

const MOCK_PET = { id: PET_ID, name: "Buddy", ownerId: "owner-1" };

const ROUTE_CONTEXT = { params: Promise.resolve({ petId: PET_ID }) };

function makeFormRequest(hasFile: boolean) {
  const form = new FormData();
  if (hasFile) {
    form.append("file", new File(["img"], "avatar.jpg", { type: "image/jpeg" }));
  }
  return new NextRequest(`http://localhost/api/pets/${PET_ID}/avatar`, {
    method: "POST",
    body: form,
  });
}

/* ─── Tests ──────────────────────────────────────────────────────────────── */

describe("POST /api/pets/[petId]/avatar", () => {
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

    const res = await POST(makeFormRequest(true), ROUTE_CONTEXT);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 404 when pet does not belong to the requesting user", async () => {
    db.query.pets.findFirst.mockResolvedValueOnce(null);

    const res = await POST(makeFormRequest(true), ROUTE_CONTEXT);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Not found");
  });

  it("returns 400 when no file is provided", async () => {
    db.query.pets.findFirst.mockResolvedValueOnce(MOCK_PET);

    const res = await POST(makeFormRequest(false), ROUTE_CONTEXT);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("file");
  });

  it("returns 413 when the uploaded file exceeds the size cap", async () => {
    db.query.pets.findFirst.mockResolvedValueOnce(MOCK_PET);
    const huge = new File(["x".repeat(6 * 1024 * 1024)], "big.jpg", { type: "image/jpeg" });
    const form = new FormData();
    form.append("file", huge);
    const req = new NextRequest(`http://localhost/api/pets/${PET_ID}/avatar`, { method: "POST", body: form });
    const res = await POST(req, ROUTE_CONTEXT);
    expect(res.status).toBe(413);
    expect(vi.mocked(putLocal)).not.toHaveBeenCalled();
  });

  it("returns 415 when the file type is not an accepted image format", async () => {
    db.query.pets.findFirst.mockResolvedValueOnce(MOCK_PET);
    const pdf = new File(["%PDF-1.4"], "doc.pdf", { type: "application/pdf" });
    const form = new FormData();
    form.append("file", pdf);
    const req = new NextRequest(`http://localhost/api/pets/${PET_ID}/avatar`, { method: "POST", body: form });
    const res = await POST(req, ROUTE_CONTEXT);
    expect(res.status).toBe(415);
    expect(vi.mocked(putLocal)).not.toHaveBeenCalled();
  });

  it("returns 502 with a friendly message when the upload throws", async () => {
    db.query.pets.findFirst.mockResolvedValueOnce(MOCK_PET);
    vi.mocked(putLocal).mockRejectedValueOnce(new Error("disk full"));
    const res = await POST(makeFormRequest(true), ROUTE_CONTEXT);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/try again/i);
  });

  it("returns 200 with the stored URL on success", async () => {
    db.query.pets.findFirst.mockResolvedValueOnce(MOCK_PET);
    db.update.mockReturnValueOnce({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) } as any);

    const res = await POST(makeFormRequest(true), ROUTE_CONTEXT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.url).toContain("/uploads/");
    expect(vi.mocked(putLocal)).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`^pets/${PET_ID}/avatar-`)),
      expect.any(File),
    );
  });
});
