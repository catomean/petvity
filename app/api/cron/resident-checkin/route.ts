import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getInstance } from "@/lib/db";
import { users, pets, healthMetrics, vaccinations, healthRecords } from "@/lib/db/schema";
import { RESIDENT_ACCOUNT, RESIDENT_PET } from "@/lib/config/resident-pet";
import { generateResidentCheckin } from "@/lib/domain/resident-checkin";
import { refreshSignalCache } from "@/lib/api/signal-cache";

/**
 * Logs today's check-in for the resident pet (Milo) — one real row per day,
 * accumulating history the way a real owner's daily tracking would. Runs
 * from a daily box timer; idempotent (re-runs skip an already-logged day).
 * Bootstraps the account, pet, vaccinations, and first vet record on the
 * first ever run.
 */

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const db = getInstance();
  const now = new Date();
  const today = iso(now);

  // ── Bootstrap account (no password on purpose: machine-only, not loginable)
  let owner = await db.query.users.findFirst({
    where: eq(users.email, RESIDENT_ACCOUNT.email),
  });
  if (!owner) {
    [owner] = await db
      .insert(users)
      .values({
        name: RESIDENT_ACCOUNT.name,
        email: RESIDENT_ACCOUNT.email,
        role: "pet_owner",
        emailVerified: now,
        digestOptOut: true,
      })
      .returning();
  }

  // ── Bootstrap pet
  let pet = await db.query.pets.findFirst({
    where: and(eq(pets.ownerId, owner.id), eq(pets.name, RESIDENT_PET.name)),
  });
  let bootstrapped = false;
  if (!pet) {
    const handleTaken = await db.query.pets.findFirst({
      where: eq(pets.handle, RESIDENT_PET.handle),
    });
    [pet] = await db
      .insert(pets)
      .values({
        ownerId: owner.id,
        name: RESIDENT_PET.name,
        species: RESIDENT_PET.species,
        breed: RESIDENT_PET.breed,
        sex: RESIDENT_PET.sex,
        birthDate: RESIDENT_PET.birthDate,
        bio: RESIDENT_PET.bio,
        ...(handleTaken ? {} : { isPublic: true, handle: RESIDENT_PET.handle }),
      })
      .returning();
    bootstrapped = true;

    await db.insert(vaccinations).values([
      {
        petId: pet.id,
        name: "Rabies",
        administeredDate: iso(new Date(now.getTime() - 100 * 86_400_000)),
        nextDueDate: iso(new Date(now.getTime() + 265 * 86_400_000)),
        status: "up_to_date",
        vetName: "Dr. Brunner, Kleintierpraxis Wiedikon",
      },
      {
        petId: pet.id,
        name: "FVRCP booster",
        administeredDate: iso(new Date(now.getTime() - 330 * 86_400_000)),
        nextDueDate: iso(new Date(now.getTime() + 35 * 86_400_000)),
        status: "up_to_date",
        vetName: "Dr. Brunner, Kleintierpraxis Wiedikon",
      },
    ]);

    await db.insert(healthRecords).values({
      petId: pet.id,
      type: "vet_visit",
      date: iso(new Date(now.getTime() - 100 * 86_400_000)),
      title: "Annual check-up and rabies shot",
      vetName: "Dr. Brunner",
      clinic: "Kleintierpraxis Wiedikon",
      notes: "Healthy, well-muscled. Teeth in great shape. Slightly dramatic about the thermometer.",
    });
  }

  // ── Today's check-in (idempotent: one row per day, like a real owner)
  const existing = await db.query.healthMetrics.findFirst({
    where: and(eq(healthMetrics.petId, pet.id), eq(healthMetrics.date, today)),
  });
  if (existing) {
    return NextResponse.json({
      success: true,
      data: { petId: pet.id, date: today, logged: false, reason: "already logged today" },
    });
  }

  const checkin = generateResidentCheckin(today);
  await db.insert(healthMetrics).values({ petId: pet.id, date: today, ...checkin });
  await refreshSignalCache(pet.id, now);

  return NextResponse.json({
    success: true,
    data: { petId: pet.id, date: today, logged: true, bootstrapped, checkin },
  });
}
