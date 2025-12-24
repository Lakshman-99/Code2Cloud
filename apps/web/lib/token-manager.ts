import { AuthResponse, User } from "@/types/auth";
import Cookies from "js-cookie";
import { decodeJwt } from "jose";

class TokenManager extends EventTarget { // Extend EventTarget for easy events
  private cachedUser: User | null = null;
  private cachedToken: string | null = null;

  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return Cookies.get("accessToken") || null;
  }

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return Cookies.get("refreshToken") || null;
  }

  setTokens(tokens: AuthResponse) {
    if (typeof window === "undefined") return;
    Cookies.set("accessToken", tokens.accessToken, { expires: 1/96 }); 
    Cookies.set("refreshToken", tokens.refreshToken, { expires: 7 });
    
    // Notify listeners that data changed
    this.dispatchEvent(new Event("change"));
  }

  clearTokens() {
    if (typeof window === "undefined") return;
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    
    // Notify listeners
    this.dispatchEvent(new Event("change"));
  }

  getUser(): User | null {
    const currentToken = this.getAccessToken();

    if (currentToken === this.cachedToken) {
      return this.cachedUser;
    }

    // Token changed (or first run), update cache
    this.cachedToken = currentToken;

    if (!currentToken) {
      this.cachedUser = null;
      return null;
    }

    try {
      const payload = decodeJwt(currentToken);
      console.log("Decoded JWT payload:", payload);
      this.cachedUser = {
        id: String(payload.sub),
        email: String(payload.email),
        name: String(payload.name || ""),
        avatar: String(payload.avatar || ""),
      };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      this.cachedUser = null;
    }

    return this.cachedUser;
  }
}

export const tokenManager = new TokenManager();