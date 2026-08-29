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
  return new NextRequest("http://localhost/api/cron/vaccination-reminders", {
    method: "POST",
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
  });
}

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("POST /api/cron/vaccination-reminders", () => {
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

  it("returns 200 with zeros when no vaccinations are due soon", async () => {
    db._queueSelectResult([]); // no due-soon vaccinations
    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.checked).toBe(0);
    expect(body.data.sent).toBe(0);
  });

  it("returns 200 and sends reminders for due-soon vaccinations", async () => {
    const soonDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const dueSoonRow = {
      vaccinationId: "vacc-1",
      vaccinationName: "Rabies",
      nextDueDate: soonDate,
      petId: "pet-1",
      petName: "Buddy",
      ownerName: "Owner",
      ownerEmail: "owner@example.com",
    };
    db._queueSelectResult([dueSoonRow]);

    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.checked).toBe(1);
    expect(body.data.sent).toBe(1);
  });

  it("skips rows with null ownerEmail", async () => {
    const soonDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const rowNoEmail = {
      vaccinationId: "vacc-2",
      vaccinationName: "DHPP",
      nextDueDate: soonDate,
      petId: "pet-2",
      petName: "Max",
      ownerName: "Owner",
      ownerEmail: null, // no email
    };
    db._queueSelectResult([rowNoEmail]);

    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.checked).toBe(1);
    expect(body.data.sent).toBe(0); // skipped due to null email
  });
});
