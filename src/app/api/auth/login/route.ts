export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Users } from "@/packages/core/models/users/user.model";
import { signAccess, signRefresh } from "@/lib/auth/jwt";
import { setAccessCookie, setRefreshCookie } from "@/lib/auth/cookies";
import { issueNewRefreshVersion } from "@/packages/core/models/users/auth-meta";

const zBody = z.object({ identifier: z.string().min(3), password: z.string().min(8) });

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = zBody.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const user = await Users.byLoginOrEmail(parsed.data.identifier);
  if (!user) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });

  const ok = await Users.verifyPassword(user._id.toString(), parsed.data.password);
  if (!ok) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });

  const ver = await issueNewRefreshVersion(user._id.toString());
  const access = await signAccess({ sub: user._id.toString(), role: user.roles?.[0], email: user.user_email });
  const refresh = await signRefresh({ sub: user._id.toString(), ver });

  const res = NextResponse.json({ user });
  setAccessCookie(access);
  setRefreshCookie(refresh);
  return res;
}
