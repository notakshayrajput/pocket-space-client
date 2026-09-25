import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useDispatch } from "react-redux";
import { AuthContext } from "./auth-context";
import { AUTH_CHANGED_EVENT, clearSession, readSession, saveSession } from "./auth-session";
import type { AuthSession, AuthUser } from "./auth-session";
import HttpService from "../services/http-service";
import { clearFileCache } from "../store/features/fileExplorer/fileExplorerSlice";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(readSession);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const dispatch = useDispatch();

  useEffect(() => {
    const sync = () => {
      const next = readSession();
      setSession(next);
      setUser(null);
      setError(null);
      setLoading(!!next);
      dispatch(clearFileCache());
    };
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, sync);
  }, [dispatch]);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    const timer = window.setTimeout(clearSession, Math.max(0, Date.parse(session.expiresAt) - Date.now()));
    HttpService.getInstance(session.accessToken).get<AuthUser>("/auth/me")
      .then(currentUser => { if (active) setUser(currentUser); })
      .catch(() => {
        if (active && readSession()?.accessToken === session.accessToken)
          setError("Could not connect to PocketSpace. Check the server and try again.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [session, attempt]);

  const login = useCallback(async (username: string, password: string) => {
    const result = await HttpService.getInstance().post<AuthSession>("/auth/login", { username, password });
    saveSession(result);
  }, []);

  const signup = useCallback(async (username: string, password: string) => {
    const result = await HttpService.getInstance().post<AuthSession>("/auth/signup", { username, password });
    saveSession(result);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout: clearSession, retry: () => setAttempt(n => n + 1) }}>
      {children}
    </AuthContext.Provider>
  );
}
