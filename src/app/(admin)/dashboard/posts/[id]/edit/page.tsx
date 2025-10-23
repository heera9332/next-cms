// src/app/dashboard/posts/[id]/edit/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { PostModel } from "@/packages/core/models/posts/post.model";
import EditorClient from "./page.client";

interface PageProps {
  params: { id: string };
}

export default async function Page({ params }: PageProps) {
  const { id } = params;

  if (!isValidObjectId(id)) {
    notFound();
  }

  const post = await PostModel.findById(id).lean<{ 
    _id: any;
    title?: string;
    slug?: string;
    status: string;
    visibility?: string;
    excerpt?: string;
    menuOrder?: number;
    parentId?: any | null;
    content?: any;
  }>();

  if (!post) {
    notFound();
  }

  const initial = {
    id: String(post._id),
    title: post.title ?? "",
    slug: post.slug ?? "",
    status: post.status,
    visibility: post.visibility ?? "public",
    excerpt: post.excerpt ?? "",
    menuOrder: post.menuOrder ?? 0,
    parentId: post.parentId ? String(post.parentId) : null,
    content: post.content ?? { time: Date.now(), blocks: [], version: "2.x" },
  };

  return (
    <div>
      <h1 className="font-bold text-2xl">Edit Post</h1>
      <EditorClient initial={initial} />
    </div>
  );
}
