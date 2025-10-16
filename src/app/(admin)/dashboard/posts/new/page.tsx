export const runtime = "nodejs";

import { redirect } from "next/navigation";
import { PostModel } from "@/packages/core/models/posts/post.model";
import { slugify } from "@/lib/slugify";

export default async function Page() {
  // Basic unique slug for brand-new untitled drafts
  const base = "untitled";
  const candidate = `${base}-${Date.now()}`;

  const doc = await PostModel.create({
    type: "post",
    title: "Untitled",
    slug: slugify(candidate),
    excerpt: "",
    content: { time: Date.now(), blocks: [], version: "2.x" },
    status: "draft",
    visibility: "public",
    locale: "en",
    taxonomies: { categories: [], tags: [] },
    parentId: null,
    menuOrder: 0,
  });

  console.log("create doc > ", doc)

  // your editor route as requested:
  redirect(`/dashboard/posts/${doc.id}/edit`);
}
