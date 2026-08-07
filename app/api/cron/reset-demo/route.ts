import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getInstance } from "@/lib/db";
import {
  users,
  pets,
  healthMetrics,
  vaccinations,
  medications,
  healthRecords,
} from "@/lib/db/schema";
import { DEMO_ACCOUNT } from "@/lib/config/demo";
import { BCRYPT_SALT_ROUNDS } from "@/lib/config/auth";
import { refreshSignalCache } from "@/lib/api/signal-cache";

/**
 * Wipe and reseed the shared demo account (also creates it on first run).
 *
 * Deleting the user row cascades through pets → metrics/vaccinations/
 * medications/records, so drive-by edits from demo visitors never persist.
 * Runs daily from a box timer; calling it once after deploy seeds the demo.
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

  // Full reset: the FK graph cascades everything the demo visitor touched.
  await db.delete(users).where(eq(users.email, DEMO_ACCOUNT.email));

  const hashed = await bcrypt.hash(DEMO_ACCOUNT.password, BCRYPT_SALT_ROUNDS);
  const [demoUser] = await db
    .insert(users)
    .values({
      name: DEMO_ACCOUNT.name,
      email: DEMO_ACCOUNT.email,
      password: hashed,
      role: "pet_owner",
      emailVerified: new Date(),
    })
    .returning();

  const [luna] = await db
    .insert(pets)
    .values({
      ownerId: demoUser.id,
      name: "Luna",
      species: "dog",
      breed: "Golden Retriever",
      sex: "female",
      birthDate: "2022-05-12",
      bio: "Sunny golden retriever who fetches anything that fits in her mouth and greets every dog in the park by name.",
    })
    .returning();

  // 30 days of daily check-ins with plausible, deterministic variation —
  // enough history for the charts, trend lines, and digital twin to feel real.
  const today = new Date();
  const rows = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(today.getTime() - (29 - i) * 86_400_000);
    const wave = Math.sin(i / 4.5); // slow mood/energy rhythm
    return {
      petId: luna.id,
      date: iso(day),
      weightGrams: 29_400 + Math.round(wave * 250) + i * 10,
      temperatureCentidegrees: 3_845 + (i % 3) * 5,
      heartRateBpm: 88 + ((i * 7) % 11),
      energy: wave > 0.3 ? 5 : wave < -0.5 ? 3 : 4,
      mood: wave < -0.6 ? 3 : wave > 0 ? 5 : 4,
      anxiety: i % 9 === 0 ? 3 : i % 2 === 0 ? 1 : 2,
      socialization: wave > -0.2 ? 5 : 4,
      notes:
        i === 29
          ? "Long lake walk this morning — soaked, ecstatic, exhausted."
          : null,
    };
  });
  await db.insert(healthMetrics).values(rows);

  await db.insert(vaccinations).values([
    {
      petId: luna.id,
      name: "Rabies",
      administeredDate: iso(new Date(today.getTime() - 200 * 86_400_000)),
      nextDueDate: iso(new Date(today.getTime() + 165 * 86_400_000)),
      status: "up_to_date",
      vetName: "Dr. Keller, Seefeld Tierklinik",
    },
    {
      petId: luna.id,
      name: "DHPP booster",
      administeredDate: iso(new Date(today.getTime() - 340 * 86_400_000)),
      nextDueDate: iso(new Date(today.getTime() + 25 * 86_400_000)),
      status: "due_soon",
      vetName: "Dr. Keller, Seefeld Tierklinik",
    },
  ]);

  await db.insert(medications).values({
    petId: luna.id,
    name: "Simparica Trio",
    dosage: "1 chewable",
    frequency: "Monthly",
    startDate: iso(new Date(today.getTime() - 90 * 86_400_000)),
    status: "active",
    prescribedBy: "Dr. Keller",
    notes: "Flea, tick and heartworm prevention. Give with food.",
  });

  await db.insert(healthRecords).values([
    {
      petId: luna.id,
      type: "vet_visit",
      date: iso(new Date(today.getTime() - 45 * 86_400_000)),
      title: "Annual wellness exam",
      vetName: "Dr. Keller",
      clinic: "Seefeld Tierklinik",
      notes: "Excellent condition. Mild tartar on upper molars — dental chew recommended.",
    },
    {
      petId: luna.id,
      type: "grooming",
      date: iso(new Date(today.getTime() - 12 * 86_400_000)),
      title: "Full groom and nail trim",
      clinic: "Pfoten-Salon Zürich",
    },
  ]);

  await refreshSignalCache(luna.id);

  return NextResponse.json({
    success: true,
    data: { userId: demoUser.id, petId: luna.id, metricDays: rows.length },
  });
}
