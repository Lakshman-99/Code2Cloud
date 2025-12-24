"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tokenManager } from "@/lib/token-manager";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
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

  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Finalizing authentication...</p>
      </div>
    </div>
  );
}