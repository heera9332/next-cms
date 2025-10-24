// app/api/posts/[id]/route.ts
import { PostModel } from "@/packages/core/models/posts/post.model";
import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

interface PostProps {
  params: { id: string };
}

export async function GET(_: Request, { params }: PostProps) {
  const doc = await PostModel.findById(params.id).lean();
  if (!doc) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(doc);
}

export async function PATCH(_req: Request, { params }: PostProps) {
  try {
    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "bad_id" }, { status: 400 });
    }

    const body = await _req.json();
    const update: any = {};

    if (typeof body.title === "string") update.title = body.title;
    if (typeof body.slug === "string") update.slug = body.slug;
    if (typeof body.status === "string") update.status = body.status;
    if (typeof body.visibility === "string")
      update.visibility = body.visibility;
    if (Array.isArray(body.meta)) update.meta = body.meta;
    if (body.content && typeof body.content === "object")
      update.content = body.content;

    update.updatedAt = new Date();

    const doc = await PostModel.findByIdAndUpdate(id, update, {
      new: true,
    }).lean();
    if (!doc) return NextResponse.json({ error: "not_found" }, { status: 404 });

    return NextResponse.json(doc);
  } catch (e) {
    console.error("PATCH /api/posts/:id error:", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

export const DELETE = async (_req: Request, { params }: PostProps) => {
  try {
    const deletedPost = await PostModel.deleteOne({ _id: params.id });
    return NextResponse.json(deletedPost);
  } catch (e) {
    console.error("DELETE /api/posts/:id error:", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
};
