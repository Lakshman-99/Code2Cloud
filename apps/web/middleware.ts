// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { FetchClient } from "@/lib/fetch-client"; 
import { AuthResponse } from "@/types/auth";

// Helper to get secret
const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) return new TextEncoder().encode("fallback_secret");
  return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // 1. Verify Access Token
  let isAccessValid = false;
  if (accessToken) {
    try {
      await jwtVerify(accessToken, getJwtSecretKey());
      isAccessValid = true;
    } catch {
      isAccessValid = false;
    }
  }

  if (isAccessValid) {
    return NextResponse.next();
  }

  // 2. Refresh Logic using Api Client
  if (!accessToken && !refreshToken) {
    return redirectToLogin(request);
  }

  if (refreshToken) {
    try {
      // Create a fresh client instance for Middleware usage
      const middlewareApi = new FetchClient({
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
      });

      // Call the backend using our standardized client
      // We pass skipAuth: true because TokenManager doesn't work here
      // We manually attach the Refresh Token header
      const data = await middlewareApi.post<AuthResponse>("/auth/refresh", undefined, {
        skipAuth: true,
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      const res = NextResponse.next();

      // Update Cookies
      res.cookies.set("accessToken", data.accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60,
      });

      res.cookies.set("refreshToken", data.refreshToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
      });

      return res;

    } catch (error) {
      console.error("Middleware Refresh Error:", error);
      return redirectToLogin(request);
    }
  }

  return redirectToLogin(request);
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/auth", request.url);
  // Add the 'from' param so we can redirect back after login
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  
  return NextResponse.redirect(loginUrl);
}

// --- THE SOURCE OF TRUTH ---
export const config = {
  // Add new protected routes here, and the logic above automatically applies.
  matcher: [
      "/dashboard/:path*", 
      "/profile/:path*",
      "/settings/:path*",
  ],
};