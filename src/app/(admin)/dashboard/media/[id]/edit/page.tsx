// src/app/dashboard/media/[id]/edit/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { PostModel } from "@/packages/core/models/posts/post.model";
import MediaForm, { MediaInitial } from "@/components/media/MediaForm";

interface PageProps {
  params: { id: string };
}

export default async function Page({ params }: PageProps) {
  const { id } = params;
  if (!isValidObjectId(id)) notFound();

  const doc = await PostModel.findById(id).lean();
  if (!doc || doc.type !== "media" || doc.isDeleted) notFound();

  const content = (doc.content ?? {}) as any;

  const initial: MediaInitial = {
    id: String(doc._id),
    title: doc.title ?? "",
    slug: doc.slug ?? "",
    status: doc.status ?? "published",
    visibility: doc.visibility ?? "public",
    url: content.url ?? "",
    mime: content.type ?? "",
    size: Number(content.size ?? 0),
    alt: (doc.meta?.find?.((m: any) => m?.key === "alt")?.value as string) ?? content.alt ?? "",
    caption: (doc.meta?.find?.((m: any) => m?.key === "caption")?.value as string) ?? content.caption ?? "",
    description:
      (doc.meta?.find?.((m: any) => m?.key === "description")?.value as string) ?? content.description ?? "",
  };

  return <MediaForm initial={initial} />;
}
