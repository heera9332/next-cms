export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createWriteStream } from "fs";
import { randomUUID } from "crypto";
import path from "path";
import { mkdir } from "fs/promises";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "no_file" }, { status: 400 });

  // ⚠️ example: local disk; replace with S3/R2 in production
  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const filename = `${Date.now()}-${randomUUID()}-${file.name}`;
  const filepath = path.join(uploadDir, filename);
  await new Promise<void>((resolve, reject) => {
    const out = createWriteStream(filepath);
    out.on("finish", resolve);
    out.on("error", reject);
    out.end(bytes);
  });

  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
}
