import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { users } from "@/lib/db/schema";

const schema = z.object({
  role: z.enum(["veterinarian", "pet_sitter", "groomer"]),
});

/** POST /api/account/role — upgrade the own account to a professional role.
 *  Trust-first, mirroring registration's intendedRole: any pet owner can start
 *  offering services; verification stays a separate admin-granted badge.
 *  Only pet_owner → vet/sitter is allowed — admins keep admin, and an existing
 *  professional switching sides should contact support (their profile,
 *  bookings, and reviews hang off the current role). */
export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  if (session.user.role !== "pet_owner") {
    return NextResponse.json(
      { success: false, error: "Only pet-owner accounts can switch to a professional role." },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getInstance();
  await db
    .update(users)
    .set({ role: parsed.data.role })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true, data: { role: parsed.data.role } });
}
