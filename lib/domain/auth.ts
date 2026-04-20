import { z } from "zod";
import { getAdminEmails } from "@/lib/config/app";
import { PASSWORD_MIN_LENGTH } from "@/lib/config/auth";
import type { UserRole } from "@/lib/auth/types";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(PASSWORD_MIN_LENGTH),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Resolve the role for a user based on their email.
 * ADMIN_EMAILS env var drives admin assignment.
 * All other users default to pet_owner.
 * Vet/sitter roles are set manually by admin (Phase 2).
 */
export function resolveRole(email: string): UserRole {
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.toLowerCase()) ? "admin" : "pet_owner";
}
