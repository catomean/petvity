import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getInstance } from "@/lib/db";
import { healthRecords, pets } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/guards";

const patchSchema = z.object({
  type: z.enum([
    "vet_visit", "vaccination", "medication", "surgery",
    "lab_result", "dental", "grooming", "other",
  ]).optional(),
  title: z.string().min(1).max(200).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  vetName: z.string().max(150).nullable().optional(),
  clinic: z.string().max(150).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

type Params = { params: Promise<{ recordId: string }> };

async function verifyOwnership(recordId: string, userId: string) {
  const db = getInstance();
  const row = await db.query.healthRecords.findFirst({
    where: eq(healthRecords.id, recordId),
  });
  if (!row) return null;
  const pet = await db.query.pets.findFirst({
    where: and(eq(pets.id, row.petId), eq(pets.ownerId, userId)),
  });
  return pet ? row : null;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { recordId } = await params;
  const existing = await verifyOwnership(recordId, session.user.id);
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
  const existing = await verifyOwnership(recordId, session.user.id);
  if (!existing) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const db = getInstance();
  await db.delete(healthRecords).where(eq(healthRecords.id, recordId));

  return NextResponse.json({ success: true });
}
