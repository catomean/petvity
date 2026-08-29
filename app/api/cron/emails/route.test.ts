import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { POST } from "./route";
import { getInstance } from "@/lib/db";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const CRON_SECRET = "cron-bearer-token-for-tests";

function makeRequest(secret?: string) {
  return new NextRequest("http://localhost/api/cron/emails", {
    method: "POST",
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
  });
}

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("POST /api/cron/emails", () => {
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
    const res = await POST(makeRequest("bad-secret"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with zeros when queue is empty", async () => {
    db._queueSelectResult([]); // no pending emails
    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.sent).toBe(0);
    expect(body.data.failed).toBe(0);
  });

  it("returns 200 and processes pending emails from the queue", async () => {
    const pendingItem = {
      id: "email-1",
      userId: "user-1",
      templateKey: "owner_welcome",
      payload: { name: "Alice" },
      status: "pending",
      sendAt: new Date(),
    };
    db._queueSelectResult([pendingItem]); // pending items
    db._queueSelectResult([{ id: "user-1", name: "Alice", email: "alice@example.com" }]); // users

    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.sent).toBe(1);
    expect(body.data.failed).toBe(0);
  });

  it("increments failed count when sendEmail throws", async () => {
    const { sendEmail } = await import("@/lib/email");
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("SMTP error"));

    const pendingItem = {
      id: "email-2",
      userId: "user-1",
      templateKey: "owner_welcome",
      payload: { name: "Bob" },
      status: "pending",
      sendAt: new Date(),
    };
    db._queueSelectResult([pendingItem]);
    db._queueSelectResult([{ id: "user-1", name: "Bob", email: "bob@example.com" }]);

    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.sent).toBe(0);
    expect(body.data.failed).toBe(1);
  });

  it("skips items with unknown templateKey", async () => {
    const pendingItem = {
      id: "email-3",
      userId: "user-1",
      templateKey: "nonexistent_template",
      payload: {},
      status: "pending",
      sendAt: new Date(),
    };
    db._queueSelectResult([pendingItem]);
    db._queueSelectResult([{ id: "user-1", name: "Carol", email: "carol@example.com" }]);

    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    // Unknown template skipped — neither sent nor failed
    expect(body.data.sent).toBe(0);
    expect(body.data.failed).toBe(0);
  });
});
