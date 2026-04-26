import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireSession: vi.fn() }));

import { PATCH } from "./route";
import { getInstance } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";

const MOCK_SESSION = {
  user: { id: "user-1", role: "pet_owner", email: "user@example.com", name: "Test" },
  expires: "2099-01-01",
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/account/locale", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/account/locale", () => {
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
    const res = await PATCH(makeRequest({ locale: "de" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when locale is missing", async () => {
    const res = await PATCH(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 when locale is not in routing.locales", async () => {
    const res = await PATCH(makeRequest({ locale: "xx" }));
    expect(res.status).toBe(400);
  });

  it("accepts a valid locale and returns success", async () => {
    const res = await PATCH(makeRequest({ locale: "ja" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });

  it("accepts every locale in routing.locales", async () => {
    const { routing } = await import("@/i18n/routing");
    for (const locale of routing.locales) {
      const res = await PATCH(makeRequest({ locale }));
      expect(res.status, `locale "${locale}" should be accepted`).toBe(200);
    }
  });
});
