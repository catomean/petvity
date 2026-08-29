import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getInstance } from "@/lib/db";
import { medications, medicationStatusEnum } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/guards";
import { getMedicationForOwner } from "@/lib/api/ownership";

const patchSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  dosage: z.string().max(100).nullable().optional(),
  frequency: z.string().max(100).nullable().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  prescribedBy: z.string().max(150).nullable().optional(),
  status: z.enum(medicationStatusEnum.enumValues).optional(),
  notes: z.string().max(500).nullable().optional(),
});

type Params = { params: Promise<{ medicationId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { medicationId } = await params;
  const existing = await getMedicationForOwner(medicationId, session.user.id);
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
    .update(medications)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(medications.id, medicationId))
    .returning();

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { medicationId } = await params;
  const existing = await getMedicationForOwner(medicationId, session.user.id);
  if (!existing) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const db = getInstance();
  await db.delete(medications).where(eq(medications.id, medicationId));

  return NextResponse.json({ success: true });
}
