import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Pages that don't require authentication
const PUBLIC_ROUTES = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

// API routes and prefixes that are always public
const PUBLIC_API_PREFIXES = [
  "/api/login",
  "/api/register",
  "/api/forgot-password",
  "/api/reset-password",
  "/api/verify-email",
  "/api/auth/refresh",
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  // All /api/ routes are public at middleware level
  // (API handlers return 401 themselves, SessionGuard handles redirect)
  if (pathname.startsWith("/api/")) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes and all API routes through
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  // No tokens at all → redirect to login immediately
  if (!token && !refreshToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Try to verify access token
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      await jwtVerify(token, secret);
      // Token valid → allow through
      return NextResponse.next();
    } catch {
      // Token invalid/expired — fall through
    }
  }

  // Access token expired but refresh token might be valid
  // Allow the page to load — SessionGuard (client-side) will call /api/auth/refresh
  if (refreshToken) {
    try {
      const refreshSecret = new TextEncoder().encode(
        process.env.JWT_REFRESH_SECRET!
      );
      await jwtVerify(refreshToken, refreshSecret);
      // Refresh token still valid → allow page load, client will refresh silently
      return NextResponse.next();
    } catch {
      // Refresh token also expired
    }
  }

  // Both tokens invalid → redirect to login
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("redirect", pathname);
  loginUrl.searchParams.set("reason", "session_expired");
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete("token");
  response.cookies.delete("refreshToken");
  return response;
}

export const config = {
  matcher: [
    // Match all paths except static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
