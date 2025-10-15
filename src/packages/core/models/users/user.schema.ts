// packages/core/users/zod.ts
import { z } from "zod";

export const zId = z.string().regex(/^[a-f0-9]{24}$/);

export const zRole = z.enum(["administrator","editor","author","contributor","subscriber"]).or(z.string().min(1));

export const zUserBase = z.object({
  user_login: z.string().min(3).max(60),          // username
  user_nicename: z.string().min(3).max(60),       // slug/handle
  user_email: z.string().email(),
  user_url: z.string().url().optional().or(z.literal("")),
  user_registered: z.date(),
  user_status: z.number().int().default(0),       // 0=active
  display_name: z.string().min(1),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  locale: z.string().default("en"),
  avatar_url: z.string().optional(),
  description: z.string().optional(),             // bio
  roles: z.array(zRole).default(["subscriber"]),
  capabilities: z.record(z.string(), z.boolean()).default({}),
});

export const zUser = zUserBase.extend({
  _id: zId.optional(),
  user_pass: z.string().min(20),                  // hashed
});

export const zUserCreate = zUserBase.extend({
  password: z.string().min(8),   // plaintext input
});

export const zUserUpdate = zUser.partial().omit({ user_pass: true }).extend({
  password: z.string().min(8).optional(),
});

export const zUserMeta = z.object({
  _id: zId.optional(),
  user_id: zId,
  meta_key: z.string().min(1).max(191),
  meta_value: z.any(), // JSON-serializable
});

