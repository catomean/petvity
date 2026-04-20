import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getInstance } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { loginSchema, resolveRole } from "@/lib/domain/auth";
import type { UserRole } from "./types";
import "./types"; // ensure module augmentation is applied

// Functional config pattern — DrizzleAdapter(getInstance()) is only called on
// the first actual request, never at module evaluation time. This prevents the
// Next.js build from throwing when DATABASE_URL is absent in CI/build env.
export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const db = getInstance();
  return {
    adapter: DrizzleAdapter(db),
    session: { strategy: "jwt" },
    pages: {
      signIn: "/login",
      error: "/login",
    },
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
      Credentials({
        async authorize(credentials) {
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const user = await db.query.users.findFirst({
            where: eq(users.email, parsed.data.email),
          });

          if (!user?.password) return null;

          const valid = await bcrypt.compare(
            parsed.data.password,
            user.password,
          );
          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified,
          } as {
            id: string;
            email: string;
            name: string | null;
            role: UserRole;
            emailVerified: Date | null;
          };
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.emailVerified =
            (user as { emailVerified?: Date | null }).emailVerified ?? null;

          const existingRole =
            (user as { role?: string }).role ?? "pet_owner";
          const correctRole = resolveRole(user.email ?? "");

          if (correctRole !== existingRole && user.id) {
            await db
              .update(users)
              .set({ role: correctRole })
              .where(eq(users.id, user.id));
          }
          token.role = correctRole;
        }
        return token;
      },
      session({ session, token }) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.emailVerified =
          (token.emailVerified as Date | null | undefined) ?? null;
        return session;
      },
    },
  };
});
