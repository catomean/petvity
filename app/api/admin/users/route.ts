import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { users, pets } from "@/lib/db/schema";
import { eq, count, desc } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = getInstance();

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      petCount: count(pets.id),
    })
    .from(users)
    .leftJoin(pets, eq(pets.ownerId, users.id))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt));

  return NextResponse.json({ success: true, data: rows });
}
