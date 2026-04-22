import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { users, vetProfiles, sitterProfiles } from "@/lib/db/schema";

const patchSchema = z.object({
  isVerified: z.boolean(),
});

type Params = { params: Promise<{ userId: string }> };

/** PATCH /api/admin/professionals/[userId] — toggle isVerified on a vet or sitter profile */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { userId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { isVerified } = parsed.data;
  const db = getInstance();

  // Determine which profile table to update based on the user's role
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
  }

  if (user.role === "veterinarian") {
    const [updated] = await db
      .update(vetProfiles)
      .set({ isVerified, updatedAt: new Date() })
      .where(eq(vetProfiles.userId, userId))
      .returning({ isVerified: vetProfiles.isVerified });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Vet profile not found. The user must set up their profile first." },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: { isVerified: updated.isVerified } });
  }

  if (user.role === "pet_sitter") {
    const [updated] = await db
      .update(sitterProfiles)
      .set({ isVerified, updatedAt: new Date() })
      .where(eq(sitterProfiles.userId, userId))
      .returning({ isVerified: sitterProfiles.isVerified });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Sitter profile not found. The user must set up their profile first." },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: { isVerified: updated.isVerified } });
  }

  return NextResponse.json(
    { success: false, error: "User is not a veterinarian or pet sitter." },
    { status: 400 },
  );
}
