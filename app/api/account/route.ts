import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getInstance } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { registerSchema, resolveRole } from "@/lib/domain/auth";
import { enqueueWelcomeSequence } from "@/lib/domain/email-queue";
import { BCRYPT_SALT_ROUNDS } from "@/lib/config/auth";
import { sendEmail } from "@/lib/email";
import { ownerWelcome } from "@/lib/email/templates";

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

    const { name: rawName, email, password } = parsed.data;
    // Derive a display name from the email prefix if not provided
    const name = rawName?.trim() ||
      email.split("@")[0]
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

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

    // Queue the full welcome sequence (day 1, 3, 7 follow-ups)
    await enqueueWelcomeSequence(user.id, { name, email: email.toLowerCase() });

    // Send the welcome email immediately (don't wait for cron)
    const welcome = ownerWelcome({ name });
    await sendEmail({ to: email.toLowerCase(), ...welcome }).catch((err) =>
      console.error("[account] Welcome email failed:", err),
    );

    return NextResponse.json({ success: true, data: { id: user.id } }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Registration failed" },
      { status: 500 },
    );
  }
}
