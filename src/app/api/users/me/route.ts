export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAccessCookie } from "@/lib/auth/cookies";
import { verifyAccessToken } from "@/lib/jwt";
import { UserModel } from "@/packages/core/models/users/user.model";

export async function GET() {
  try {
    // 1️⃣ Get token from signed cookies
    const token = await getAccessCookie();
    console.log(token)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Verify JWT
    const payload = verifyAccessToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // 3️⃣ Fetch user from DB
    const user = await UserModel.findById(payload.userId)
      .select("-password -refresh_token")
      .lean({ virtuals: true });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4️⃣ Success — return current user
    return NextResponse.json({ user });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("GET /api/users/me error:", err);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
