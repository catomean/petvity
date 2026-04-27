import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));

import {
  getHealthRecordForOwner,
  getVaccinationForOwner,
  getMedicationForOwner,
} from "./ownership";
import { getInstance } from "@/lib/db";

const USER_ID = "owner-1";
const RECORD_ID = "record-1";

const FAKE_RECORD = { id: RECORD_ID, petId: "pet-1", title: "Annual checkup" };

beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * The mock db's select() returns a chain whose await resolves to the queued
 * select-result. The route does:
 *   const [row] = await db.select(...).from(...).innerJoin(...).where(...).limit(1);
 *   return row?.record ?? null;
 *
 * The INNER JOIN on (pet.id == row.petId AND pet.ownerId == userId) is what
 * enforces ownership in production. The mock can't enforce that — these tests
 * pin down the *shape contract* instead: when the JOIN matches, we return the
 * record; when it doesn't (empty result), we return null. Combined with the
 * route's reliance on this helper, that's the load-bearing guarantee.
 */
const HELPERS = [
  { name: "getHealthRecordForOwner", fn: getHealthRecordForOwner },
  { name: "getVaccinationForOwner",  fn: getVaccinationForOwner  },
  { name: "getMedicationForOwner",   fn: getMedicationForOwner   },
];

describe("ownership helpers", () => {
  for (const { name, fn } of HELPERS) {
    describe(name, () => {
      it("returns the record when the JOIN matches (ownership confirmed)", async () => {
        const db = makeMockDb();
        vi.mocked(getInstance).mockReturnValue(db as any);
        db._queueSelectResult([{ record: FAKE_RECORD }]);

        const result = await fn(RECORD_ID, USER_ID);
        expect(result).toEqual(FAKE_RECORD);
      });

      it("returns null when the row doesn't exist or doesn't belong to the user", async () => {
        const db = makeMockDb();
        vi.mocked(getInstance).mockReturnValue(db as any);
        db._queueSelectResult([]); // empty join result

        const result = await fn(RECORD_ID, USER_ID);
        expect(result).toBeNull();
      });

      it("returns null when the join produces a row with no record key (defense)", async () => {
        const db = makeMockDb();
        vi.mocked(getInstance).mockReturnValue(db as any);
        // @ts-expect-error — simulating a malformed projection
        db._queueSelectResult([{}]);

        const result = await fn(RECORD_ID, USER_ID);
        expect(result).toBeNull();
      });
    });
  }
});
