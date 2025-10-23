import { NextResponse } from "next/server";
import { createWriteStream } from "fs";
import { randomUUID } from "crypto";
import path from "path";
import { mkdir } from "fs/promises";
import { PostModel } from "@/packages/core/models/posts/post.model";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "no_file" }, { status: 400 });
    }

    // --- Save file to /public/uploads ---
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

    // --- Create Media/Attachment post ---
    const created = await PostModel.create({
      title: file.name,
      slug: filename,
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