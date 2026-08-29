import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, desc } from "drizzle-orm";
import { z } from "zod";
import { getInstance } from "@/lib/db";
import { healthMetrics, pets } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/guards";
import { refreshSignalCache } from "@/lib/api/signal-cache";

const logMetricsSchema = z.object({
  petId: z.string().uuid(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((d) => d <= new Date().toISOString().slice(0, 10), {
      message: "Date cannot be in the future",
    }),
  weightGrams: z.number().int().positive().optional(),
  temperatureCentidegrees: z.number().int().optional(),
  heartRateBpm: z.number().int().positive().optional(),
  energy: z.number().int().min(1).max(5).optional(),
  mood: z.number().int().min(1).max(5).optional(),
  anxiety: z.number().int().min(1).max(5).optional(),
  socialization: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(500).optional(),
});

type Params = { params: Promise<{ petId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { petId } = await params;
  const { searchParams } = req.nextUrl;
  const days = parseInt(searchParams.get("days") ?? "30");
  const db = getInstance();

  // Verify ownership
  const pet = await db.query.pets.findFirst({
    where: and(eq(pets.id, petId), eq(pets.ownerId, session.user.id)),
  });
  if (!pet) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  const metrics = await db.query.healthMetrics.findMany({
    where: and(eq(healthMetrics.petId, petId), gte(healthMetrics.date, sinceStr)),
    orderBy: [desc(healthMetrics.date)],
  });

  return NextResponse.json({ success: true, data: metrics });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { petId } = await params;
  const body = await req.json();
  const parsed = logMetricsSchema.safeParse({ ...body, petId });
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getInstance();

  // Verify ownership
  const pet = await db.query.pets.findFirst({
    where: and(eq(pets.id, petId), eq(pets.ownerId, session.user.id)),
  });
  if (!pet) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  // Upsert: one row per pet per day
  const [row] = await db
    .insert(healthMetrics)
    .values({ ...parsed.data, loggedBy: session.user.id })
    .onConflictDoUpdate({
      target: [healthMetrics.petId, healthMetrics.date],
      set: {
        weightGrams: parsed.data.weightGrams,
        temperatureCentidegrees: parsed.data.temperatureCentidegrees,
        heartRateBpm: parsed.data.heartRateBpm,
        energy: parsed.data.energy,
        mood: parsed.data.mood,
        anxiety: parsed.data.anxiety,
        socialization: parsed.data.socialization,
        notes: parsed.data.notes,
        loggedBy: session.user.id,
      },
    })
    .returning();

  // Recompute and cache the wellness signal immediately
  await refreshSignalCache(petId);

  return NextResponse.json({ success: true, data: row }, { status: 201 });
}
