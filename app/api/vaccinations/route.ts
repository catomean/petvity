import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getInstance } from "@/lib/db";
import { vaccinations, pets, vaccinationStatusEnum } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/guards";
import { refreshSignalCache } from "@/lib/api/signal-cache";

const createVaccinationSchema = z.object({
  petId: z.string().uuid(),
  name: z.string().min(1).max(150),
  administeredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // Optional fields are nullish: the form sends `null` for empty inputs
  // (buildBody uses `|| null`), and `.optional()` alone rejects null.
  nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  status: z.enum(vaccinationStatusEnum.enumValues).default("up_to_date"),
  batchNumber: z.string().max(100).nullish(),
  vetName: z.string().max(150).nullish(),
  notes: z.string().max(500).nullish(),
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

  // Refresh signal cache — a new overdue vaccination escalates the signal
  await refreshSignalCache(pet.id);

  return NextResponse.json({ success: true, data: row }, { status: 201 });
}
