import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { routing } from "@/i18n/routing";

const patchSchema = z.object({
  locale: z.enum(routing.locales as readonly [string, ...string[]]),
});

/** PATCH /api/account/locale — persist the user's UI locale.
 *  Called best-effort by LocaleSwitcher when an authed user picks a language,
 *  so cron emails (vaccination reminders, health alerts, …) can render in
 *  the recipient's chosen language regardless of which device they're on.
 */
export async function PATCH(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid locale" }, { status: 400 });
  }

  const db = getInstance();
  await db.update(users).set({ locale: parsed.data.locale }).where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}
