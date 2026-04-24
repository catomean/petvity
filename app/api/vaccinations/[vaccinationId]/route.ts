import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getInstance } from "@/lib/db";
import { vaccinations, vaccinationStatusEnum } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/guards";
import { getVaccinationForOwner } from "@/lib/api/ownership";
import { refreshSignalCache } from "@/lib/api/signal-cache";

const patchSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  administeredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  status: z.enum(vaccinationStatusEnum.enumValues).optional(),
  batchNumber: z.string().max(100).nullable().optional(),
  vetName: z.string().max(150).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

type Params = { params: Promise<{ vaccinationId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { vaccinationId } = await params;
  const existing = await getVaccinationForOwner(vaccinationId, session.user.id);
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

  // Refresh signal — status change (e.g. overdue → up_to_date) affects the signal
  await refreshSignalCache(existing.petId);

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { vaccinationId } = await params;
  const existing = await getVaccinationForOwner(vaccinationId, session.user.id);
  if (!existing) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const db = getInstance();
  await db.delete(vaccinations).where(eq(vaccinations.id, vaccinationId));

  // Refresh signal — removing a vaccination changes the overdue count
  await refreshSignalCache(existing.petId);

  return NextResponse.json({ success: true });
}
