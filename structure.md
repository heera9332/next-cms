# High-level architecture

* **Monorepo (single app)**: `/app` for routes (admin + frontend + APIs), `/packages/core` for domain models, hooks, RBAC, utils, `/packages/plugins` for optional features.
* **Data**: MongoDB (Atlas). Mongoose for ODM. Atlas Search (optional).
* **Auth**: Auth.js (NextAuth v5) with JWT session; email/password + OAuth providers.
* **RBAC**: roles, permissions, capability checks; route & API guards.
* **Content**: Post, Page, Media, Taxonomy (category, tag), Menu, User, Role, Setting, Revision.
* **Editor**: tiptap or editor.js (block JSON) stored as `content.blocks`; server renders to HTML.
* **Media**: upload to S3 (or R2). Store URLs + metadata in `media` collection. Image optimization via `next/image`.
* **Cache & revalidation**: tag-based ISR (`revalidateTag`) + Redis (optional) for hot paths. Invalidate tags on mutations.
* **i18n**: optional locale field per doc + localized slugs; route groups `/[locale]`.
* **Extensibility**: WP-like **actions/filters** bus; lightweight plugin system.
* **SEO**: dynamic OpenGraph, canonical, sitemap.xml, robots.txt, RSS.
* **Migrations/seed**: `migrate-mongo` + idempotent seeds.
* **Observability**: pino logs, request/DB timing, audit logs on mutations.
* **Security**: CSRF for admin POST, rate limit, input validation (Zod), file type/size checks, strict CORS for APIs.

---

# Repo layout

```
cms/
├─ app/
│  ├─ (frontend)/
│  │  ├─ blog/[slug]/page.tsx
│  │  ├─ page.tsx
│  ├─ (admin)/
│  │  ├─ layout.tsx
│  │  ├─ dashboard/page.tsx
│  │  ├─ content/posts/page.tsx
│  │  ├─ media/page.tsx
│  │  └─ settings/page.tsx
│  ├─ api/
│  │  ├─ posts/route.ts        # GET(list)/POST(create)
│  │  ├─ posts/[id]/route.ts   # GET/PUT/PATCH/DELETE
│  │  ├─ media/route.ts
│  │  ├─ auth/[...nextauth]/route.ts
│  │  └─ revalidate/route.ts   # admin-only, calls revalidateTag
│  ├─ sitemap.ts
│  ├─ robots.ts
│  └─ rss.xml/route.ts
├─ packages/
│  ├─ core/
│  │  ├─ db/connection.ts
│  │  ├─ auth/rbac.ts
│  │  ├─ content/types.ts       # generated from zod
│  │  ├─ content/zod.ts         # source of truth
│  │  ├─ content/mongoose.ts    # zod→mongoose schema
│  │  ├─ hooks/bus.ts           # actions/filters
│  │  ├─ services/*.ts
│  │  └─ utils/*.ts
│  └─ plugins/
│     ├─ seo/
│     │  ├─ index.ts            # registers filters, extra fields
│     └─ webhooks/
│        └─ index.ts
├─ components/ (shadcn/ui + CMS widgets)
├─ styles/
├─ lib/ (fetchers, caching, middleware)
└─ scripts/ (migrations, seeds)
```

---

# Type-first models (Zod → Types → Mongoose)

Use **Zod** as the schema source, then generate:

* TS types directly from Zod (`z.infer`).
* OpenAPI (optional) via `@asteasolutions/zod-to-openapi`.
* Mongoose Schema via `mongoose-zod` (small helper lib) or a tiny adapter.

```ts
// packages/core/content/zod.ts
import { z } from "zod";

export const zId = z.string().regex(/^[a-f0-9]{24}$/).optional();

export const zBase = z.object({
  _id: zId,
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  status: z.enum(["draft","published","archived"]).default("draft"),
  locale: z.string().default("en"),
});

export const zSlug = z.string().min(1).regex(/^[a-z0-9-]+$/);

export const zBlock = z.object({
  type: z.string(),
  attrs: z.record(z.any()).optional(),
  content: z.array(z.any()).optional(),
});

export const zPost = zBase.extend({
  type: z.literal("post"),
  title: z.string().min(1),
  slug: zSlug,
  excerpt: z.string().max(300).optional(),
  content: z.object({ blocks: z.array(zBlock).default([]) }),
  authorId: zId,
  taxonomies: z.object({
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
  }).default({ categories:[], tags:[] }),
  featuredMediaId: zId,
  publishedAt: z.date().optional(),
  meta: z.object({
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    ogImage: z.string().url().optional(),
  }).optional(),
});

export const zPage = zPost.extend({ type: z.literal("page") });
export const zMedia = zBase.extend({
  type: z.literal("media"),
  url: z.string().url(),
  mime: z.string(),
  size: z.number().max(10 * 1024 * 1024),
  width: z.number().optional(),
  height: z.number().optional(),
  alt: z.string().optional(),
  hash: z.string().optional(),
});

export type Post = z.infer<typeof zPost>;
export type Page = z.infer<typeof zPage>;
export type Media = z.infer<typeof zMedia>;
```

```ts
// packages/core/content/mongoose.ts
import mongoose, { Schema } from "mongoose";
import { zPost, zPage, zMedia } from "./zod";

const baseOpts = { timestamps: true };

const Block = new Schema({ type: String, attrs: Object, content: [Schema.Types.Mixed] }, { _id:false });
const Content = new Schema({ blocks: { type: [Block], default: [] }}, { _id:false });

const PostSchema = new Schema({
  type: { type: String, enum:["post","page"], required: true },
  title: { type: String, required: true },
  slug: { type: String, index: true, unique: true },
  excerpt: String,
  content: { type: Content, default: () => ({ blocks: [] }) },
  authorId: { type: Schema.Types.ObjectId, ref: "User" },
  taxonomies: {
    categories: { type: [String], default: [] },
    tags: { type: [String], default: [] },
  },
  featuredMediaId: { type: Schema.Types.ObjectId, ref: "Media" },
  status: { type: String, enum:["draft","published","archived"], default: "draft", index: true },
  locale: { type: String, default: "en", index: true },
  publishedAt: Date,
  meta: {
    ogTitle: String,
    ogDescription: String,
    ogImage: String,
  }
}, { ...baseOpts });

PostSchema.index({ status: 1, locale: 1, publishedAt: -1 });
PostSchema.index({ slug: 1, locale: 1 }, { unique: true });

export const PostModel = mongoose.models.Post || mongoose.model("Post", PostSchema);

const MediaSchema = new Schema({
  type: { type: String, default: "media" },
  url: { type: String, required: true },
  mime: String,
  size: Number,
  width: Number,
  height: Number,
  alt: String,
  hash: String,
  status: { type: String, enum:["draft","published","archived"], default:"published" },
  locale: { type: String, default: "en" },
}, { ...baseOpts });

export const MediaModel = mongoose.models.Media || mongoose.model("Media", MediaSchema);

// Optional: runtime validation before save
PostSchema.pre("save", function(next) {
  const doc = this.toObject();
  const parsed = (doc.type === "page" ? zPage : zPost).safeParse(doc);
  if (!parsed.success) return next(parsed.error);
  next();
});
```

```ts
// packages/core/db/connection.ts
import mongoose from "mongoose";
let ready: Promise<typeof mongoose> | null = null;

export function connectMongo(uri: string) {
  if (!ready) {
    ready = mongoose.connect(uri, { dbName: process.env.MONGO_DB || "cms" });
    mongoose.connection.on("connected", () => console.log("Mongo connected"));
    mongoose.connection.on("error", (e) => console.error("Mongo error", e));
  }
  return ready;
}
```

---

# Auth + RBAC

```ts
// packages/core/auth/rbac.ts
export type Capability =
  | "post.read" | "post.create" | "post.update" | "post.delete"
  | "media.read" | "media.create" | "media.delete"
  | "settings.read" | "settings.update";

export const ROLE_CAPS: Record<string, Capability[]> = {
  admin: ["post.read","post.create","post.update","post.delete","media.read","media.create","media.delete","settings.read","settings.update"],
  editor: ["post.read","post.create","post.update","media.read","media.create"],
  author: ["post.read","post.create","media.read","media.create"],
  viewer: ["post.read","media.read"],
};

export const can = (role: string, cap: Capability) => ROLE_CAPS[role]?.includes(cap) ?? false;
```

Admin API guard:

```ts
// app/api/_utils/guard.ts
import { auth } from "next-auth"; // v5
import { can } from "@/packages/core/auth/rbac";

export async function requireCap(cap: string) {
  const session = await auth();
  if (!session?.user?.role || !can(session.user.role, cap as any)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  return session;
}
```

---

# API route handlers (App Router)

```ts
// app/api/posts/route.ts
import { connectMongo } from "@/packages/core/db/connection";
import { PostModel } from "@/packages/core/content/mongoose";
import { zPost } from "@/packages/core/content/zod";
import { requireCap } from "../_utils/guard";
import { revalidateTag } from "next/cache";

export async function GET(req: Request) {
  await connectMongo(process.env.MONGO_URI!);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "published";
  const docs = await PostModel.find({ status }).sort({ publishedAt: -1 }).limit(20).lean();
  return Response.json({ items: docs });
}

export async function POST(req: Request) {
  await requireCap("post.create");
  await connectMongo(process.env.MONGO_URI!);
  const body = await req.json();
  const parsed = zPost.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  const created = await PostModel.create(parsed.data);
  revalidateTag("post:list");
  revalidateTag(`post:${created.slug}`);
  return Response.json(created, { status: 201 });
}
```

```ts
// app/api/posts/[id]/route.ts
import { connectMongo } from "@/packages/core/db/connection";
import { PostModel } from "@/packages/core/content/mongoose";
import { zPost } from "@/packages/core/content/zod";
import { requireCap } from "../../_utils/guard";
import { revalidateTag } from "next/cache";

export async function GET(_: Request, { params }: { params: { id: string }}) {
  await connectMongo(process.env.MONGO_URI!);
  const doc = await PostModel.findById(params.id).lean();
  if (!doc) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(doc);
}
export async function PATCH(req: Request, { params }: { params: { id: string }}) {
  await requireCap("post.update");
  await connectMongo(process.env.MONGO_URI!);
  const patch = await req.json();
  const parsed = zPost.partial().safeParse(patch);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  const updated = await PostModel.findByIdAndUpdate(params.id, parsed.data, { new: true });
  if (!updated) return Response.json({ error: "not found" }, { status: 404 });
  revalidateTag("post:list"); revalidateTag(`post:${updated.slug}`);
  return Response.json(updated);
}
export async function DELETE(_: Request, { params }: { params: { id: string }}) {
  await requireCap("post.delete");
  await connectMongo(process.env.MONGO_URI!);
  await PostModel.findByIdAndDelete(params.id);
  revalidateTag("post:list");
  return Response.json({ ok: true });
}
```

---

# Frontend rendering (ISR + tags)

```ts
// app/(frontend)/blog/[slug]/page.tsx
import { connectMongo } from "@/packages/core/db/connection";
import { PostModel } from "@/packages/core/content/mongoose";
import { unstable_cache, revalidateTag } from "next/cache";

export const revalidate = 60;
export const fetchCache = "force-cache";

const getPost = unstable_cache(async (slug: string) => {
  await connectMongo(process.env.MONGO_URI!);
  return PostModel.findOne({ slug, status: "published" }).lean();
}, ["post:by-slug"], { tags: (slug: string) => [`post:${slug}`] } as any);

export default async function Page({ params }: { params: { slug: string }}) {
  const post = await getPost(params.slug);
  if (!post) return <div>Not found</div>;
  return (
    <article className="prose mx-auto">
      <h1>{post.title}</h1>
      {/* render blocks → HTML */}
    </article>
  );
}
```

---

# Admin UI highlights (shadcn/ui)

* Data table CRUD for Posts, Media, Users (use `@tanstack/react-table`).
* Block editor (tiptap) with image upload, embeds, code blocks.
* Menus builder (drag & drop).
* Settings pages (site, SEO defaults, webhooks).
* Role/permission editor.

---

# Hooks (actions/filters) & plugins

```ts
// packages/core/hooks/bus.ts
type Handler<T> = (payload: T) => Promise<T> | T;
const actions = new Map<string, Handler<any>[]>();
const filters = new Map<string, Handler<any>[]>();

export const addAction = (key: string, h: Handler<any>) => (actions.get(key) ?? actions.set(key, []).get(key)!).push(h);
export const doAction = async<T>(key: string, payload: T) => {
  for (const h of actions.get(key) ?? []) await h(payload);
};

export const addFilter = (key: string, h: Handler<any>) => (filters.get(key) ?? filters.set(key, []).get(key)!).push(h);
export const applyFilters = async<T>(key: string, payload: T) => {
  let out = payload;
  for (const h of filters.get(key) ?? []) out = await h(out);
  return out;
};
```

Example SEO plugin:

```ts
// packages/plugins/seo/index.ts
import { addFilter, addAction } from "../../core/hooks/bus";

addFilter("render:html", async (html: string) => {
  // inject meta tags if missing
  return html;
});

addAction("post:created", async (post) => {
  // ping search engine webhook, etc.
});
```

Call hooks from services/APIs:

```ts
// after creating a post
await doAction("post:created", createdDoc);
```

---

# Media upload (S3/R2)

* Use UploadThing or a signed-URL route.

```ts
// app/api/media/route.ts (simplified signed URL)
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { requireCap } from "../_utils/guard";
export async function POST(req: Request) {
  await requireCap("media.create");
  const { name, type } = await req.json();
  const key = `uploads/${Date.now()}-${randomUUID()}-${name}`;
  // generate signed URL with @aws-sdk/s3-request-presigner or handle proxy upload
  return Response.json({ key, url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}` });
}
```

---

# Search (optional)

* Atlas Search index on `title`, `excerpt`, `content.blocks.content`, `taxonomies.tags`.
* API: `/api/search?q=...` with pagination.

---

# SEO + feeds

* `app/sitemap.ts` queries latest published slugs.
* `app/rss.xml/route.ts` builds RSS.
* OG images via `app/og/[slug]/route.ts` (next/og).

---

# Internationalization

* Add `locale` field to all content; route group `[locale]`; fallbacks per setting.

---

# Revisions

* On update: store prior doc into `revisions` collection with pointer to entity + version number; simple “restore” endpoint.

---

# Settings

Store key/value (JSON) with validation.

```ts
// packages/core/content/settings.ts
export type SettingKey = "site" | "seo" | "integrations";
export interface SettingDoc { key: SettingKey; value: any; }
```

---

# DevOps & scalability

* **DB**: capped collections for logs; compound indexes shown above.
* **API**: rate limit admin mutations; ETag on GETs; JSON streaming for big lists.
* **Cache**: Redis for top pages; tag invalidation via `/api/revalidate`.
* **Workers**: queue (BullMQ) for heavy tasks (image processing, webhooks).
* **CDN**: images via R2/S3 + CDN; pages via Vercel or Node server.
* **Tests**: Vitest/Jest for services + route handlers; supertest for APIs.
* **Migrations**: `migrate-mongo` for index changes & backfills.

---

# Quick start checklist

1. Init Next.js (App Router), Tailwind, shadcn/ui.
2. Add Auth.js v5 (credentials + optional OAuth). Seed admin user.
3. Wire Mongo connection and models above.
4. Implement `/api/posts` + admin table to create/edit posts.
5. Add block editor + media upload to S3.
6. Frontend blog pages by slug with ISR + `revalidateTag`.
7. Add Roles/Permissions guard.
8. Add sitemap + RSS + basic SEO fields.
9. Add hooks bus; register `plugins/seo`.
10. Add tests and `migrate-mongo`.

---

# Notes on “library that generate types”

You already get types from Zod: `type Post = z.infer<typeof zPost>`. If you want **OpenAPI schemas + client SDKs**, add:

* `@asteasolutions/zod-to-openapi` → emit OpenAPI from Zod.
* `openapi-typescript` → generate TS client types from OpenAPI.
* Or use `mongoose-tsgen` if you prefer generating types from Mongoose (I recommend Zod-first to keep runtime validation).

---

# Want code scaffolding?

Say “scaffold it” and tell me:

* Auth providers (only email/pass or + Google/GitHub)
* Media storage (S3/R2/local)
* Editor (tiptap or editor.js)
* i18n (yes/no)
* Multisite/tenancy (yes/no)

I’ll drop a ready-to-paste minimal working repo skeleton with the admin screens (shadcn), CRUD APIs, RBAC guard, and a sample blog theme.
