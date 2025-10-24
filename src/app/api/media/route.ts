// /app/api/media/route.ts
import { NextResponse } from "next/server";
import { createWriteStream } from "fs";
import { randomUUID } from "crypto";
import path from "path";
import { mkdir } from "fs/promises";
import { isValidObjectId } from "mongoose";
import { PostModel } from "@/packages/core/models/posts/post.model";

async function saveToUploads(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const filename = `${Date.now()}-${randomUUID()}-${safeName}`;
  const filepath = path.join(uploadDir, filename);

  await new Promise<void>((resolve, reject) => {
    const out = createWriteStream(filepath);
    out.on("finish", resolve);
    out.on("error", reject);
    out.end(bytes);
  });

  const publicUrl = `/uploads/${filename}`;
  return { publicUrl, filename };
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const postId = (form.get("postId") as string | null) || null; // optional for REPLACE mode

    if (!file) {
      return NextResponse.json({ error: "no_file" }, { status: 400 });
    }

    const { publicUrl } = await saveToUploads(file);

    // --- REPLACE mode ---
    if (postId) {
      if (!isValidObjectId(postId)) {
        return NextResponse.json({ error: "bad_id" }, { status: 400 });
      }

      const doc = await PostModel.findById(postId);
      if (!doc || doc.type !== "media" || doc.isDeleted) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }

      doc.set("content", {
        ...(doc.content || {}),
        url: publicUrl,
        size: file.size,
        type: file.type,
        name: file.name,
      });
      // keep helpful meta in sync, optional
      doc.set(
        "meta",
        [
          { key: "mime_type", value: file.type },
          { key: "size", value: file.size },
          { key: "original_name", value: file.name },
        ].filter(Boolean)
      );
      await doc.save();

      return NextResponse.json(
        {
          mode: "replace",
          url: publicUrl,
          media: {
            id: doc._id,
            title: doc.title,
            type: doc.type,
            url: publicUrl,
            mime: file.type,
            size: file.size,
          },
        },
        { status: 200 }
      );
    }

    // --- CREATE mode ---
    const created = await PostModel.create({
      title: file.name,
      slug: `${Date.now()}-${randomUUID()}-${file.name.replace(/[^\w.\-]+/g, "_")}`,
      type: "media",
      status: "published",
      visibility: "public",
      excerpt: "",
      content: {
        url: publicUrl,
        size: file.size,
        type: file.type,
        name: file.name,
      },
      meta: [
        { key: "mime_type", value: file.type },
        { key: "size", value: file.size },
        { key: "original_name", value: file.name },
      ],
      isDeleted: false,
    });

    return NextResponse.json(
      {
        mode: "create",
        url: publicUrl,
        media: {
          id: created._id,
          title: created.title,
          type: created.type,
          url: publicUrl,
          mime: file.type,
          size: file.size,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ ok: false, error: "upload_failed" }, { status: 500 });
  }
}
