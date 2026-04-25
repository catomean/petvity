/**
 * Refreshes the cached wellness signal on a pet row.
 *
 * Call after any mutation that can affect the signal:
 *   - health metrics upsert
 *   - vaccination create / update / delete
 */

import { and, desc, eq, gte } from "drizzle-orm";
import { getInstance } from "@/lib/db";
import { healthMetrics, pets, petSignalHistory, vaccinations } from "@/lib/db/schema";
import { computePetSignal } from "@/lib/domain/pet-signal";
import { SIGNAL_METRIC_WINDOW_DAYS } from "@/lib/config/pet-signal";
import { countOverdueVaccinations } from "@/lib/config/vaccinations";
import type { SpeciesId } from "@/lib/config/species";

export async function refreshSignalCache(petId: string, now = new Date()): Promise<void> {
  const db = getInstance();

  const sinceStr = new Date(now.getTime() - SIGNAL_METRIC_WINDOW_DAYS * 86400000)
    .toISOString()
    .slice(0, 10);
  const todayStr = now.toISOString().slice(0, 10);

  const [pet, recentMetrics, allVacc] = await Promise.all([
    db.query.pets.findFirst({ where: eq(pets.id, petId) }),
    db.query.healthMetrics.findMany({
      where: and(eq(healthMetrics.petId, petId), gte(healthMetrics.date, sinceStr)),
      orderBy: [desc(healthMetrics.date)],
    }),
    db.query.vaccinations.findMany({ where: eq(vaccinations.petId, petId) }),
  ]);

  if (!pet) return; // pet deleted concurrently — nothing to update

  const overdueCount = countOverdueVaccinations(allVacc, todayStr);

  const signal = computePetSignal({
    species: pet.species as SpeciesId,
    recentMetrics,
    overdueVaccinations: overdueCount,
    now,
  });

  // Only record a history row when the signal actually changes — not on every refresh.
  // History insert is non-critical: a transient failure must not block the signal cache update.
  if (pet.lastKnownSignal !== signal.signal) {
    try {
      await db.insert(petSignalHistory).values({
        petId,
        signal: signal.signal as "healthy" | "watch" | "concern",
        reason: signal.reason,
        source: "user_action",
        recordedAt: now,
      });
    } catch {
      // Non-fatal — cache update still proceeds
    }
  }

  await db.update(pets).set({ lastKnownSignal: signal.signal }).where(eq(pets.id, petId));
}
