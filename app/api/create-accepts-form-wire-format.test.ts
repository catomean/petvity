/**
 * Create routes must accept the exact wire format the portal forms send.
 *
 * Every form's buildBody serializes empty optional inputs as `null`
 * (`form.notes.trim() || null`), not by omitting the key. A zod schema that
 * models optionals as `.optional()` alone rejects `null` — which shipped as
 * "every vaccination/medication/record save fails with 400" while unit tests
 * stayed green (they omitted the keys). These tests post the real UI payload,
 * nulls included, and require the route to accept it.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { makeMockDb, type MockDb } from "@/lib/test-helpers/db-mock";

vi.mock("@/lib/auth/guards", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));
vi.mock("@/lib/api/signal-cache", () => ({ refreshSignalCache: vi.fn() }));

import { POST as postVaccination } from "@/app/api/vaccinations/route";
import { POST as postMedication } from "@/app/api/medications/route";
import { POST as postRecord } from "@/app/api/health/records/route";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";

const USER_ID = "owner-user-a";
const PET_ID = "00000000-0000-4000-8000-0000000000aa";

const SESSION = {
  user: { id: USER_ID, role: "pet_owner", email: "a@example.com", name: "User A" },
  expires: "2099-01-01",
};

function makeRequest(path: string, body: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

let db: MockDb;

beforeEach(() => {
  vi.clearAllMocks();
  db = makeMockDb();
  vi.mocked(getInstance).mockReturnValue(db as never);
  vi.mocked(requireSession).mockResolvedValue({ session: SESSION, error: undefined } as never);
  // Route looks up the pet to verify ownership — return an owned pet.
  db._queryFindFirst.mockResolvedValue({ id: PET_ID, ownerId: USER_ID });
  db._insertReturning.mockResolvedValue([{ id: "new-row" }]);
});

describe("POST /api/vaccinations — UI wire format", () => {
  it("accepts empty optionals sent as null (buildBody `|| null`)", async () => {
    const res = await postVaccination(
      makeRequest("/api/vaccinations", {
        petId: PET_ID,
        name: "Rabies",
        administeredDate: "2026-07-01",
        nextDueDate: null,
        vetName: null,
        batchNumber: null,
        status: "up_to_date",
        notes: null,
      }),
    );
    expect(res.status).toBe(201);
  });

  it("still accepts filled optionals", async () => {
    const res = await postVaccination(
      makeRequest("/api/vaccinations", {
        petId: PET_ID,
        name: "Rabies",
        administeredDate: "2026-07-01",
        nextDueDate: "2027-07-01",
        vetName: "Dr. Vogel",
        batchNumber: "B-123",
        status: "up_to_date",
        notes: "No reaction",
      }),
    );
    expect(res.status).toBe(201);
  });
});

describe("POST /api/medications — UI wire format", () => {
  it("accepts empty optionals sent as null", async () => {
    const res = await postMedication(
      makeRequest("/api/medications", {
        petId: PET_ID,
        name: "Carprofen",
        dosage: null,
        frequency: null,
        startDate: "2026-08-01",
        endDate: null,
        prescribedBy: null,
        status: "active",
        notes: null,
      }),
    );
    expect(res.status).toBe(201);
  });
});

describe("POST /api/health/records — UI wire format", () => {
  it("accepts empty optionals sent as null", async () => {
    const res = await postRecord(
      makeRequest("/api/health/records", {
        petId: PET_ID,
        type: "vet_visit",
        date: "2026-08-05",
        title: "Annual wellness exam",
        vetName: null,
        clinic: null,
        notes: null,
      }),
    );
    expect(res.status).toBe(201);
  });
});
