import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { professionalBlockedDates } from "@/lib/db/schema";

/** DELETE /api/availability/[blockId] — unblock a range (owner-scoped) */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ blockId: string }> },
) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { blockId } = await params;
  const db = getInstance();
  const deleted = await db
    .delete(professionalBlockedDates)
    .where(
      and(
        eq(professionalBlockedDates.id, blockId),
        eq(professionalBlockedDates.professionalId, session.user.id),
      ),
    )
    .returning({ id: professionalBlockedDates.id });

  if (deleted.length === 0) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: { id: blockId } });
}
