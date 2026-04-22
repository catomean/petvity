import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getInstance } from "@/lib/db";
import { healthRecords, healthRecordTypeEnum } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/guards";
import { getHealthRecordForOwner } from "@/lib/api/ownership";

const patchSchema = z.object({
  type: z.enum(healthRecordTypeEnum.enumValues).optional(),
  title: z.string().min(1).max(200).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  vetName: z.string().max(150).nullable().optional(),
  clinic: z.string().max(150).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

type Params = { params: Promise<{ recordId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { recordId } = await params;
  const existing = await getHealthRecordForOwner(recordId, session.user.id);
  if (!existing) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getInstance();
  const [updated] = await db
    .update(healthRecords)
    .set(parsed.data)
    .where(eq(healthRecords.id, recordId))
    .returning();

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { recordId } = await params;
  const existing = await getHealthRecordForOwner(recordId, session.user.id);
  if (!existing) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const db = getInstance();
  await db.delete(healthRecords).where(eq(healthRecords.id, recordId));

  return NextResponse.json({ success: true });
}
