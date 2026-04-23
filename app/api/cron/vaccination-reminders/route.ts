import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lte, ne } from "drizzle-orm";
import { getInstance } from "@/lib/db";
import { pets, vaccinations, users } from "@/lib/db/schema";
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
  const soonStr = new Date(now.getTime() + VACCINATION_DUE_SOON_DAYS * 86400000)
    .toISOString()
    .slice(0, 10);

  // Single JOIN query — no N+1
  const dueSoon = await db
    .select({
      vaccinationId: vaccinations.id,
      vaccinationName: vaccinations.name,
      nextDueDate: vaccinations.nextDueDate,
      petId: pets.id,
      petName: pets.name,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(vaccinations)
    .innerJoin(pets, eq(pets.id, vaccinations.petId))
    .innerJoin(users, eq(users.id, pets.ownerId))
    .where(
      and(
        gte(vaccinations.nextDueDate, todayStr),
        lte(vaccinations.nextDueDate, soonStr),
        ne(vaccinations.status, "not_applicable"),
      ),
    );

  let sent = 0;

  for (const row of dueSoon) {
    if (!row.ownerEmail || !row.nextDueDate) continue;

    const { subject, html } = vaccinationReminder({
      ownerName: row.ownerName ?? "there",
      petName: row.petName,
      vaccinationName: row.vaccinationName,
      dueDate: formatDateShort(row.nextDueDate),
      petUrl: `${APP_URL}/portal/pets/${row.petId}/vaccinations`,
    });

    try {
      await sendEmail({ to: row.ownerEmail, subject, html });
      sent++;
    } catch {
      // Non-fatal — continue
    }
  }

  return NextResponse.json({ success: true, data: { checked: dueSoon.length, sent } });
}
