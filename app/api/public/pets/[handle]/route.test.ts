import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { GET } from "./route";
import { getInstance } from "@/lib/db";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function makeRequest(handle: string) {
  return new NextRequest(`http://localhost/api/public/pets/${handle}`);
}

function makeParams(handle: string) {
  return { params: Promise.resolve({ handle }) };
}

const MOCK_PUBLIC_PET = {
  id: "pet-1",
  name: "Buddy",
  species: "dog",
  breed: "Golden Retriever",
  birthDate: "2021-03-15",
  sex: "male",
  bio: "Loves playing fetch",
  avatarUrl: "https://example.com/buddy.jpg",
  handle: "buddy-the-dog",
  isPublic: true,
  ownerId: "owner-1", // present in DB row but should NOT be exposed
  lastKnownSignal: "healthy", // should NOT be exposed
};

/* ─── Tests ────────────────────────────────────────────────────────────────── */

describe("GET /api/public/pets/[handle]", () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);
  });

  it("returns 404 when pet not found or is private", async () => {
    db._queryFindFirst.mockResolvedValueOnce(undefined);
    const res = await GET(makeRequest("unknown-handle"), makeParams("unknown-handle"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 200 with public pet data", async () => {
    db._queryFindFirst.mockResolvedValueOnce(MOCK_PUBLIC_PET);
    const res = await GET(makeRequest("buddy-the-dog"), makeParams("buddy-the-dog"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("Buddy");
    expect(body.data.handle).toBe("buddy-the-dog");
    expect(body.data.species).toBe("dog");
    expect(body.data.breed).toBe("Golden Retriever");
  });

  it("does not expose private fields (ownerId, lastKnownSignal)", async () => {
    db._queryFindFirst.mockResolvedValueOnce(MOCK_PUBLIC_PET);
    const res = await GET(makeRequest("buddy-the-dog"), makeParams("buddy-the-dog"));
    const body = await res.json();
    expect(body.data.ownerId).toBeUndefined();
    expect(body.data.lastKnownSignal).toBeUndefined();
  });
});
