import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getInstance } from "@/lib/db";
import { medications, pets, medicationStatusEnum } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/guards";

const createMedicationSchema = z.object({
  petId: z.string().uuid(),
  name: z.string().min(1).max(150),
  // Optional fields are nullish: the form sends `null` for empty inputs
  // (buildBody uses `|| null`), and `.optional()` alone rejects null.
  dosage: z.string().max(100).nullish(),
  frequency: z.string().max(100).nullish(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullish(),
  prescribedBy: z.string().max(150).nullish(),
  status: z.enum(medicationStatusEnum.enumValues).default("active"),
  notes: z.string().max(500).nullish(),
});

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const petId = req.nextUrl.searchParams.get("petId");
  if (!petId) {
    return NextResponse.json({ success: false, error: "petId is required" }, { status: 400 });
  }

  const db = getInstance();
  const pet = await db.query.pets.findFirst({
    where: and(eq(pets.id, petId), eq(pets.ownerId, session.user.id)),
  });
  if (!pet) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const rows = await db.query.medications.findMany({
    where: eq(medications.petId, petId),
    orderBy: (t, { desc }) => [desc(t.startDate)],
  });

  return NextResponse.json({ success: true, data: rows });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = createMedicationSchema.safeParse(body);
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

  const [row] = await db.insert(medications).values(parsed.data).returning();
  return NextResponse.json({ success: true, data: row }, { status: 201 });
}
