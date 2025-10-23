import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth/cookies";

/**
 * DELETE /api/auth/logout
 * Clears both access and refresh tokens.
 */
export async function DELETE() {
  try {
    await clearAuthCookies();

    return NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to logout" },
      { status: 500 }
    );
  }
}
