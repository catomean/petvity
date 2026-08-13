import type { DefaultSession } from "next-auth";

export type UserRole = "pet_owner" | "veterinarian" | "pet_sitter" | "groomer" | "admin";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      emailVerified: Date | null;
    } & DefaultSession["user"];
  }
}
