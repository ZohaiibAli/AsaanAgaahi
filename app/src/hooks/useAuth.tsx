/**
 * Holds the logged-in user (or null) for the whole app. Screens read `user` to decide
 * what to show; `setSession`/`logout` are the only two ways that state changes.
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { clearToken, getToken, me, setToken, User } from "../api";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  setSession: (token: string, user: User) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  ready: false,
  setSession: async () => {},
  setUser: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        try {
          setUserState(await me());
        } catch {
          await clearToken();
        }
      }
      setReady(true);
    })();
  }, []);

  const setSession = async (token: string, user: User) => {
    await setToken(token);
    setUserState(user);
  };

  const logout = async () => {
    await clearToken();
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, ready, setSession, setUser: setUserState, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
