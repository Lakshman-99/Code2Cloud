import { AuthResponse } from "@/types/auth";
import Cookies from "js-cookie";

class TokenManager extends EventTarget {
  constructor() {
    super();
  }

  getAccessToken(): string | null {
    return Cookies.get("accessToken") || null;
  }

  getRefreshToken(): string | null {
    return Cookies.get("refreshToken") || null;
  }

  setTokens(tokens: AuthResponse) {
    // Save tokens (Access: 15 mins, Refresh: 7 days)
    Cookies.set("accessToken", tokens.accessToken, { expires: 1 / 96 }); 
    Cookies.set("refreshToken", tokens.refreshToken, { expires: 7 });
    
    // Notify the app that login happened
    this.dispatchEvent(new Event("change"));
  }

  clearTokens() {
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    
    // Notify the app that logout happened
    this.dispatchEvent(new Event("change"));
  }
}

export const tokenManager = new TokenManager();