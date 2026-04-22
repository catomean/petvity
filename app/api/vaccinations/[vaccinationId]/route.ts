import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getInstance } from "@/lib/db";
import { vaccinations, pets } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/guards";

const VACCINATION_STATUSES = ["up_to_date", "due_soon", "overdue", "not_applicable"] as const;

const patchSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  administeredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  status: z.enum(VACCINATION_STATUSES).optional(),
  batchNumber: z.string().max(100).nullable().optional(),
  vetName: z.string().max(150).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

type Params = { params: Promise<{ vaccinationId: string }> };

/** Returns the row only if it exists and the pet belongs to userId. */
async function verifyOwnership(vaccinationId: string, userId: string) {
  const db = getInstance();
  const row = await db.query.vaccinations.findFirst({
    where: eq(vaccinations.id, vaccinationId),
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

  const { vaccinationId } = await params;
  const existing = await verifyOwnership(vaccinationId, session.user.id);
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
    .update(vaccinations)
    .set(parsed.data)
    .where(eq(vaccinations.id, vaccinationId))
    .returning();

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { vaccinationId } = await params;
  const existing = await verifyOwnership(vaccinationId, session.user.id);
  if (!existing) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const db = getInstance();
  await db.delete(vaccinations).where(eq(vaccinations.id, vaccinationId));

  return NextResponse.json({ success: true });
}
