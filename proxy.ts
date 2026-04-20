import { auth } from "@/lib/auth/edge";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";

const intlMiddleware = createIntlMiddleware(routing);

// All portal routes live under /portal/ so this stays a single prefix entry.
// IMPORTANT: New portal routes must be nested under /portal/ — do not add
// individual paths here.
const PORTAL_PREFIXES = ["/portal", "/admin", "/api"];

// Auth paths under locale prefixes (e.g. /de/login) — redirect logged-in users away
const LOCALE_AUTH_SUFFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const dest =
    session?.user.role === "admin" ? "/admin/users" : "/portal/dashboard";

  // ── Portal / admin / API ──────────────────────────────────────────────────
  if (
    PORTAL_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(p + "/"),
    )
  ) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (pathname.startsWith("/admin") && session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/portal/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // ── Marketing / auth: locale routing ─────────────────────────────────────

  // Redirect logged-in users away from locale-prefixed auth pages
  const isLocaleAuthPath = LOCALE_AUTH_SUFFIXES.some((suffix) =>
    routing.locales.some(
      (locale) =>
        pathname === `/${locale}${suffix}` ||
        pathname.startsWith(`/${locale}${suffix}/`),
    ),
  );
  if (session && isLocaleAuthPath) {
    return NextResponse.redirect(new URL(dest, req.url));
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon|icon|opengraph-image|robots\\.txt|sitemap\\.xml|.*\\..*).*)",
  ],
};
