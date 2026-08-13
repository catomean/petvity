/**
 * SSOT for user role display config.
 * Enum values must match userRoleEnum in lib/db/schema.ts.
 * Icons are intentionally excluded — they are React components and belong in the UI layer.
 */
import type { UserRole } from "@/lib/auth/types";

export const USER_ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; className: string }> = {
  pet_owner:    { label: "Pet Owner",    color: "text-[var(--teal)]", bg: "bg-[var(--teal-light)]", className: "bg-[var(--teal-light)] text-[var(--teal)]" },
  veterinarian: { label: "Veterinarian", color: "text-[var(--role-vet)]",    bg: "bg-[var(--role-vet-bg)]",    className: "bg-[var(--role-vet-bg)] text-[var(--role-vet)]" },
  pet_sitter:   { label: "Pet Sitter",   color: "text-[var(--role-sitter)]", bg: "bg-[var(--role-sitter-bg)]", className: "bg-[var(--role-sitter-bg)] text-[var(--role-sitter)]" },
  groomer:      { label: "Groomer",      color: "text-[var(--role-groomer)]", bg: "bg-[var(--role-groomer-bg)]", className: "bg-[var(--role-groomer-bg)] text-[var(--role-groomer)]" },
  admin:        { label: "Admin",        color: "text-[var(--role-admin)]",  bg: "bg-[var(--role-admin-bg)]",  className: "bg-[var(--role-admin-bg)] text-[var(--role-admin)]" },
} as const;

/** Derived options array for role selects/filters. */
export const USER_ROLE_OPTIONS = (Object.entries(USER_ROLE_CONFIG) as [UserRole, typeof USER_ROLE_CONFIG[UserRole]][]).map(
  ([value, { label }]) => ({ value, label }),
);

