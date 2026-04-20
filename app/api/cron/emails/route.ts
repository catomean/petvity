import { NextRequest, NextResponse } from "next/server";
import { and, eq, lte } from "drizzle-orm";
import { getInstance } from "@/lib/db";
import { emailQueue } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { TEMPLATE_MAP, type TemplateKey } from "@/lib/email/templates";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const db = getInstance();
  const pending = await db.query.emailQueue.findMany({
    where: and(
      eq(emailQueue.status, "pending"),
      lte(emailQueue.sendAt, new Date()),
    ),
    with: { userId: true },
  });

  let sent = 0;
  let failed = 0;

  for (const item of pending) {
    const templateFn = TEMPLATE_MAP[item.templateKey as TemplateKey];
    if (!templateFn) continue;

    try {
      // We need the user's email — fetch it
      const user = await db.query.users?.findFirst?.({
        where: (u, { eq: eqFn }) => eqFn(u.id, item.userId),
      });
      if (!user?.email) continue;

      const { subject, html } = templateFn(item.payload);
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

  return NextResponse.json({ success: true, data: { sent, failed } });
}
