import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

// Routes starting with these prefixes are always public
const PUBLIC_PREFIXES = [
  "/api/login",
  "/api/register",
  "/api/forgot-password",
  "/api/reset-password",
  "/api/verify-email",
  "/_next",
  "/favicon",
  "/public",
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes through
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  // No token at all → redirect to login
  if (!token && !refreshToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Try to verify access token
  let tokenValid = false;
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      await jwtVerify(token, secret);
      tokenValid = true;
    } catch {
      tokenValid = false;
    }
  }

  // Access token valid → proceed
  if (tokenValid) {
    return NextResponse.next();
  }

  // Access token expired/invalid but refresh token exists → try refresh
  if (refreshToken) {
    try {
      const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);
      await jwtVerify(refreshToken, refreshSecret);

      // Refresh token is valid → call refresh API to get new access token
      const refreshUrl = new URL("/api/auth/refresh", req.url);
      const refreshResponse = await fetch(refreshUrl, {
        method: "POST",
        headers: {
          cookie: `refreshToken=${refreshToken}`,
        },
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const newToken = data.token;

        // Continue with new token set in cookie
        const response = NextResponse.next();
        response.cookies.set({
          name: "token",
          value: newToken,
          httpOnly: true,
          maxAge: 24 * 60 * 60, // 1 day
          sameSite: "lax",
          path: "/",
          secure: process.env.NODE_ENV === "production",
        });
        return response;
      }
    } catch {
      // Refresh token also expired/invalid
    }
  }

  // Both tokens invalid → redirect to login
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("redirect", pathname);
  const response = NextResponse.redirect(loginUrl);
  // Clear expired cookies
  response.cookies.delete("token");
  response.cookies.delete("refreshToken");
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
