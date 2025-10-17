import { z } from "zod";
import { zPostCreate, zPostUpdate, zPostMeta } from "./post.schema";
import {
  PostModel,
  PostMetaModel,
  PostRevisionModel,
} from "./post.model";
import type { PostDoc, PostMetaDoc } from "./post.model"; // adjust path if types are exported elsewhere
import { Types, FilterQuery, UpdateQuery } from "mongoose";

const slugify = (s: string) =>
  s.toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const Posts = {
  /** Create a post; if slug missing, derive from title */
  async create(input: z.input<typeof zPostCreate>) {
    const parsed = zPostCreate.parse(input);
    const slug = parsed.slug || slugify(parsed.title);

    const doc = await PostModel.create({
      ...parsed,
      slug,
      publishedAt:
        parsed.status === "published" && !parsed.publishedAt
          ? new Date()
          : parsed.publishedAt,
    });

    // initial revision (snapshot as plain object)
    const snapshot = (await PostModel.findById(doc._id).lean<PostDoc>()) ?? {};
    await PostRevisionModel.create({
      post_id: doc._id,
      rev: 1,
      snapshot,
    });

    return doc;
  },

  /** Update + bump revision */
  async update(id: string, patch: z.input<typeof zPostUpdate>, authorId?: string) {
    const parsed = zPostUpdate.parse(patch);

    if (parsed.slug) parsed.slug = slugify(parsed.slug);
    if (parsed.title && !parsed.slug) parsed.slug = slugify(parsed.title);
    if (parsed.status === "published" && !parsed.publishedAt) {
      parsed.publishedAt = new Date();
    }

    const prev = await PostModel.findById(id).lean<PostDoc>();
    if (!prev) throw new Error("not_found");

    const update: UpdateQuery<PostDoc> = { $set: parsed as Partial<PostDoc> };
    const updated = await PostModel.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true }
    );
    if (!updated) throw new Error("not_found");

    // next revision
    const last = await PostRevisionModel.find({ post_id: updated._id })
      .sort({ rev: -1 })
      .limit(1)
      .lean<{ rev: number }[]>();
    const nextRev = ((last?.[0]?.rev) ?? 0) + 1;

    await PostRevisionModel.create({
      post_id: updated._id,
      rev: nextRev,
      snapshot: updated.toObject(),
      authorId: authorId ? new Types.ObjectId(authorId) : undefined,
    });

    return updated;
  },

  /** Soft delete */
  async remove(id: string) {
    await PostModel.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true, status: "archived" } satisfies Partial<PostDoc> },
      { new: false }
    );
    return true as const;
  },

  /** Move in hierarchy + recompute ancestors (handled by pre-save) */
  async move(id: string, newParentId: string | null) {
    const post = await PostModel.findById(id);
    if (!post) throw new Error("not_found");

    // prevent cyclic move
    if (newParentId) {
      const parent = await PostModel.findById(newParentId).lean<PostDoc>();
      if (!parent) throw new Error("invalid_parent");
      if (String(parent._id) === String(id)) throw new Error("self_parent");
      if ((parent.ancestors ?? []).map(String).includes(String(id))) {
        throw new Error("cyclic");
      }
    }

    post.parentId = newParentId ? new Types.ObjectId(newParentId) : null;
    await post.save(); // pre('save') recomputes ancestors
    return post;
  },

  /** Get children sorted by menuOrder */
  async children(parentId: string | null, type?: string) {
    const filter: FilterQuery<PostDoc> = {
      parentId: parentId ? new Types.ObjectId(parentId) : null,
      isDeleted: false,
      ...(type ? { type } : {}),
    };

    return PostModel.find(filter)
      .sort({ menuOrder: 1, title: 1 })
      .lean<PostDoc[]>();
  },

  /** Breadcrumbs from ancestors + self */
  async breadcrumbs(id: string) {
    const post = await PostModel.findById(id).lean<PostDoc>();
    if (!post) return [] as Array<{ _id: Types.ObjectId; title: string; slug: string; type: string }>;

    const ids = [...(post.ancestors ?? []), post._id];
    const rows = await PostModel.find({ _id: { $in: ids } })
      .select("_id title slug type")
      .lean<Array<{ _id: Types.ObjectId; title: string; slug: string; type: string }>>();

    const order: Record<string, number> = {};
    ids.map(String).forEach((v, i) => (order[v] = i));

    return rows.sort(
      (a, b) => (order[String(a._id)] ?? 0) - (order[String(b._id)] ?? 0)
    );
  },

  /** Fetch by (type, slug, locale, visibility) */
  async bySlug(type: string, slug: string, locale = "en") {
    const filter: FilterQuery<PostDoc> = { type, slug, locale, isDeleted: false };
    return PostModel.findOne(filter).lean<PostDoc | null>();
  },
};

export const PostMeta = {
  async get(postId: string, key: string) {
    const row = await PostMetaModel.findOne({
      post_id: new Types.ObjectId(postId),
      meta_key: key,
    }).lean<{ meta_value?: unknown }>();
    return row?.meta_value ?? null;
  },

  async set(postId: string, key: string, value: unknown) {
    const parsed = zPostMeta.parse({
      post_id: postId,
      meta_key: key,
      meta_value: value,
    });

    await PostMetaModel.updateOne(
      { post_id: new Types.ObjectId(parsed.post_id), meta_key: parsed.meta_key },
      { $set: { meta_value: parsed.meta_value } },
      { upsert: true }
    );
    return true as const;
  },

  async remove(postId: string, key: string) {
    await PostMetaModel.deleteOne({
      post_id: new Types.ObjectId(postId),
      meta_key: key,
    });
    return true as const;
  },

  async list(postId: string, prefix?: string) {
    const filter: FilterQuery<PostMetaDoc> = {
      post_id: new Types.ObjectId(postId),
      ...(prefix ? { meta_key: { $regex: `^${prefix}` } } : {}),
    };

    const rows = await PostMetaModel.find(filter)
      .lean<Array<{ meta_key: string; meta_value: unknown }>>();

    return rows.map((r) => ({ key: r.meta_key, value: r.meta_value }));
  },
};
