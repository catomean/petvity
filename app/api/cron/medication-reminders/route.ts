import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getInstance } from "@/lib/db";
import { medications, pets, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { medicationEndingReminder } from "@/lib/email/templates";
import { APP_URL } from "@/lib/config/app";
import { formatDateShort } from "@/lib/utils/format";
import { requireCronAuth } from "@/lib/auth/cron";

export async function POST(req: NextRequest) {
  const auth = requireCronAuth(req);
  if (!auth.ok) return auth.response;

  const db = getInstance();
  const now = new Date();
  // "Tomorrow" in UTC — send the reminder the day before so owners have time to act.
  const tomorrowStr = new Date(now.getTime() + 86_400_000).toISOString().slice(0, 10);

  // Single JOIN query — no N+1
  const ending = await db
    .select({
      medicationId: medications.id,
      medicationName: medications.name,
      endDate: medications.endDate,
      petId: pets.id,
      petName: pets.name,
      ownerName: users.name,
      ownerEmail: users.email,
      ownerLocale: users.locale,
    })
    .from(medications)
    .innerJoin(pets, eq(pets.id, medications.petId))
    .innerJoin(users, eq(users.id, pets.ownerId))
    .where(
      and(
        eq(medications.status, "active"),
        eq(medications.endDate, tomorrowStr),
      ),
    );

  let sent = 0;

  for (const row of ending) {
    if (!row.ownerEmail || !row.endDate) continue;

    const { subject, html } = medicationEndingReminder({
      ownerName: row.ownerName ?? "there",
      petName: row.petName,
      medicationName: row.medicationName,
      endDate: formatDateShort(row.endDate, row.ownerLocale ?? undefined),
      petUrl: `${APP_URL}/portal/pets/${row.petId}/medications`,
    }, row.ownerLocale);

    try {
      await sendEmail({ to: row.ownerEmail, subject, html });
      sent++;
    } catch {
      // Non-fatal — continue
    }
  }

  return NextResponse.json({ success: true, data: { checked: ending.length, sent } });
}
