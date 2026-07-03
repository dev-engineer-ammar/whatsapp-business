import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/api/authService";

interface AuthContextValue {
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    authService
      .me()
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsCheckingAuth(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isCheckingAuth,
      async login(username, password) {
        await authService.login(username, password);
        setIsAuthenticated(true);
      },
      async logout() {
        await authService.logout().catch(() => undefined);
        setIsAuthenticated(false);
      },
    }),
    [isAuthenticated, isCheckingAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
