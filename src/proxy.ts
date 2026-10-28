import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Strictly Protect all /admin routes
  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get("ptm_crm_session_user_v1");
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    try {
      const raw = decodeURIComponent(sessionCookie.value);
      const user = JSON.parse(raw);
      if (!user || user.role !== "admin") {
        // Logged in as member or invalid role, deny admin access
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 2. Strictly Protect all /member routes
  if (pathname.startsWith("/member")) {
    const sessionCookie = request.cookies.get("ptm_crm_session_user_v1");
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    try {
      const raw = decodeURIComponent(sessionCookie.value);
      const user = JSON.parse(raw);
      if (!user || !user.role) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/member",
    "/member/:path*",
  ],
};
