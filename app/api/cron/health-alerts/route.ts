import { NextRequest, NextResponse } from "next/server";
import { and, gte, inArray, desc } from "drizzle-orm";
import { getInstance } from "@/lib/db";
import { pets, healthMetrics, vaccinations, users, petSignalHistory } from "@/lib/db/schema";
import { computePetSignal } from "@/lib/domain/pet-signal";
import { SIGNAL_METRIC_WINDOW_DAYS } from "@/lib/config/pet-signal";
import { countOverdueVaccinations } from "@/lib/config/vaccinations";
import { sendEmail } from "@/lib/email";
import { petHealthAlert } from "@/lib/email/templates";
import { APP_URL } from "@/lib/config/app";
import type { SpeciesId } from "@/lib/config/species";
import { requireCronAuth } from "@/lib/auth/cron";

export async function POST(req: NextRequest) {
  const auth = requireCronAuth(req);
  if (!auth.ok) return auth.response;

  const db = getInstance();
  const now = new Date();
  const sinceStr = new Date(now.getTime() - SIGNAL_METRIC_WINDOW_DAYS * 86400000)
    .toISOString()
    .slice(0, 10);
  const todayStr = now.toISOString().slice(0, 10);

  const allPets = await db.select().from(pets);
  if (allPets.length === 0) {
    return NextResponse.json({ success: true, data: { processed: 0, alerted: 0 } });
  }

  const petIds = allPets.map((p) => p.id);

  // Batch-fetch metrics and vaccinations for all pets in 2 queries (not N×2)
  const [allMetrics, allVaccinations] = await Promise.all([
    db
      .select()
      .from(healthMetrics)
      .where(and(inArray(healthMetrics.petId, petIds), gte(healthMetrics.date, sinceStr)))
      .orderBy(desc(healthMetrics.date)),
    db.select().from(vaccinations).where(inArray(vaccinations.petId, petIds)),
  ]);

  // Group by petId in memory
  const metricsByPet = new Map<string, typeof allMetrics>();
  for (const m of allMetrics) {
    const arr = metricsByPet.get(m.petId) ?? [];
    arr.push(m);
    metricsByPet.set(m.petId, arr);
  }

  const vaccByPet = new Map<string, typeof allVaccinations>();
  for (const v of allVaccinations) {
    const arr = vaccByPet.get(v.petId) ?? [];
    arr.push(v);
    vaccByPet.set(v.petId, arr);
  }

  // Compute signals once per pet — results reused for cache update, history, and emails
  type SignalEntry = { id: string; signal: string; result: ReturnType<typeof computePetSignal> };
  const signalEntries: SignalEntry[] = [];
  const alertPetIds: string[] = [];
  // Accumulate history rows for signal transitions — one bulk INSERT after the loop
  const historyRows: {
    petId: string;
    signal: "healthy" | "watch" | "concern";
    reason: string;
    reasonData: unknown;
    source: string;
    recordedAt: Date;
  }[] = [];

  for (const pet of allPets) {
    const recentMetrics = metricsByPet.get(pet.id) ?? [];
    const petVacc = vaccByPet.get(pet.id) ?? [];
    const overdueCount = countOverdueVaccinations(petVacc, todayStr);

    const result = computePetSignal({
      species: pet.species as SpeciesId,
      recentMetrics,
      overdueVaccinations: overdueCount,
      petCreatedAt: pet.createdAt,
      now,
    });

    signalEntries.push({ id: pet.id, signal: result.signal, result });

    // Record a history entry only when the signal changes.
    if (pet.lastKnownSignal !== result.signal) {
      historyRows.push({
        petId: pet.id,
        signal: result.signal as "healthy" | "watch" | "concern",
        reason: result.reason,
        reasonData: result.reasonData,
        source: "cron",
        recordedAt: now,
      });
    }

    if (
      result.signal === "concern" &&
      (!pet.signalAlertSentAt || pet.signalAlertSentAt.toISOString().slice(0, 10) !== todayStr)
    ) {
      alertPetIds.push(pet.id);
    }
  }

  // Batch-update cached signals — group by signal value so we run ≤3 queries
  // instead of one per pet (there are only 3 possible signal values).
  const petsBySignal = new Map<string, string[]>();
  for (const { id, signal } of signalEntries) {
    const arr = petsBySignal.get(signal) ?? [];
    arr.push(id);
    petsBySignal.set(signal, arr);
  }
  for (const [signal, ids] of petsBySignal) {
    await db.update(pets).set({ lastKnownSignal: signal }).where(inArray(pets.id, ids));
  }

  // Bulk-insert signal history for all transitions — 0 or 1 query regardless of pet count.
  // History insert is non-critical: a transient failure must not block the signal cache update.
  if (historyRows.length > 0) {
    try {
      await db.insert(petSignalHistory).values(historyRows);
    } catch {
      // Non-fatal — cache update still proceeds
    }
  }

  if (alertPetIds.length === 0) {
    return NextResponse.json({ success: true, data: { processed: allPets.length, alerted: 0 } });
  }

  // Batch-fetch owners for alert pets only
  const alertPets = allPets.filter((p) => alertPetIds.includes(p.id));
  const ownerIds = [...new Set(alertPets.map((p) => p.ownerId))];
  const ownerRows = await db
    .select({ id: users.id, name: users.name, email: users.email, locale: users.locale })
    .from(users)
    .where(inArray(users.id, ownerIds));
  const ownerMap = new Map(ownerRows.map((u) => [u.id, u]));

  // Build a lookup from the already-computed signal entries (no second computePetSignal call)
  const signalResultMap = new Map(signalEntries.map(({ id, result }) => [id, result]));

  const alertedIds: string[] = [];
  for (const pet of alertPets) {
    const owner = ownerMap.get(pet.ownerId);
    if (!owner?.email) continue;

    const result = signalResultMap.get(pet.id)!;
    const { subject, html } = petHealthAlert(
      {
        ownerName: owner.name ?? "there",
        petName: pet.name,
        reason: result.reason,
        petUrl: `${APP_URL}/portal/pets/${pet.id}/health`,
      },
      owner.locale,
    );

    try {
      await sendEmail({ to: owner.email, subject, html });
      alertedIds.push(pet.id);
    } catch {
      // Non-fatal — continue to next pet
    }
  }

  // Batch-update signalAlertSentAt in one query instead of N
  if (alertedIds.length > 0) {
    await db.update(pets).set({ signalAlertSentAt: now }).where(inArray(pets.id, alertedIds));
  }

  return NextResponse.json({
    success: true,
    data: { processed: allPets.length, alerted: alertedIds.length },
  });
}
