import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getInstance } from "@/lib/db";
import { pets, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { weeklyDigest } from "@/lib/email/templates";
import { APP_URL } from "@/lib/config/app";
import { requireCronAuth } from "@/lib/auth/cron";

export async function POST(req: NextRequest) {
  const auth = requireCronAuth(req);
  if (!auth.ok) return auth.response;

  const db = getInstance();

  // Inner join: only users with at least one pet, who haven't opted out of the digest
  const rows = await db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userLocale: users.locale,
      petId: pets.id,
      petName: pets.name,
      petSignal: pets.lastKnownSignal,
    })
    .from(users)
    .innerJoin(pets, eq(pets.ownerId, users.id))
    .where(and(eq(users.digestOptOut, false)));

  if (rows.length === 0) {
    return NextResponse.json({ success: true, data: { sent: 0 } });
  }

  // Group pets by owner in memory — one digest email per owner
  const ownerMap = new Map<
    string,
    {
      name: string;
      email: string;
      locale: string | null;
      pets: { id: string; name: string; signal: "healthy" | "watch" | "concern" }[];
    }
  >();

  for (const row of rows) {
    if (!row.userEmail) continue;
    const petEntry = {
      id: row.petId,
      name: row.petName,
      signal: (row.petSignal ?? "watch") as "healthy" | "watch" | "concern",
    };
    const existing = ownerMap.get(row.userId);
    if (existing) {
      existing.pets.push(petEntry);
    } else {
      ownerMap.set(row.userId, {
        name: row.userName ?? "there",
        email: row.userEmail,
        locale: row.userLocale ?? null,
        pets: [petEntry],
      });
    }
  }

  const settingsUrl = `${APP_URL}/portal/settings`;
  let sent = 0;

  for (const [, owner] of ownerMap) {
    const petPayload = owner.pets.map((p) => ({
      name: p.name,
      signal: p.signal,
      url: `${APP_URL}/portal/pets/${p.id}/health`,
    }));

    const { subject, html } = weeklyDigest(
      { ownerName: owner.name, pets: petPayload, settingsUrl },
      owner.locale,
    );

    try {
      await sendEmail({ to: owner.email, subject, html });
      sent++;
    } catch {
      // Non-fatal — continue to next owner
    }
  }

  return NextResponse.json({ success: true, data: { sent } });
}
