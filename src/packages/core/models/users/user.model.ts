import "server-only";
import mongoose, {
  Schema,
  Types,
  Model,
  HydratedDocument,
  FilterQuery,
  UpdateQuery,
} from "mongoose";
import { zUser, zUserCreate, zUserUpdate, zUserMeta } from "./user.schema";
import argon2 from "argon2";
import { slugify } from "@/lib/slugify";
import z from "zod";
import { UserDoc, UserMetaDoc } from "@/types/users";

/** ======================= User Schema ======================= */

const UserSchema = new Schema<UserDoc>(
  {
    user_login: { type: String, required: true },
    user_nicename: { type: String, required: true },
    user_email: { type: String, required: true },
    user_pass: { type: String, required: true, select: false }, // select: false so we fetch when needed
    user_url: { type: String, default: "" },
    user_registered: { type: Date, default: () => new Date() },
    user_status: { type: Number, default: 0 },
    display_name: { type: String, required: true },
    first_name: { type: String },
    last_name: { type: String },
    locale: { type: String, default: "en" },
    avatar_url: { type: String },
    description: { type: String },
    roles: { type: [String], default: ["subscriber"], index: true },
    // Explicit map typing for TS
    capabilities: {
      type: Map,
      of: Boolean,
      default: () => new Map<string, boolean>(),
    },
  },
  { timestamps: true, versionKey: false }
);

// Case-insensitive uniqueness like WP
UserSchema.index({ user_login: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
UserSchema.index({ user_email: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
UserSchema.index({ user_nicename: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
UserSchema.index({ display_name: "text", first_name: "text", last_name: "text" });

// Hook: derive nicename/display_name + normalize case
UserSchema.pre<HydratedDocument<UserDoc>>("validate", function (next) {
  if (!this.user_nicename) this.user_nicename = slugify(this.user_login);
  if (!this.display_name) this.display_name = this.user_login;
  if (this.user_login) this.user_login = this.user_login.toLowerCase();
  if (this.user_email) this.user_email = this.user_email.toLowerCase();
  next();
});

// Hide password in JSON output (no `any`)
UserSchema.set("toJSON", {
  transform: (_doc, ret: Record<string, unknown>) => {
    if (Object.prototype.hasOwnProperty.call(ret, "user_pass")) {
      delete (ret as { user_pass?: string }).user_pass;
    }
    return ret;
  },
});

export const UserModel =
  (mongoose.models.User as Model<UserDoc>) || mongoose.model<UserDoc>("User", UserSchema);

/** ======================= UserMeta Schema ======================= */

const UserMetaSchema = new Schema<UserMetaDoc>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    meta_key: { type: String, required: true, index: true },
    // Typed Mixed without `any`
    meta_value: { type: Schema.Types.Mixed as unknown as unknown },
  },
  { timestamps: true, versionKey: false }
);

// (user_id, meta_key) unique pair
UserMetaSchema.index({ user_id: 1, meta_key: 1 }, { unique: true });

export const UserMetaModel =
  (mongoose.models.UserMeta as Model<UserMetaDoc>) ||
  mongoose.model<UserMetaDoc>("UserMeta", UserMetaSchema);

/** ======================= Services ======================= */

export const Users = {
  async create(input: z.input<typeof zUserCreate>) {
    const parsed = zUserCreate.parse(input);

    const user_pass = await argon2.hash(parsed.password, {
      type: argon2.argon2id,
      timeCost: 3,
      memoryCost: 19456,
      parallelism: 1,
    });

    const doc: Omit<UserDoc, "_id" | "createdAt" | "updatedAt"> = {
      user_login: parsed.user_login.toLowerCase(),
      user_nicename: parsed.user_nicename || parsed.user_login,
      user_email: parsed.user_email.toLowerCase(),
      user_pass,
      user_url: parsed.user_url ?? "",
      user_registered: parsed.user_registered ?? new Date(),
      user_status: parsed.user_status ?? 0,
      display_name: parsed.display_name || parsed.user_login,
      first_name: parsed.first_name ?? "",
      last_name: parsed.last_name ?? "",
      locale: parsed.locale ?? "en",
      avatar_url: parsed.avatar_url ?? "",
      description: parsed.description ?? "",
      roles: parsed.roles ?? ["subscriber"],
      // Accept both Map and Record input; normalize to Map for schema
      capabilities:
        parsed.capabilities instanceof Map
          ? parsed.capabilities
          : new Map<string, boolean>(
              Object.entries(parsed.capabilities ?? {}).map(([k, v]) => [k, Boolean(v)])
            ),
    };

    // Optional: validate the persisted shape (sans password field in zUser)
    const ok = zUser.safeParse({ ...doc, user_pass: undefined });
    if (!ok.success) throw ok.error;

    return UserModel.create(doc);
  },

  async update(id: string, patch: z.infer<typeof zUserUpdate>) {
    const parsed = zUserUpdate.parse(patch);

    // Build a typed $set
    const $set: NonNullable<UpdateQuery<UserDoc>["$set"]> = { ...parsed } as NonNullable<
      UpdateQuery<UserDoc>["$set"]
    >;

    if (parsed.password) {
      $set.user_pass = await argon2.hash(parsed.password, {
        type: argon2.argon2id,
        timeCost: 3,
        memoryCost: 19456,
        parallelism: 1,
      }); 
      delete $set.password;
    }

    if ($set.user_login) $set.user_login = String($set.user_login).toLowerCase();
    if ($set.user_email) $set.user_email = String($set.user_email).toLowerCase();
    if ($set.user_nicename) $set.user_nicename = slugify(String($set.user_nicename));

    const updated = await UserModel.findByIdAndUpdate(
      id,
      { $set },
      { new: true, runValidators: true, context: "query" }
    );

    return updated;
  },

  async verifyPassword(userId: string, password: string) {
    // user_pass has select: false, explicitly include it
    const u = await UserModel.findById(userId).select("+user_pass");
    if (!u?.user_pass) return false;
    return argon2.verify(u.user_pass, password);
  },

  async byLoginOrEmail(identifier: string) {
    const q = identifier.toLowerCase();
    const filter: FilterQuery<UserDoc> = { $or: [{ user_login: q }, { user_email: q }] };
    return UserModel.findOne(filter);
  },
};

export const UserMeta = {
  async get(userId: string, key: string) {
    const m = await UserMetaModel.findOne({
      user_id: new Types.ObjectId(userId),
      meta_key: key,
    }).lean<{ meta_value?: unknown }>();
    return m?.meta_value ?? null;
  },

  async set(userId: string, key: string, value: unknown) {
    // validate with zod (accepts unknown meta_value)
    const parsed = zUserMeta.parse({ user_id: userId, meta_key: key, meta_value: value });

    await UserMetaModel.updateOne(
      { user_id: new Types.ObjectId(parsed.user_id), meta_key: parsed.meta_key },
      { $set: { meta_value: parsed.meta_value } },
      { upsert: true }
    );
    return true as const;
  },

  async remove(userId: string, key: string) {
    await UserMetaModel.deleteOne({ user_id: new Types.ObjectId(userId), meta_key: key });
    return true as const;
  },

  async list(userId: string, prefix?: string) {
    const filter: FilterQuery<UserMetaDoc> = {
      user_id: new Types.ObjectId(userId),
      ...(prefix ? { meta_key: { $regex: `^${prefix}` } } : {}),
    };

    const rows = await UserMetaModel.find(filter).lean<{ meta_key: string; meta_value: unknown }[]>();
    return rows.map((r) => ({ key: r.meta_key, value: r.meta_value }));
  },
};
