export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { Posts } from "@/packages/core/models/posts/service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "post";
  const rows = await (await import("@/packages/core/models/posts/post.model")).PostModel
    .find({ type, isDeleted: false })
    .sort({ status: 1, publishedAt: -1 })
    .limit(50)
    .lean();
  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const body = await req.json();
  const created = await Posts.create(body);
  return NextResponse.json(created, { status: 201 });
}
