import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, tokenStorage } from "./api";

export type UserRole = "admin" | "manager" | "member";

export interface AuthUser {
  id: string;
  role: UserRole;
  tenantId: string;
  exp?: number;
  iat?: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (payload: { email: string; password: string; tenantId: string }) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    tenantId: string;
    role?: UserRole;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeJwt(token: string): AuthUser | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof atob === "function"
        ? decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join(""),
          )
        : Buffer.from(base64, "base64").toString("utf8");
    const parsed = JSON.parse(json) as AuthUser;
    if (parsed.exp && Date.now() / 1000 > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const existing = tokenStorage.get();
    if (existing) {
      const decoded = decodeJwt(existing);
      if (decoded) {
        setToken(existing);
        setUser(decoded);
      } else {
        tokenStorage.clear();
      }
    }
    setIsReady(true);
  }, []);

  const applyToken = useCallback((newToken: string) => {
    tokenStorage.set(newToken);
    setToken(newToken);
    setUser(decodeJwt(newToken));
  }, []);

  const login = useCallback<AuthContextValue["login"]>(
    async ({ email, password, tenantId }) => {
      const { data } = await api.post<{ token: string }>("/api/auth/login", {
        email,
        password,
        tenantId,
      });
      applyToken(data.token);
    },
    [applyToken],
  );

  const register = useCallback<AuthContextValue["register"]>(
    async ({ name, email, password, tenantId, role }) => {
      await api.post("/api/auth/register", { name, email, password, tenantId, role });
      await login({ email, password, tenantId });
    },
    [login],
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      isReady,
      login,
      register,
      logout,
    }),
    [user, token, isReady, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
