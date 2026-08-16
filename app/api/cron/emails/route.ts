import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, lte } from "drizzle-orm";
import { getInstance } from "@/lib/db";
import { emailQueue, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { TEMPLATE_MAP, type TemplateKey, type WelcomePayload } from "@/lib/email/templates";
import { makeUnsubscribeUrl } from "@/lib/auth/unsubscribe-token";
import { requireCronAuth } from "@/lib/auth/cron";

export async function POST(req: NextRequest) {
  const auth = requireCronAuth(req);
  if (!auth.ok) return auth.response;

  const db = getInstance();
  const pending = await db
    .select()
    .from(emailQueue)
    .where(
      and(
        eq(emailQueue.status, "pending"),
        lte(emailQueue.sendAt, new Date()),
      ),
    );

  if (pending.length === 0) {
    return NextResponse.json({ success: true, data: { sent: 0, failed: 0 } });
  }

  // Fetch all user emails in one query to avoid N+1
  const userIds = [...new Set(pending.map((item) => item.userId))];
  const userRows = await db
    .select({ id: users.id, name: users.name, email: users.email, locale: users.locale, digestOptOut: users.digestOptOut })
    .from(users)
    .where(inArray(users.id, userIds));
  const userMap = new Map(userRows.map((u) => [u.id, u]));

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of pending) {
    const templateFn = TEMPLATE_MAP[item.templateKey as TemplateKey];
    if (!templateFn) continue;

    const user = userMap.get(item.userId);
    if (!user?.email) continue;

    // Respect the user's opt-out — drop the queued item so it doesn't
    // re-process tomorrow. Welcome emails are non-critical; no need to
    // keep audit history of cancelled ones.
    if (user.digestOptOut) {
      await db.delete(emailQueue).where(eq(emailQueue.id, item.id));
      skipped++;
      continue;
    }

    try {
      // Welcome-series templates accept an unsubscribeUrl; injecting it here
      // (rather than at enqueue time) lets us add it to existing queued items
      // without a backfill, and keeps the token rotation point in one place.
      // Narrowed to WelcomePayload rather than `object`: enqueueWelcomeSequence
      // writes { name, email }, and casting to a bare object hid that from the
      // compiler — so a template requiring `name` typechecked against a payload
      // that, as far as the types knew, had none.
      const payload: WelcomePayload = {
        ...(item.payload as WelcomePayload),
        unsubscribeUrl: makeUnsubscribeUrl(user.id),
      };
      const { subject, html } = templateFn(payload, user.locale);
      await sendEmail({ to: user.email, subject, html });

      await db
        .update(emailQueue)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(emailQueue.id, item.id));

      sent++;
    } catch {
      await db
        .update(emailQueue)
        .set({ status: "failed" })
        .where(eq(emailQueue.id, item.id));
      failed++;
    }
  }

  return NextResponse.json({ success: true, data: { sent, failed, skipped } });
}
