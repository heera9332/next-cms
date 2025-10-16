// app/api/posts/[id]/route.ts
import { PostModel } from "@/packages/core/models/posts/post.model";
import { zPost } from "@/packages/core/models/posts/post.schema";

export async function GET(_: Request, { params }: { params: { id: string }}) {
  const doc = await PostModel.findById(params.id).lean();
  if (!doc) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(doc);
}

export async function PATCH(req: Request, { params }: { params: { id: string }}) {
  const patch = await req.json();
  const parsed = zPost.partial().safeParse(patch);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  const updated = await PostModel.findByIdAndUpdate(params.id, parsed.data, { new: true });
  if (!updated) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string }}) {
  await PostModel.findByIdAndDelete(params.id);
  return Response.json({ ok: true });
}
