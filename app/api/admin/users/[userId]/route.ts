import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne, count } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { users, userRoleEnum } from "@/lib/db/schema";

const patchSchema = z.object({
  role: z.enum(userRoleEnum.enumValues),
});

type Params = { params: Promise<{ userId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { userId } = await params;

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { role } = parsed.data;

  // Prevent self-demotion so there's always at least one admin
  if (userId === session.user.id && role !== "admin") {
    return NextResponse.json(
      { success: false, error: "You cannot change your own role" },
      { status: 400 },
    );
  }

  // Ensure at least one admin remains if demoting another admin
  if (role !== "admin") {
    const db = getInstance();
    const target = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (target?.role === "admin") {
      const [{ remaining }] = await db
        .select({ remaining: count() })
        .from(users)
        .where(and(eq(users.role, "admin"), ne(users.id, userId)));
      if (remaining === 0) {
        return NextResponse.json(
          { success: false, error: "Cannot remove the last admin" },
          { status: 400 },
        );
      }
    }
  }

  const db = getInstance();
  const [updated] = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, userId))
    .returning({ id: users.id, role: users.role });

  if (!updated) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: updated });
}
