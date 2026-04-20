// Edge-compatible auth config — used ONLY in proxy.ts (middleware).
// Must NOT import bcryptjs, DrizzleAdapter, or any Node.js-only module.
// The JWT token already contains id, role, emailVerified written by the
// full auth config in lib/auth/index.ts — we just read them here.
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "./types";
import "./types"; // ensure module augmentation is applied

const edgeConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  providers: [],
  callbacks: {
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.emailVerified =
        (token.emailVerified as Date | null | undefined) ?? null;
      return session;
    },
  },
};

export const { auth } = NextAuth(edgeConfig);
