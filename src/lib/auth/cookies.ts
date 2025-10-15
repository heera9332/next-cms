// lib/auth/cookies.ts
import { cookies } from "next/headers";

const isProd = process.env.NODE_ENV === "production";

export const COOKIE_ACCESS = "ncms_access";
export const COOKIE_REFRESH = "ncms_refresh";

export async function setAccessCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_ACCESS, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  });
}

export async function setRefreshCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_REFRESH, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAuthCookies() {
  const store = await cookies();
  store.delete(COOKIE_ACCESS);
  store.delete(COOKIE_REFRESH);
}

export async function getAccessCookie() {
  const store = await cookies();
  return store.get(COOKIE_ACCESS)?.value || null;
}

export async function getRefreshCookie() {
  const store = await cookies();
  return store.get(COOKIE_REFRESH)?.value || null;
}
