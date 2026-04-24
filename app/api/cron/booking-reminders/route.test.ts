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
  return new NextRequest("http://localhost/api/cron/booking-reminders", {
    method: "POST",
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
  });
}

function tomorrowDate() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(9, 0, 0, 0); // 9am UTC — within tomorrow's window
  return d;
}

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("POST /api/cron/booking-reminders", () => {
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

  it("returns 200 with zeros when no confirmed bookings tomorrow", async () => {
    db._queueSelectResult([]);
    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.checked).toBe(0);
    expect(body.data.sent).toBe(0);
  });

  it("returns 200 and sends reminder for confirmed booking tomorrow", async () => {
    const upcomingRow = {
      bookingId: "booking-1",
      petName: "Buddy",
      petId: "pet-1",
      startDate: tomorrowDate(),
      ownerName: "Alice",
      ownerEmail: "alice@example.com",
      professionalName: "Dr. Smith",
    };
    db._queueSelectResult([upcomingRow]);

    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.checked).toBe(1);
    expect(body.data.sent).toBe(1);
  });

  it("skips rows with null ownerEmail", async () => {
    const rowNoEmail = {
      bookingId: "booking-2",
      petName: "Max",
      petId: "pet-2",
      startDate: tomorrowDate(),
      ownerName: "Bob",
      ownerEmail: null,
      professionalName: "Dr. Jones",
    };
    db._queueSelectResult([rowNoEmail]);

    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.checked).toBe(1);
    expect(body.data.sent).toBe(0);
  });
});
