// export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { PostModel } from "@/packages/core/models/posts/post.model";

type Status = "draft" | "published" | "private" | "archived" | "all";

function toPosInt(val: string | null, def: number, min = 1, max = 100) {
  const n = Number.parseInt(String(val ?? ""), 10);
  if (Number.isNaN(n)) return def;
  return Math.min(max, Math.max(min, n));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") || "post").trim();
    const q = (searchParams.get("q") || "").trim();
    const status = (searchParams.get("status") || "all").trim() as Status;

    const page = toPosInt(searchParams.get("page"), 1, 1, 10_000);
    const limit = toPosInt(searchParams.get("limit"), 20, 1, 100);
    const skip = (page - 1) * limit;

    const filter: any = { type, isDeleted: false };
    const useText = q.length >= 3;

    if (q) {
      if (useText) {
        // requires a text index on fields (title/slug/excerpt/content)
        filter.$text = { $search: q };
      } else {
        // short query fallback (case-insensitive partial)
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [
          { title: rx },
          { slug: rx },
          { excerpt: rx }, 
        ];
      }
    }

    if (status !== "all") filter.status = status;

    const projection = useText ? { score: { $meta: "textScore" } } : {};
    const sort = useText
      ? {
          score: { $meta: "textScore" },
          status: 1,
          publishedAt: -1,
          updatedAt: -1,
        }
      : { status: 1, publishedAt: -1, updatedAt: -1 };

    const [items, total] = await Promise.all([
      PostModel.find(filter, projection)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      PostModel.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      docs: items,
      page,
      limit,
      total,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages,
      q,
      status,
      type,
    });
  } catch (err) {
    console.error("GET /api/posts error:", err);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // You can validate/sanitize `body` here.
    const created = await PostModel.create(body);
    return NextResponse.json({ item: created }, { status: 201 });
  } catch (err) {
    console.error("POST /api/posts error:", err);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 400 }
    );
  }
}
