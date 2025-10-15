// packages/core/posts/zod.ts
import { z } from "zod";

/** ---------- Common ---------- */
export const zObjectId = z.string().regex(/^[a-f0-9]{24}$/);

export const zPostStatus = z.enum(["draft", "published", "private", "archived"]);
export const zPostVisibility = z.enum(["public", "private", "password"]);

/** ---------- Editor.js ---------- */
const zEditorBlock = z.object({
  id: z.string().optional(),
  type: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
  tunes: z.record(z.string(), z.unknown()).optional(),
});

export const zEditorJs = z.object({
  time: z.number().optional(),
  blocks: z.array(zEditorBlock).default([]),
  version: z.string().optional(),
});

/** ---------- Core Post ---------- */
export const zPostBase = z.object({
  type: z.string().min(1).default("post"),         // "post" | "page" | "custom"
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(1),
  excerpt: z.string().max(500).optional(),
  content: zEditorJs,                               // Editor.js content
  authorId: zObjectId.optional(),
  status: zPostStatus.default("draft"),
  visibility: zPostVisibility.default("public"),
  password: z.string().min(4).optional(),           // used when visibility="password"
  locale: z.string().default("en"),
  featuredMediaId: zObjectId.optional(),
  taxonomies: z
    .object({
      categories: z.array(z.string()).default([]),
      tags: z.array(z.string()).default([]),
    })
    .default({ categories: [], tags: [] }),
  // hierarchy
  parentId: zObjectId.optional().nullable(),
  menuOrder: z.number().int().default(0),
  // scheduling
  publishedAt: z.date().optional(),
  // soft-deletes
  isDeleted: z.boolean().default(false),
});

export const zPost = zPostBase.extend({
  _id: zObjectId.optional(),
  ancestors: z.array(zObjectId).default([]), // materialized path for hierarchy
  // computed fields may be stored too
});

export type Post = z.infer<typeof zPost>;

/** ---------- Create/Update ---------- */
export const zPostCreate = zPostBase.extend({
  // allow optional slug: if missing, you can slugify title in service
});
export const zPostUpdate = zPost.partial().omit({ _id: true, ancestors: true });

/** ---------- Meta (WP-like) ---------- */
export const zPostMeta = z.object({
  _id: zObjectId.optional(),
  post_id: zObjectId,
  meta_key: z.string().min(1).max(191),
  meta_value: z.any(), // JSON-serializable
});

/** ---------- Revisions ---------- */
export const zPostRevision = z.object({
  _id: zObjectId.optional(),
  post_id: zObjectId,
  rev: z.number().int().min(1),
  snapshot: z.any(),         // full doc snapshot (lean) or subset (title, content, meta)
  createdAt: z.date().default(() => new Date()),
  authorId: zObjectId.optional(),
});
