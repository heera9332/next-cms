import "server-only";
import mongoose, { Schema, Types } from "mongoose";
import { zUser, zUserCreate, zUserUpdate, zUserMeta } from "./user.schema";
import argon2 from "argon2";
import { slugify } from "@/lib/slugify";
import z from "zod";
import { UserDoc, UserMetaDoc } from "@/types/users";
import type { HydratedDocument } from "mongoose";
import leanVirtuals from "mongoose-lean-virtuals";

const UserSchema = new Schema<UserDoc>(
  {
    user_login: { type: String, required: true },
    user_nicename: { type: String, required: true },
    user_email: { type: String, required: true },
    user_pass: { type: String, required: true },
    user_url: { type: String, default: "" },
    user_registered: { type: Date, default: () => new Date() },
    user_status: { type: Number, default: 0 },
    display_name: { type: String, required: true },
    first_name: String,
    last_name: String,
    locale: { type: String, default: "en" },
    avatar_url: String,
    description: String,
    roles: { type: [String], default: ["subscriber"], index: true },
    capabilities: { type: Map, of: Boolean, default: {} },
  },
  { timestamps: true, versionKey: false }
);

// Uniqueness (case-insensitive) like WP
UserSchema.index({ user_login: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
UserSchema.index({ user_email: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
UserSchema.index({ user_nicename: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
UserSchema.index({ display_name: "text", first_name: "text", last_name: "text" });

interface IUser {
  user_login: string;
  user_nicename?: string;
  display_name?: string;
  user_email: string;
}

UserSchema.pre<IUser & HydratedDocument<IUser>>("validate", function (next) {
  if (!this.user_nicename) this.user_nicename = slugify(this.user_login);
  if (!this.display_name) this.display_name = this.user_login;
  if (this.user_login) this.user_login = this.user_login.toLowerCase();
  if (this.user_email) this.user_email = this.user_email.toLowerCase();
  next();
});

UserSchema.set("toJSON", {
  transform: (_, ret) => {
    delete ret.user_pass;
    return ret;
  }
});

const UserMetaSchema = new Schema<UserMetaDoc>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    meta_key: { type: String, required: true },
    meta_value: { type: Schema.Types.Mixed },
  },
  { timestamps: true, versionKey: false }
);

// (user_id, meta_key) unique like wp_usermeta pair
UserMetaSchema.index({ user_id: 1, meta_key: 1 }, { unique: true });
UserMetaSchema.index({ meta_key: 1 });

export const UserModel =
  (mongoose.models.User as mongoose.Model<UserDoc>) || mongoose.model<UserDoc>("User", UserSchema);

export const UserMetaModel =
  (mongoose.models.UserMeta as mongoose.Model<UserMetaDoc>) || mongoose.model<UserMetaDoc>("UserMeta", UserMetaSchema);

/** Services */
export const Users = {
    async create(input: z.input<typeof zUserCreate>) {
    // parse + apply defaults
    const parsed = zUserCreate.parse(input);

    // hash password and build doc
    const user_pass = await argon2.hash(parsed.password, {
      type: argon2.argon2id,
      timeCost: 3,
      memoryCost: 19456,
      parallelism: 1,
    });

    const doc = {
      user_login: parsed.user_login.toLowerCase(),
      user_nicename: parsed.user_nicename || parsed.user_login,
      user_email: parsed.user_email.toLowerCase(),
      user_pass,
      user_url: parsed.user_url ?? "",
      user_registered: parsed.user_registered ?? new Date(),
      user_status: parsed.user_status ?? 0,
      display_name: parsed.display_name || parsed.user_login,
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      locale: parsed.locale ?? "en",
      avatar_url: parsed.avatar_url,
      description: parsed.description,
      roles: parsed.roles ?? ["subscriber"],
      capabilities: parsed.capabilities ?? {}, // default map
    };

    // optional: validate against full schema (no password) before save
    const ok = zUser.safeParse({ ...doc });
    if (!ok.success) throw ok.error;

    return await UserModel.create(doc);
  },

  async update(id: string, patch: z.infer<typeof zUserUpdate>) {
    const parsed = zUserUpdate.parse(patch);
    const $set: Record<string, any> = { ...parsed };
    if (parsed.password) {
      $set.user_pass = await argon2.hash(parsed.password, { type: argon2.argon2id, timeCost: 3, memoryCost: 19456, parallelism: 1 });
      delete $set.password;
    }
    if ($set.user_login) $set.user_login = $set.user_login.toLowerCase();
    if ($set.user_email) $set.user_email = $set.user_email.toLowerCase();
    if ($set.user_nicename) $set.user_nicename = slugify($set.user_nicename);

    const updated = await UserModel.findByIdAndUpdate(id, { $set }, { new: true, runValidators: true, context: "query" });
    return updated;
  },

  async verifyPassword(userId: string, password: string) {
    const u = await UserModel.findById(userId).select("+user_pass");
    if (!u) return false;
    return argon2.verify(u.user_pass, password);
  },

  async byLoginOrEmail(identifier: string) {
    const q = identifier.toLowerCase();
    return await UserModel.findOne({ $or: [{ user_login: q }, { user_email: q }] });
  },
};

export const UserMeta = {
  async get(userId: string, key: string) {
    const m = await UserMetaModel.findOne({ user_id: userId, meta_key: key });
    return m?.meta_value ?? null;
  },
  async set(userId: string, key: string, value: any) {
    const doc = { user_id: new Types.ObjectId(userId), meta_key: key, meta_value: value };
    const parsed = zUserMeta.parse({ ...doc, user_id: userId });
    await UserMetaModel.updateOne(
      { user_id: parsed.user_id, meta_key: parsed.meta_key },
      { $set: { meta_value: parsed.meta_value } },
      { upsert: true }
    );
    return true;
  },
  async remove(userId: string, key: string) {
    await UserMetaModel.deleteOne({ user_id: userId, meta_key: key });
    return true;
  },
  async list(userId: string, prefix?: string) {
    const filter: any = { user_id: userId };
    if (prefix) filter.meta_key = { $regex: `^${prefix}` };
    const rows = await UserMetaModel.find(filter).lean();
    return rows.map(r => ({ key: r.meta_key, value: r.meta_value }));
  },
};

 