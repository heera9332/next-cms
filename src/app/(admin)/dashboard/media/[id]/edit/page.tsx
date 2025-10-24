// src/app/dashboard/media/[id]/edit/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { PostModel } from "@/packages/core/models/posts/post.model";
import MediaForm, { MediaInitial } from "@/components/media/MediaForm";

function guessMimeFromExt(url?: string) {
  if (!url) return "";
  const ext = url.split("?")[0].split("#")[0].split(".").pop()?.toLowerCase() || "";
  if (["png"].includes(ext)) return "image/png";
  if (["jpg", "jpeg", "jfif", "pjpeg", "pjp"].includes(ext)) return "image/jpeg";
  if (["webp"].includes(ext)) return "image/webp";
  if (["gif"].includes(ext)) return "image/gif";
  if (["svg"].includes(ext)) return "image/svg+xml";
  if (["mp4", "m4v"].includes(ext)) return "video/mp4";
  if (["webm"].includes(ext)) return "video/webm";
  if (["mp3"].includes(ext)) return "audio/mpeg";
  if (["wav"].includes(ext)) return "audio/wav";
  if (["ogg"].includes(ext)) return "audio/ogg";
  if (["pdf"].includes(ext)) return "application/pdf";
  return "";
}

function resolveMediaFields(doc: any) {
  const c = (doc?.content ?? {}) as any;

  // a) canonical
  let url = c.url ?? "";
  let mime = c.type ?? c.mime ?? "";
  let size = Number(c.size ?? 0);

  // b) common alt shapes (file, src, href)
  url ||= c.file?.url ?? c.src ?? c.href ?? "";

  // c) EditorJS-ish shapes inside blocks
  if (!url && Array.isArray(c.blocks)) {
    for (const b of c.blocks) {
      const u =
        b?.data?.file?.url ||
        b?.data?.url ||
        b?.data?.src ||
        b?.file?.url ||
        b?.url;
      if (u) {
        url = u;
        mime ||= b?.data?.file?.mime || b?.data?.mime || b?.mime || "";
        size ||= Number(b?.data?.file?.size ?? b?.data?.size ?? b?.size ?? 0);
        break;
      }
    }
  }

  // d) top-level fallbacks (rare)
  url ||= doc?.url || doc?.media?.url || "";

  // e) derive mime from extension if still empty
  mime ||= guessMimeFromExt(url);

  return { url, mime, size: Number(size || 0) };
}

interface PageProps { params: { id: string } }

export default async function Page({ params }: PageProps) {
  const { id } = params;
  if (!isValidObjectId(id)) notFound();

  const doc = await PostModel.findById(id).lean();
  console.log("editing posts > ", doc)
  if (!doc || doc.type !== "media" || doc.isDeleted) notFound();

  const { url, mime, size } = resolveMediaFields(doc);

  const initial: MediaInitial = {
    id: String(doc._id),
    title: doc.title ?? "",
    slug: doc.slug ?? "",
    status: doc.status ?? "published",
    visibility: doc.visibility ?? "public",
    url,
    mime,
    size,
    alt:
      doc?.meta?.find?.((m: any) => m?.key === "alt")?.value ??
      doc?.content?.alt ?? "",
    caption:
      doc?.meta?.find?.((m: any) => m?.key === "caption")?.value ??
      doc?.content?.caption ?? "",
    description:
      doc?.meta?.find?.((m: any) => m?.key === "description")?.value ??
      doc?.content?.description ?? "",
  };

  return <MediaForm initial={initial} />;
}
