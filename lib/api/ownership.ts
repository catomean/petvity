/**
 * Ownership verification helpers — single JOIN query per entity.
 * Each function returns the row only when it exists AND the pet belongs to userId.
 */

import { and, eq } from "drizzle-orm";
import { getInstance } from "@/lib/db";
import { healthRecords, medications, pets, vaccinations } from "@/lib/db/schema";

export async function getHealthRecordForOwner(recordId: string, userId: string) {
  const db = getInstance();
  const [row] = await db
    .select({ record: healthRecords })
    .from(healthRecords)
    .innerJoin(pets, and(eq(pets.id, healthRecords.petId), eq(pets.ownerId, userId)))
    .where(eq(healthRecords.id, recordId))
    .limit(1);
  return row?.record ?? null;
}

export async function getVaccinationForOwner(vaccinationId: string, userId: string) {
  const db = getInstance();
  const [row] = await db
    .select({ record: vaccinations })
    .from(vaccinations)
    .innerJoin(pets, and(eq(pets.id, vaccinations.petId), eq(pets.ownerId, userId)))
    .where(eq(vaccinations.id, vaccinationId))
    .limit(1);
  return row?.record ?? null;
}

export async function getMedicationForOwner(medicationId: string, userId: string) {
  const db = getInstance();
  const [row] = await db
    .select({ record: medications })
    .from(medications)
    .innerJoin(pets, and(eq(pets.id, medications.petId), eq(pets.ownerId, userId)))
    .where(eq(medications.id, medicationId))
    .limit(1);
  return row?.record ?? null;
}
