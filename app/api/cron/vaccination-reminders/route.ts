import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getInstance } from "@/lib/db";
import { vaccinations, pets, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { vaccinationReminder } from "@/lib/email/templates";
import { APP_URL } from "@/lib/config/app";
import { VACCINATION_DUE_SOON_DAYS } from "@/lib/config/pet-signal";
import { formatDateShort } from "@/lib/utils/format";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const db = getInstance();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const soonDate = new Date(now);
  soonDate.setDate(soonDate.getDate() + VACCINATION_DUE_SOON_DAYS);
  const soonStr = soonDate.toISOString().slice(0, 10);

  // Find vaccinations due within the next VACCINATION_DUE_SOON_DAYS days
  const allVaccinations = await db.query.vaccinations.findMany();
  const dueSoon = allVaccinations.filter(
    (v) =>
      v.nextDueDate &&
      v.nextDueDate >= todayStr &&
      v.nextDueDate <= soonStr &&
      v.status !== "not_applicable",
  );

  let sent = 0;

  for (const vaccination of dueSoon) {
    const pet = await db.query.pets.findFirst({
      where: eq(pets.id, vaccination.petId),
    });
    if (!pet) continue;

    const owner = await db.query.users.findFirst({
      where: eq(users.id, pet.ownerId),
    });
    if (!owner?.email) continue;

    const { subject, html } = vaccinationReminder({
      ownerName: owner.name ?? "there",
      petName: pet.name,
      vaccinationName: vaccination.name,
      dueDate: formatDateShort(vaccination.nextDueDate!),
      petUrl: `${APP_URL}/portal/pets/${pet.id}/vaccinations`,
    });

    try {
      await sendEmail({ to: owner.email, subject, html });
      sent++;
    } catch {
      // Non-fatal — continue
    }
  }

  return NextResponse.json({ success: true, data: { checked: dueSoon.length, sent } });
}
