export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { UserModel } from "@/packages/core/models/users/user.model";

function toPosInt(val: string | null, def: number, min = 1, max = 100) {
  const n = Number.parseInt(String(val ?? ""), 10);
  if (Number.isNaN(n)) return def;
  return Math.min(max, Math.max(min, n));
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") || "").trim();
    const page = toPosInt(searchParams.get("page"), 1, 1, 10_000);
    const limit = toPosInt(searchParams.get("limit"), 20, 1, 100);
    const skip = (page - 1) * limit;

    // Base filter
    const filter: Record<string, any> = { isDeleted: { $ne: true } };

    // Text search (regex) if q present (min 2 chars)
    if (q.length >= 2) {
      const rx = new RegExp(escapeRegExp(q), "i");
      filter.$or = [{ name: rx }, { email: rx }, { username: rx }];
    }

    // If you later want to filter by status, uncomment and adapt:
    // const status = (searchParams.get("status") || "all").trim() as Status;
    // if (status !== "all") filter.status = status;

    // Query users (avoid returning sensitive fields)
    const query = UserModel.find(filter)
      .select("-password -hash -salt -resetToken -__v") // adjust to your schema
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const [items, total] = await Promise.all([
      query,
      UserModel.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const hasNext = page * limit < total;
    const hasPrev = page > 1;

    return NextResponse.json({
      docs: items,
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch users",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
