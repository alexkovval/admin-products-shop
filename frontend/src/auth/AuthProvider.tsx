import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { login } from "../api/client";
import { AuthContext } from "./AuthContext";
import { clearTokens, hasSession, setTokens, subscribeToTokens } from "./tokens";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  // Re-renders whenever tokens change, including when the client clears them after a failed refresh.
  const isAuthenticated = useSyncExternalStore(subscribeToTokens, hasSession);

  const signIn = useCallback(async (username: string, password: string) => {
    const tokens = await login(username, password);
    setTokens(tokens.access, tokens.refresh);
  }, []);

  const signOut = useCallback(() => {
    clearTokens();
    queryClient.clear(); // don't leave the previous user's data in the cache
  }, [queryClient]);

  const value = useMemo(() => ({ isAuthenticated, signIn, signOut }), [isAuthenticated, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
