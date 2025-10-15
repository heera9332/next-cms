import { notFound } from "next/navigation";
import { PostModel } from "@/packages/core/models/posts/post.model"; // adjust path
import EditorClient from "./_EditorClient";

export default async  function Page({ params }: { params: { id: string } }) {
  const post = await PostModel.findById(params.id).lean({ virtuals: true });
  if (!post) return notFound();

  const initial = {
    id: String(post._id),
    title: post.title ?? "",
    slug: post.slug ?? "",
    status: post.status,
    visibility: post.visibility,
    excerpt: post.excerpt ?? "",
    menuOrder: post.menuOrder ?? 0,
    parentId: post.parentId ? String(post.parentId) : null,
    content: post.content ?? { time: Date.now(), blocks: [], version: "2.x" },
  };

  return (
    <div>
      <h1 className="font-bold text-2xl">Posts edit</h1>
      <EditorClient initial={initial} />
    </div>
  );
}
