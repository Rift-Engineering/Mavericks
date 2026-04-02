import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
const COOKIE_NAME = "tm_session";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

const publicPaths = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/mavericks_logo.png" ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout")
  ) {
    return NextResponse.next();
  }

  if (publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const secret = getSecret();
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token && secret) {
      try {
        await jwtVerify(token, secret);
        return NextResponse.redirect(new URL("/", request.url));
      } catch {
        // not logged in or invalid token — stay on login
      }
    }
    return NextResponse.next();
  }

  const secret = getSecret();
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!secret || !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string | undefined;

    if (
      pathname === "/admin/attendance" ||
      pathname.startsWith("/admin/attendance/")
    ) {
      return NextResponse.redirect(new URL("/attendance", request.url));
    }

    const isAdminPage =
      pathname.startsWith("/admin") ||
      pathname === "/sessions/new" ||
      (pathname.includes("/sessions/") &&
        (pathname.endsWith("/assignments") || pathname.endsWith("/edit")));

    if (isAdminPage && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
