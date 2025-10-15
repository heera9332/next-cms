import { z } from "zod";
import { zPost, zPostCreate, zPostUpdate, zPostMeta } from "./post.schema";
import { PostModel, PostMetaModel, PostRevisionModel } from "./post.model";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");

export const Posts = {
  /** Create a post; if slug missing, derive from title */
  async create(input: z.input<typeof zPostCreate>) {
    const parsed = zPostCreate.parse(input);
    const slug = parsed.slug || slugify(parsed.title);
    const doc = await PostModel.create({
      ...parsed,
      slug,
      publishedAt: parsed.status === "published" && !parsed.publishedAt ? new Date() : parsed.publishedAt,
    });
    // initial revision
    await PostRevisionModel.create({
      post_id: doc._id,
      rev: 1,
      snapshot: (await PostModel.findById(doc._id).lean()) ?? {},
    });
    return doc;
  },

  /** Update + bump revision */
  async update(id: string, patch: z.input<typeof zPostUpdate>, authorId?: string) {
    const parsed = zPostUpdate.parse(patch);
    if (parsed.slug) parsed.slug = slugify(parsed.slug);
    if (parsed.title && !parsed.slug) parsed.slug = slugify(parsed.title);
    if (parsed.status === "published" && !parsed.publishedAt) parsed.publishedAt = new Date();

    const prev = await PostModel.findById(id).lean();
    if (!prev) throw new Error("not_found");

    const updated = await PostModel.findByIdAndUpdate(id, { $set: parsed }, { new: true, runValidators: true });
    if (!updated) throw new Error("not_found");

    // next revision
    const last = await PostRevisionModel.find({ post_id: updated._id }).sort({ rev: -1 }).limit(1).lean();
    const nextRev = (last?.[0]?.rev ?? 0) + 1;

    await PostRevisionModel.create({
      post_id: updated._id,
      rev: nextRev,
      snapshot: updated.toObject(),
      authorId,
    });

    return updated;
  },

  /** Soft delete */
  async remove(id: string) {
    await PostModel.findByIdAndUpdate(id, { $set: { isDeleted: true, status: "archived" } });
    return true;
  },

  /** Move in hierarchy + recompute ancestors */
  async move(id: string, newParentId: string | null) {
    const post = await PostModel.findById(id);
    if (!post) throw new Error("not_found");

    // prevent cyclic move
    if (newParentId) {
      const parent = await PostModel.findById(newParentId).lean();
      if (!parent) throw new Error("invalid_parent");
      if (String(parent._id) === String(id)) throw new Error("self_parent");
      if (parent.ancestors?.map(String).includes(String(id))) throw new Error("cyclic");
    }

    post.parentId = newParentId as any;
    await post.save(); // pre-save computes ancestors
    return post;
  },

  /** Get children sorted by menuOrder */
  async children(parentId: string | null, type?: string) {
    const filter: any = { parentId: parentId ?? null, isDeleted: false };
    if (type) filter.type = type;
    return PostModel.find(filter).sort({ menuOrder: 1, title: 1 }).lean();
  },

  /** Breadcrumbs from ancestors + self */
  async breadcrumbs(id: string) {
    const post = await PostModel.findById(id).lean();
    if (!post) return [];
    const rows = await PostModel.find({ _id: { $in: [...post.ancestors, post._id] } })
      .select("_id title slug type")
      .lean();
    const order: Record<string, number> = {};
    [...post.ancestors.map(String), String(post._id)].forEach((v, i) => (order[v] = i));
    return rows.sort((a, b) => (order[String(a._id)] ?? 0) - (order[String(b._id)] ?? 0));
  },

  /** Fetch by (type, slug, locale, visibility) */
  async bySlug(type: string, slug: string, locale = "en") {
    return PostModel.findOne({ type, slug, locale, isDeleted: false }).lean();
  },
};

export const PostMeta = {
  async get(postId: string, key: string) {
    const row = await PostMetaModel.findOne({ post_id: postId, meta_key: key }).lean();
    return row?.meta_value ?? null;
  },
  async set(postId: string, key: string, value: any) {
    const parsed = zPostMeta.parse({ post_id: postId, meta_key: key, meta_value: value });
    await PostMetaModel.updateOne(
      { post_id: parsed.post_id, meta_key: parsed.meta_key },
      { $set: { meta_value: parsed.meta_value } },
      { upsert: true }
    );
    return true;
  },
  async remove(postId: string, key: string) {
    await PostMetaModel.deleteOne({ post_id: postId, meta_key: key });
    return true;
  },
  async list(postId: string, prefix?: string) {
    const q: any = { post_id: postId };
    if (prefix) q.meta_key = { $regex: `^${prefix}` };
    const rows = await PostMetaModel.find(q).lean();
    return rows.map((r) => ({ key: r.meta_key, value: r.meta_value }));
  },
};
