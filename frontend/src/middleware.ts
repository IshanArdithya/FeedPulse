import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_NAME = "feedpulse_admin_token";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(TOKEN_NAME)?.value;
  const isLoginPage = request.nextUrl.pathname === "/admin";
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");

  if (isLoginPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (isDashboardPage && !token) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/dashboard", "/dashboard/:path*"],
};
