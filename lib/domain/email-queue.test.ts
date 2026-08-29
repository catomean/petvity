import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));

import { enqueueWelcomeSequence } from "./email-queue";
import { getInstance } from "@/lib/db";
import { WELCOME_SEQUENCE } from "@/lib/config/email-sequences";

const USER_ID = "00000000-0000-4000-8000-000000000001";

describe("enqueueWelcomeSequence", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
  });

  it("inserts exactly four rows in one batch", async () => {
    await enqueueWelcomeSequence(USER_ID, { name: "Alice", email: "alice@example.com" });

    expect(db.insert).toHaveBeenCalledTimes(1);
    const valuesCall = db.insert.mock.results[0].value.values.mock.calls[0][0];
    expect(Array.isArray(valuesCall)).toBe(true);
    expect(valuesCall).toHaveLength(4);
  });

  it("uses the four expected templateKeys in canonical order", async () => {
    await enqueueWelcomeSequence(USER_ID, { name: "Alice", email: "alice@example.com" });
    const rows = db.insert.mock.results[0].value.values.mock.calls[0][0];
    expect(rows.map((r: any) => r.templateKey)).toEqual([
      "owner_welcome",
      "owner_add_pet",
      "owner_health_tracking",
      "owner_week_one",
    ]);
  });

  it("schedules each row with the configured WELCOME_SEQUENCE delay", async () => {
    const before = Date.now();
    await enqueueWelcomeSequence(USER_ID, { name: "Alice", email: "alice@example.com" });
    const after = Date.now();

    const rows = db.insert.mock.results[0].value.values.mock.calls[0][0];
    const delaysMs = rows.map((r: any) => r.sendAt.getTime() - before);

    // Each delay must be at least the configured value (clock advanced between calls,
    // so allow up to a few ms slack on the upper bound).
    const SLACK = after - before + 5;
    expect(delaysMs[0]).toBeGreaterThanOrEqual(WELCOME_SEQUENCE.welcome);
    expect(delaysMs[0]).toBeLessThanOrEqual(WELCOME_SEQUENCE.welcome + SLACK);
    expect(delaysMs[1]).toBeGreaterThanOrEqual(WELCOME_SEQUENCE.addPet);
    expect(delaysMs[1]).toBeLessThanOrEqual(WELCOME_SEQUENCE.addPet + SLACK);
    expect(delaysMs[2]).toBeGreaterThanOrEqual(WELCOME_SEQUENCE.healthTracking);
    expect(delaysMs[3]).toBeGreaterThanOrEqual(WELCOME_SEQUENCE.weekOne);
  });

  it("propagates the payload onto every row (rendered later by the cron)", async () => {
    const payload = { name: "Alice", email: "alice@example.com" };
    await enqueueWelcomeSequence(USER_ID, payload);
    const rows = db.insert.mock.results[0].value.values.mock.calls[0][0];
    for (const row of rows) {
      expect(row.payload).toEqual(payload);
      expect(row.userId).toBe(USER_ID);
    }
  });
});
