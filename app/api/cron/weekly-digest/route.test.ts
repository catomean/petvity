import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn().mockResolvedValue({ sent: true }) }));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { POST } from "./route";
import { getInstance } from "@/lib/db";
import { sendEmail } from "@/lib/email";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const CRON_SECRET = "digest-test-secret";

function makeRequest(secret?: string) {
  return new NextRequest("http://localhost/api/cron/weekly-digest", {
    method: "POST",
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
  });
}

function makeRow(overrides: Partial<{
  userId: string;
  userName: string;
  userEmail: string | null;
  userLocale: string | null;
  petId: string;
  petName: string;
  petSignal: string | null;
}> = {}) {
  return {
    userId: "user-1",
    userName: "Alice",
    userEmail: "alice@example.com",
    userLocale: "en",
    petId: "pet-1",
    petName: "Buddy",
    petSignal: "healthy",
    ...overrides,
  };
}

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("POST /api/cron/weekly-digest", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", CRON_SECRET);
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
  });

  it("returns 401 when Authorization header is missing", async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 401 when CRON_SECRET does not match", async () => {
    const res = await POST(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with sent:0 when no opted-in users have pets", async () => {
    db._queueSelectResult([]);
    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.sent).toBe(0);
  });

  it("sends one email for a user with one pet", async () => {
    db._queueSelectResult([makeRow()]);
    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.sent).toBe(1);
    expect(vi.mocked(sendEmail)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sendEmail)).toHaveBeenCalledWith(
      expect.objectContaining({ to: "alice@example.com" }),
    );
  });

  it("sends ONE email per owner even when they have multiple pets", async () => {
    // Two rows for same user (two pets), should produce one email
    db._queueSelectResult([
      makeRow({ petId: "pet-1", petName: "Buddy", petSignal: "healthy" }),
      makeRow({ petId: "pet-2", petName: "Max",   petSignal: "watch" }),
    ]);
    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.sent).toBe(1);
    expect(vi.mocked(sendEmail)).toHaveBeenCalledTimes(1);
  });

  it("sends separate emails for different owners", async () => {
    db._queueSelectResult([
      makeRow({ userId: "user-1", userEmail: "alice@example.com", petId: "pet-1" }),
      makeRow({ userId: "user-2", userEmail: "bob@example.com",   petId: "pet-2" }),
    ]);
    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.sent).toBe(2);
    expect(vi.mocked(sendEmail)).toHaveBeenCalledTimes(2);
  });

  it("skips owners with null email", async () => {
    db._queueSelectResult([makeRow({ userEmail: null })]);
    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.sent).toBe(0);
    expect(vi.mocked(sendEmail)).not.toHaveBeenCalled();
  });

  it("is non-fatal — continues to next owner when sendEmail throws", async () => {
    vi.mocked(sendEmail)
      .mockRejectedValueOnce(new Error("SMTP error"))
      .mockResolvedValueOnce({ sent: true });

    db._queueSelectResult([
      makeRow({ userId: "user-1", userEmail: "alice@example.com", petId: "pet-1" }),
      makeRow({ userId: "user-2", userEmail: "bob@example.com",   petId: "pet-2" }),
    ]);

    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    // First send fails, second succeeds → 1 sent
    expect(body.data.sent).toBe(1);
  });

  it("defaults to 'watch' signal when petSignal is null", async () => {
    db._queueSelectResult([makeRow({ petSignal: null })]);
    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    expect(vi.mocked(sendEmail)).toHaveBeenCalledTimes(1);
  });
});
