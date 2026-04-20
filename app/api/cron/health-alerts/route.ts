import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, desc } from "drizzle-orm";
import { getInstance } from "@/lib/db";
import { pets, healthMetrics, vaccinations, users } from "@/lib/db/schema";
import { computePetSignal } from "@/lib/domain/pet-signal";
import { sendEmail } from "@/lib/email";
import { petHealthAlert } from "@/lib/email/templates";
import { APP_URL } from "@/lib/config/app";
import type { SpeciesId } from "@/lib/config/species";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const db = getInstance();
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sinceStr = sevenDaysAgo.toISOString().slice(0, 10);
  const todayStr = now.toISOString().slice(0, 10);

  const allPets = await db.query.pets.findMany();

  let alerted = 0;

  for (const pet of allPets) {
    const recentMetrics = await db.query.healthMetrics.findMany({
      where: and(
        eq(healthMetrics.petId, pet.id),
        gte(healthMetrics.date, sinceStr),
      ),
      orderBy: [desc(healthMetrics.date)],
    });

    const allVaccinations = await db.query.vaccinations.findMany({
      where: eq(vaccinations.petId, pet.id),
    });

    const overdueCount = allVaccinations.filter(
      (v) => v.nextDueDate && v.nextDueDate < todayStr && v.status !== "not_applicable",
    ).length;

    const result = computePetSignal({
      species: pet.species as SpeciesId,
      recentMetrics,
      overdueVaccinations: overdueCount,
      now,
    });

    // Update cached signal
    await db
      .update(pets)
      .set({ lastKnownSignal: result.signal })
      .where(eq(pets.id, pet.id));

    // Alert owner if signal is "concern" and we haven't alerted today
    if (
      result.signal === "concern" &&
      (!pet.signalAlertSentAt ||
        pet.signalAlertSentAt.toISOString().slice(0, 10) !== todayStr)
    ) {
      const owner = await db.query.users.findFirst({
        where: eq(users.id, pet.ownerId),
      });
      if (owner?.email) {
        const { subject, html } = petHealthAlert({
          ownerName: owner.name ?? "there",
          petName: pet.name,
          reason: result.reason,
          petUrl: `${APP_URL}/portal/pets/${pet.id}/health`,
        });
        try {
          await sendEmail({ to: owner.email, subject, html });
          await db
            .update(pets)
            .set({ signalAlertSentAt: now })
            .where(eq(pets.id, pet.id));
          alerted++;
        } catch {
          // Non-fatal — continue to next pet
        }
      }
    }
  }

  return NextResponse.json({ success: true, data: { processed: allPets.length, alerted } });
}
