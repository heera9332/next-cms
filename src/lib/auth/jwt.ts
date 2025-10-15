// lib/auth/jwt.ts
import { SignJWT, jwtVerify } from "jose";

const enc = new TextEncoder();
const ISS = process.env.JWT_ISS || "next-cms";
const AUD = process.env.JWT_AUD || "next-cms-users";
const ACCESS_TTL = process.env.ACCESS_TTL || "15m";
const REFRESH_TTL = process.env.REFRESH_TTL || "30d";

const ACCESS_SECRET = enc.encode(process.env.JWT_ACCESS_SECRET!);
const REFRESH_SECRET = enc.encode(process.env.JWT_REFRESH_SECRET!);

export type AccessPayload = { sub: string; role?: string; email?: string };
export type RefreshPayload = { sub: string; ver: string }; // ver = rotation id

export async function signAccess(payload: AccessPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISS).setAudience(AUD)
    .setIssuedAt().setExpirationTime(ACCESS_TTL)
    .sign(ACCESS_SECRET);
}

export async function signRefresh(payload: RefreshPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISS).setAudience(AUD)
    .setIssuedAt().setExpirationTime(REFRESH_TTL)
    .sign(REFRESH_SECRET);
}

export async function verifyAccess(token: string) {
  const { payload } = await jwtVerify(token, ACCESS_SECRET, { issuer: ISS, audience: AUD });
  return payload as unknown as AccessPayload;
}
export async function verifyRefresh(token: string) {
  const { payload } = await jwtVerify(token, REFRESH_SECRET, { issuer: ISS, audience: AUD });
  return payload as unknown as RefreshPayload;
}
