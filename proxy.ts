import { auth } from "@/lib/auth/edge";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";

const intlMiddleware = createIntlMiddleware(routing);

// All portal routes live under /portal/ so this stays a single prefix entry.
// IMPORTANT: New portal routes must be nested under /portal/ — do not add
// individual paths here.
const PORTAL_PREFIXES = ["/portal", "/admin"];

// API routes that require authentication (pet/health data, etc.)
// /api/auth/* is handled separately (always public)
// /api/account (registration) and /api/public/* are intentionally public
const PRIVATE_API_PREFIXES = [
  "/api/pets",
  "/api/health",
  "/api/vaccinations",
  "/api/medications",
  "/api/vets",
  "/api/sitters",
  "/api/bookings",
  "/api/reviews",
  "/api/cron",
  "/api/admin",
];

// Non-localized auth pages — bypass intl routing entirely
const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const dest =
    session?.user.role === "admin" ? "/admin/users" : "/portal/dashboard";

  // ── NextAuth API routes — always public ──────────────────────────────────
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // ── Portal / admin / private API ─────────────────────────────────────────
  const isPrivate =
    PORTAL_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    PRIVATE_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isPrivate) {
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

  // ── Non-localized auth pages ─────────────────────────────────────────────
  // These live at /login, /register etc. — serve directly, skip intl routing.
  // Redirect already-logged-in users to their dashboard.
  if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (session) return NextResponse.redirect(new URL(dest, req.url));
    return NextResponse.next();
  }

  // ── API routes not already handled above — pass through, no locale routing
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ── Marketing site: locale routing ───────────────────────────────────────
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon|icon|opengraph-image|robots\\.txt|sitemap\\.xml|.*\\..*).*)",
  ],
};
