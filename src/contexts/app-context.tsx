"use client";

import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { axios } from "@/lib/axios";

export type User = {
  _id: string;
  user_email: string;
  user_login: string;
  display_name: string;
  roles?: string[];
  avatar_url?: string;
  // add more fields if you return them from /api/users/me
};

type AppContextType = {
  user: User | null;
  ready: boolean;                         // true after initial load completes
  setUser: (u: User | null) => void;
  login: (u: User | null, _token?: string) => void; // _token ignored (cookies are HttpOnly)
  logout: () => Promise<void>;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

const LS_KEY = "user";

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const didInit = useRef(false);

  // ---- persist to localStorage (display-only, not a source of truth) ----
  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    try {
      if (u) localStorage.setItem(LS_KEY, JSON.stringify(u));
      else localStorage.removeItem(LS_KEY);
    } catch {}
  }, []);

  // ---- axios: include cookies ----
  axios.defaults.withCredentials = true;

  // ---- axios 401 -> try refresh once, then retry request ----
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => res,
      async (error) => {
        const cfg = error?.config;
        if (!cfg || cfg.__isRetry) throw error;

        const status = error?.response?.status;
        if (status === 401) {
          try {
            await axios.post("/api/users/refresh"); // refresh cookies
            cfg.__isRetry = true;
            return axios(cfg);                      // retry original request
          } catch (e) {
            // refresh failed -> ensure signed out locally
            setUser(null);
          }
        }
        throw error;
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, [setUser]);

  // ---- initial bootstrap: try me(), fallback to LS for instant paint ----
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    // quick paint from LS
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setUserState(JSON.parse(raw));
    } catch {}

    (async () => {
      try {
        const { data } = await axios.get("/api/users/me");
        setUser(data?.user ?? null);
      } catch {
        setUser(null);
      } finally {
        setReady(true);
      }
    })();
  }, [setUser]);

  const login = useCallback((u: User | null, _token?: string) => {
    // server already set cookies; we just cache user
    setUser(u);
  }, [setUser]);

  const logout = useCallback(async () => {
    try { await axios.post("/api/users/logout"); } catch {}
    setUser(null);
  }, [setUser]);

  const value = useMemo<AppContextType>(() => ({
    user, ready, setUser, login, logout
  }), [user, ready, setUser, login, logout]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

