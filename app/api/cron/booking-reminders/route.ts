import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lt } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getInstance } from "@/lib/db";
import { bookings, pets, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { bookingReminder } from "@/lib/email/templates";
import { APP_URL } from "@/lib/config/app";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const db = getInstance();
  const now = new Date();

  // Confirmed bookings starting tomorrow (UTC midnight → midnight)
  const tomorrowStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  const dayAfterStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2),
  );

  // Two joins on the users table — need aliases
  const owner = alias(users, "owner");
  const professional = alias(users, "professional");

  const upcoming = await db
    .select({
      bookingId: bookings.id,
      petName: pets.name,
      petId: pets.id,
      startDate: bookings.startDate,
      ownerName: owner.name,
      ownerEmail: owner.email,
      ownerLocale: owner.locale,
      professionalName: professional.name,
    })
    .from(bookings)
    .innerJoin(pets, eq(pets.id, bookings.petId))
    .innerJoin(owner, eq(owner.id, bookings.ownerId))
    .innerJoin(professional, eq(professional.id, bookings.professionalId))
    .where(
      and(
        eq(bookings.status, "confirmed"),
        gte(bookings.startDate, tomorrowStart),
        lt(bookings.startDate, dayAfterStart),
      ),
    );

  let sent = 0;

  for (const row of upcoming) {
    if (!row.ownerEmail) continue;

    const dateLabel = row.startDate.toLocaleDateString(row.ownerLocale ?? undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });

    const { subject, html } = bookingReminder({
      ownerName: row.ownerName ?? "there",
      petName: row.petName,
      professionalName: row.professionalName ?? "your provider",
      startDate: dateLabel,
      bookingsUrl: `${APP_URL}/portal/bookings`,
    }, row.ownerLocale);

    try {
      await sendEmail({ to: row.ownerEmail, subject, html });
      sent++;
    } catch {
      // Non-fatal — continue
    }
  }

  return NextResponse.json({ success: true, data: { checked: upcoming.length, sent } });
}
