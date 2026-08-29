import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));

import { refreshSignalCache } from "./signal-cache";
import { getInstance } from "@/lib/db";

const PET_ID = "pet-uuid-1";
const NOW = new Date("2026-04-27T10:00:00Z");

/** Minimal pet row — only the fields refreshSignalCache reads */
function makePet(overrides: { lastKnownSignal?: string; species?: string } = {}) {
  return {
    id: PET_ID,
    ownerId: "owner-1",
    name: "Buddy",
    species: overrides.species ?? "dog",
    lastKnownSignal: overrides.lastKnownSignal ?? null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("refreshSignalCache", () => {
  it("returns early without DB writes when the pet does not exist", async () => {
    const db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);

    db._queryFindFirst.mockResolvedValueOnce(undefined); // pet not found
    db._queryFindMany
      .mockResolvedValueOnce([]) // metrics
      .mockResolvedValueOnce([]); // vaccinations

    await refreshSignalCache(PET_ID, NOW);

    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it("updates lastKnownSignal when signal is unchanged (no history row)", async () => {
    const db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);

    // Pet already has "watch"; no recent metrics → computePetSignal returns "watch"
    db._queryFindFirst.mockResolvedValueOnce(makePet({ lastKnownSignal: "watch" }));
    db._queryFindMany
      .mockResolvedValueOnce([]) // no metrics in window
      .mockResolvedValueOnce([]); // no vaccinations

    await refreshSignalCache(PET_ID, NOW);

    // Signal unchanged → no history insert
    expect(db.insert).not.toHaveBeenCalled();
    // But cache must still be updated
    expect(db.update).toHaveBeenCalled();
  });

  it("inserts a history row when the signal changes from null to watch", async () => {
    const db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);

    db._queryFindFirst.mockResolvedValueOnce(makePet()); // lastKnownSignal defaults to null
    db._queryFindMany
      .mockResolvedValueOnce([]) // no metrics → "watch"
      .mockResolvedValueOnce([]); // no vaccinations

    await refreshSignalCache(PET_ID, NOW);

    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it("inserts a history row when signal transitions from healthy to watch", async () => {
    const db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);

    // Previously healthy; no fresh metrics → now "watch"
    db._queryFindFirst.mockResolvedValueOnce(makePet({ lastKnownSignal: "healthy" }));
    db._queryFindMany
      .mockResolvedValueOnce([]) // no recent metrics
      .mockResolvedValueOnce([]); // no vaccinations

    await refreshSignalCache(PET_ID, NOW);

    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it("computes healthy signal and updates cache when recent in-range metrics exist", async () => {
    const db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);

    const todayStr = NOW.toISOString().slice(0, 10);

    // Dog with a full set of normal metrics logged today → signal = "healthy"
    const dogMetric = {
      petId: PET_ID,
      date: todayStr,
      weightGrams: 10000, // 10 kg — normal for a dog
      temperatureCentidegrees: 3850, // 38.5°C — normal
      heartRateBpm: 80,
      energy: 3,
      mood: 3,
      anxiety: 2,
      socialization: 3,
    };

    db._queryFindFirst.mockResolvedValueOnce(makePet({ lastKnownSignal: "watch" }));
    db._queryFindMany
      .mockResolvedValueOnce([dogMetric]) // one recent metric
      .mockResolvedValueOnce([]); // no overdue vaccinations

    await refreshSignalCache(PET_ID, NOW);

    // Signal changed watch → healthy, so a history row must be written
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it("does not insert a history row when signal is unchanged at healthy", async () => {
    const db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);

    const todayStr = NOW.toISOString().slice(0, 10);
    const dogMetric = {
      petId: PET_ID,
      date: todayStr,
      weightGrams: 10000,
      temperatureCentidegrees: 3850,
      heartRateBpm: 80,
      energy: 3,
      mood: 3,
      anxiety: 2,
      socialization: 3,
    };

    // Already healthy
    db._queryFindFirst.mockResolvedValueOnce(makePet({ lastKnownSignal: "healthy" }));
    db._queryFindMany.mockResolvedValueOnce([dogMetric]).mockResolvedValueOnce([]);

    await refreshSignalCache(PET_ID, NOW);

    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it("still updates the cache even when the history insert throws", async () => {
    const db = makeMockDb();
    vi.mocked(getInstance).mockReturnValue(db as any);

    db._queryFindFirst.mockResolvedValueOnce(makePet({ lastKnownSignal: "healthy" }));
    db._queryFindMany
      .mockResolvedValueOnce([]) // no metrics → "watch" (signal changes)
      .mockResolvedValueOnce([]); // no vaccinations

    // Simulate a transient DB error on the history insert
    db.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue(Promise.reject(new Error("DB error"))),
    });

    // Must not throw — history insert is non-fatal
    await expect(refreshSignalCache(PET_ID, NOW)).resolves.toBeUndefined();

    // Cache update must still have run
    expect(db.update).toHaveBeenCalledTimes(1);
  });
});
