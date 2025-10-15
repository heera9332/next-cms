"use client";

import { useCallback } from "react";
import { useApp } from "./useApp";
import { axios } from "../lib/axios";

export function useUserAuth() {
  const { user, ready, setUser, login, logout } = useApp();

  const register = useCallback(
    async (input: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    }) => {
      const { data } = await axios.post("/api/users/register", {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        password: input.password,
      });
      return data?.user ?? null; // don’t auto-login; follow your UI flow
    },
    []
  );

  const signin = useCallback(
    async (email: string, password: string) => {
      const { data } = await axios.post("/api/users/login", {
        email,
        password,
      });
      login(data?.user ?? null, data?.token); // token ignored (HttpOnly cookie auth)
      return data?.user ?? null;
    },
    [login]
  );

  const signout = useCallback(async () => {
    await logout();
  }, [logout]);

  return { user, ready, setUser, login, logout: signout, register, signin };
}
