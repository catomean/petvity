import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getInstance } from "@/lib/db";
import { vaccinations, pets } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/guards";

const VACCINATION_STATUSES = ["up_to_date", "due_soon", "overdue", "not_applicable"] as const;

const createVaccinationSchema = z.object({
  petId: z.string().uuid(),
  name: z.string().min(1).max(150),
  administeredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(VACCINATION_STATUSES).default("up_to_date"),
  batchNumber: z.string().max(100).optional(),
  vetName: z.string().max(150).optional(),
  notes: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const petId = req.nextUrl.searchParams.get("petId");
  if (!petId) {
    return NextResponse.json(
      { success: false, error: "petId is required" },
      { status: 400 },
    );
  }

  const db = getInstance();
  const pet = await db.query.pets.findFirst({
    where: and(eq(pets.id, petId), eq(pets.ownerId, session.user.id)),
  });
  if (!pet) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const rows = await db.query.vaccinations.findMany({
    where: eq(vaccinations.petId, petId),
    orderBy: (t, { desc }) => [desc(t.administeredDate)],
  });

  return NextResponse.json({ success: true, data: rows });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = createVaccinationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getInstance();
  const pet = await db.query.pets.findFirst({
    where: and(eq(pets.id, parsed.data.petId), eq(pets.ownerId, session.user.id)),
  });
  if (!pet) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const [row] = await db.insert(vaccinations).values(parsed.data).returning();
  return NextResponse.json({ success: true, data: row }, { status: 201 });
}
