/**
 * SSOT for user role display config.
 * Enum values must match userRoleEnum in lib/db/schema.ts.
 * Icons are intentionally excluded — they are React components and belong in the UI layer.
 */
import type { UserRole } from "@/lib/auth/types";

export const USER_ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string }> = {
  pet_owner:    { label: "Pet Owner",    color: "text-[var(--teal)]",  bg: "bg-[var(--teal-light)]" },
  veterinarian: { label: "Veterinarian", color: "text-blue-700",       bg: "bg-blue-50" },
  pet_sitter:   { label: "Pet Sitter",   color: "text-amber-700",      bg: "bg-amber-50" },
  admin:        { label: "Admin",        color: "text-purple-700",     bg: "bg-purple-50" },
} as const;

/** Derived options array for role selects/filters. */
export const USER_ROLE_OPTIONS = (Object.entries(USER_ROLE_CONFIG) as [UserRole, typeof USER_ROLE_CONFIG[UserRole]][]).map(
  ([value, { label }]) => ({ value, label }),
);

/** Label-only helper for inline use. */
export function userRoleLabel(role: string): string {
  return USER_ROLE_CONFIG[role as UserRole]?.label ?? role;
}
