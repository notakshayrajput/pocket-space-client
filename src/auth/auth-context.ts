import { createContext, useContext } from "react";
import type { AuthUser } from "./auth-session";

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth requires AuthProvider");
  return auth;
}
