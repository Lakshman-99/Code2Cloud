import { useSyncExternalStore } from "react";
import { tokenManager } from "@/lib/token-manager";
import { User } from "@/types/auth";

export function useUser() {
  const user = useSyncExternalStore<User | null>(
    // 1. Subscribe method: React calls this to listen for changes
    (callback) => {
      tokenManager.addEventListener("change", callback);
      return () => tokenManager.removeEventListener("change", callback);
    },
    // 2. Client Snapshot: React calls this to get the current value on the client
    () => tokenManager.getUser(),
    // 3. Server Snapshot: React calls this during Server-Side Rendering
    () => null
  );

  return { user };
}