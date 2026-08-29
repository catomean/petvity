import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import type { UserRole } from "./types";

type GuardSuccess = { session: Session; error: null };
type GuardFailure = { session: null; error: NextResponse };

export async function requireSession(): Promise<GuardSuccess | GuardFailure> {
  const session = await auth();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}

export async function requireRole(role: UserRole): Promise<GuardSuccess | GuardFailure> {
  const session = await auth();
  if (!session || session.user.role !== role) {
    return {
      session: null,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}

export async function requireAdmin(): Promise<GuardSuccess | GuardFailure> {
  return requireRole("admin");
}
