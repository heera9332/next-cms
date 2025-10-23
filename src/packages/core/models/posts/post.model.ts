/* eslint-disable @typescript-eslint/ban-ts-comment */
import "server-only";
import mongoose, { Schema, Types, HydratedDocument, Model } from "mongoose";

const baseOpts = { timestamps: true, versionKey: false } as const;

/** ---------------- Editor.js embedded schemas ---------------- */
const EditorBlock = new Schema(
  {
    id: { type: String },
    type: { type: String, required: true },
    data: { type: Schema.Types.Mixed as unknown as Record<string, unknown> },
    tunes: { type: Schema.Types.Mixed as unknown as Record<string, unknown> },
  },
  { _id: false }
);

const EditorJs = new Schema(
  {
    time: { type: Number },
    blocks: { type: [EditorBlock], default: [] },
    version: { type: String },
  },
  { _id: false }
);

/** ---------------- Post ---------------- */
export interface PostDoc extends mongoose.Document {
  _id: Types.ObjectId;
  type: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: {
    time?: number;
    blocks: Array<Record<string, unknown>>;
    version?: string;
  };
  authorId?: Types.ObjectId;
  status: "draft" | "published" | "private" | "archived";
  visibility: "public" | "private" | "password";
  password?: string;
  locale: string;
  featuredMediaId?: Types.ObjectId;
  taxonomies: { categories: string[]; tags: string[] };
  parentId?: Types.ObjectId | null;
  menuOrder: number;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  publishedAt?: Date;
  isDeleted: boolean;
  ancestors: Types.ObjectId[];
  updatedAt?: Date;
}

const PostSchema = new Schema<PostDoc>(
  {
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    excerpt: { type: String },
    content: { type: EditorJs, default: () => ({ blocks: [] }) },
    authorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    status: {
      type: String,
      enum: ["draft", "published", "private", "archived"],
      default: "draft",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "private", "password"],
      default: "public",
    },
    password: { type: String },
    locale: { type: String, default: "en", index: true },
    featuredMediaId: { type: Schema.Types.ObjectId, ref: "Media" },
    taxonomies: {
      categories: { type: [String], default: [] },
      tags: { type: [String], default: [] },
    },
    parentId: { type: Schema.Types.ObjectId, ref: "Post", default: null, index: true },
    menuOrder: { type: Number, default: 0, index: true },
    metaTitle: { type: String },
    metaDescription: { type: String },
    ogImage: { type: String },
    publishedAt: { type: Date, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    ancestors: { type: [Schema.Types.ObjectId], default: [], index: true },
  },
  baseOpts
); 

PostSchema.index(
  { type: 1, locale: 1, slug: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);
PostSchema.index({ status: 1, publishedAt: -1 });
PostSchema.index({ title: "text", excerpt: "text" });
PostSchema.index({ type: 1, parentId: 1, menuOrder: 1 });

// Example (adjust fields/weights as needed)
PostSchema.index(
  { title: "text", slug: "text", excerpt: "text" },
  { weights: { title: 10, slug: 6, excerpt: 4 }, name: "post_text_idx" }
);

PostSchema.pre<HydratedDocument<PostDoc>>("save", async function (next) {
  try {
    if (this.isModified("parentId")) {
      if (!this.parentId) {
        this.ancestors = [];
      } else {
        // ✅ Explicitly a Model<PostDoc>
        const Post: Model<PostDoc> = mongoose.model<PostDoc>("Post");

        const parent = await Post.findById(this.parentId)
          .select("ancestors")
          .lean<{ ancestors?: Types.ObjectId[] }>();

        if (!parent) return next(new Error("Invalid parentId"));

        const parentAncestors = Array.isArray(parent.ancestors) ? parent.ancestors : [];
        this.ancestors = [...parentAncestors, this.parentId];
      }
    }
    next();
  } catch (err) {
    next(err as Error);
  }
});


export const PostModel =
  (mongoose.models.Post as mongoose.Model<PostDoc>) ||
  mongoose.model<PostDoc>("Post", PostSchema);

/** ---------------- PostMeta ---------------- */
export interface PostMetaDoc extends mongoose.Document {
  _id: Types.ObjectId;
  post_id: Types.ObjectId;
  meta_key: string;
  meta_value: unknown;
}

const PostMetaSchema = new Schema<PostMetaDoc>(
  {
    post_id: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    meta_key: { type: String, required: true, index: true },
    meta_value: { type: Schema.Types.Mixed as unknown as Record<string, unknown> },
  },
  baseOpts
);

PostMetaSchema.index({ post_id: 1, meta_key: 1 }, { unique: true });

export const PostMetaModel =
  (mongoose.models.PostMeta as mongoose.Model<PostMetaDoc>) ||
  mongoose.model<PostMetaDoc>("PostMeta", PostMetaSchema);

/** ---------------- PostRevision ---------------- */
export interface PostRevisionDoc extends mongoose.Document {
  _id: Types.ObjectId;
  post_id: Types.ObjectId;
  rev: number;
  snapshot: Record<string, unknown>;
  createdAt: Date;
  authorId?: Types.ObjectId;
}

const PostRevisionSchema = new Schema<PostRevisionDoc>(
  {
    post_id: { type: Schema.Types.ObjectId, ref: "Post", index: true, required: true },
    rev: { type: Number, required: true, index: true },
    snapshot: { type: Schema.Types.Mixed as unknown as Record<string, unknown> },
    createdAt: { type: Date, default: () => new Date() },
    authorId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { versionKey: false }
);

PostRevisionSchema.index({ post_id: 1, rev: -1 }, { unique: true });

export const PostRevisionModel =
  (mongoose.models.PostRevision as mongoose.Model<PostRevisionDoc>) ||
  mongoose.model<PostRevisionDoc>("PostRevision", PostRevisionSchema);
