import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getInstance } from "@/lib/db";
import { healthRecords, pets } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/guards";

const createRecordSchema = z.object({
  petId: z.string().uuid(),
  type: z.enum([
    "vet_visit", "vaccination", "medication", "surgery",
    "lab_result", "dental", "grooming", "other",
  ]),
  title: z.string().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  vetName: z.string().max(150).optional(),
  clinic: z.string().max(150).optional(),
  notes: z.string().max(1000).optional(),
  attachmentUrl: z.string().url().optional(),
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

  const records = await db.query.healthRecords.findMany({
    where: eq(healthRecords.petId, petId),
    orderBy: (t, { desc }) => [desc(t.date)],
  });

  return NextResponse.json({ success: true, data: records });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = createRecordSchema.safeParse(body);
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

  const [record] = await db
    .insert(healthRecords)
    .values(parsed.data)
    .returning();

  return NextResponse.json({ success: true, data: record }, { status: 201 });
}
