import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value || false; 

  // If there is no token and the user is trying to access a protected route
  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return NextResponse.next();
}

// Limit the middleware to specific paths
export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};
