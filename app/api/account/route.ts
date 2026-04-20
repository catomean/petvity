import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getInstance } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { registerSchema, resolveRole } from "@/lib/domain/auth";
import { enqueueWelcomeSequence } from "@/lib/domain/email-queue";
import { BCRYPT_SALT_ROUNDS } from "@/lib/config/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, email, password } = parsed.data;
    const db = getInstance();

    const existing = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const role = resolveRole(email);

    const [user] = await db
      .insert(users)
      .values({ name, email: email.toLowerCase(), password: hashed, role })
      .returning({ id: users.id });

    await enqueueWelcomeSequence(user.id, { name, email: email.toLowerCase() });

    return NextResponse.json({ success: true, data: { id: user.id } }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Registration failed" },
      { status: 500 },
    );
  }
}
