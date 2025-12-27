"use client";

import { tokenManager } from "@/lib/token-manager";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && refreshToken) {
      // Use your existing TokenManager to save cookies & notify listeners
      tokenManager.setTokens({ accessToken, refreshToken });
      
      // Redirect to dashboard
      router.push("/dashboard");
    } else {
      // Error handling
      router.push("/auth?error=oauth_failed");
    }
  }, [router, searchParams]);

  return null;
}
