import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getInstance } from "@/lib/db";
import {
  users,
  pets,
  healthMetrics,
  vaccinations,
  healthRecords,
} from "@/lib/db/schema";
import {
  RESIDENT_PETS,
  type ResidentPetDef,
} from "@/lib/config/resident-pet";
import { generateResidentCheckin } from "@/lib/domain/resident-checkin";
import { refreshSignalCache } from "@/lib/api/signal-cache";
import { requireCronAuth } from "@/lib/auth/cron";

/**
 * Logs today's check-in for every resident pet — one real row per day each,
 * accumulating history the way a real owner's daily tracking would. Runs
 * from a daily box timer; idempotent (re-runs skip an already-logged day).
 *
 * On first run it also bootstraps the whole resident community, so every
 * user type has living data: the pet owners and their pets (with a 28-day
 * check-in backfill so charts start alive), a verified vet and sitter,
 * a seller with a stocked shop, a rescue with an adoption listing, and
 * completed bookings with reviews so ratings render.
 */

const BACKFILL_DAYS = 28;
const DAY_MS = 86_400_000;

type Db = ReturnType<typeof getInstance>;

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** ISO date `days` from now (negative = past). */
function isoFrom(now: Date, days: number): string {
  return iso(new Date(now.getTime() + days * DAY_MS));
}

async function ensureUser(
  db: Db,
  account: { email: string; name: string },
  role: "pet_owner" | "veterinarian" | "pet_sitter" | "groomer",
  now: Date,
) {
  // No password on purpose: machine-only, nobody can log in as a resident.
  const existing = await db.query.users.findFirst({
    where: eq(users.email, account.email),
  });
  if (existing) return existing;
  const [created] = await db
    .insert(users)
    .values({
      name: account.name,
      email: account.email,
      role,
      emailVerified: now,
      digestOptOut: true,
    })
    .returning();
  return created;
}

async function ensureResidentPet(db: Db, def: ResidentPetDef, now: Date) {
  const owner = await ensureUser(db, def.account, "pet_owner", now);

  let pet = await db.query.pets.findFirst({
    where: and(eq(pets.ownerId, owner.id), eq(pets.name, def.pet.name)),
  });
  let bootstrapped = false;

  if (!pet) {
    const handleTaken = await db.query.pets.findFirst({
      where: eq(pets.handle, def.pet.handle),
    });
    [pet] = await db
      .insert(pets)
      .values({
        ownerId: owner.id,
        name: def.pet.name,
        species: def.pet.species,
        breed: def.pet.breed,
        sex: def.pet.sex,
        birthDate: def.pet.birthDate,
        bio: def.pet.bio,
        ...(handleTaken ? {} : { isPublic: true, handle: def.pet.handle }),
      })
      .returning();
    bootstrapped = true;

    await db.insert(vaccinations).values(
      def.vaccinations.map((v) => ({
        petId: pet!.id,
        name: v.name,
        administeredDate: isoFrom(now, -v.administeredDaysAgo),
        nextDueDate: isoFrom(now, v.nextDueInDays),
        status: "up_to_date" as const,
        vetName: v.vetName,
      })),
    );

    await db.insert(healthRecords).values({
      petId: pet.id,
      type: "vet_visit",
      date: isoFrom(now, -def.firstRecord.daysAgo),
      title: def.firstRecord.title,
      notes: def.firstRecord.notes,
    });

    // Seed recent history so charts and trends are alive from day one.
    await db.insert(healthMetrics).values(
      Array.from({ length: BACKFILL_DAYS }, (_, i) => {
        const date = isoFrom(now, i - BACKFILL_DAYS); // oldest → yesterday
        return { petId: pet!.id, date, ...generateResidentCheckin(date, def.checkin) };
      }),
    );
  }

  return { owner, pet, bootstrapped };
}

export async function POST(req: NextRequest) {
  const auth = requireCronAuth(req);
  if (!auth.ok) return auth.response;

  const db = getInstance();
  const now = new Date();
  const today = iso(now);

  const petResults: {
    handle: string;
    petId: string;
    date: string;
    logged: boolean;
    bootstrapped: boolean;
  }[] = [];

  for (const def of RESIDENT_PETS) {
    const { pet, bootstrapped } = await ensureResidentPet(db, def, now);

    // Today's check-in (idempotent: one row per day, like a real owner)
    const existing = await db.query.healthMetrics.findFirst({
      where: and(eq(healthMetrics.petId, pet.id), eq(healthMetrics.date, today)),
    });
    let logged = false;
    if (!existing) {
      const checkin = generateResidentCheckin(today, def.checkin);
      await db.insert(healthMetrics).values({ petId: pet.id, date: today, ...checkin });
      logged = true;
    }
    await refreshSignalCache(pet.id, now);

    petResults.push({ handle: def.pet.handle, petId: pet.id, date: today, logged, bootstrapped });
  }


  return NextResponse.json({
    success: true,
    data: { date: today, pets: petResults },
  });
}
