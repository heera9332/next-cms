// packages/core/users/auth-meta.ts (server-only)
import "server-only";
import { randomUUID } from "crypto";
import { UserMeta } from "./user.model";

const META_KEY = "auth.refresh.ver";

export async function issueNewRefreshVersion(userId: string) {
  const ver = randomUUID();
  await UserMeta.set(userId, META_KEY, ver);
  return ver;
}
export async function getRefreshVersion(userId: string) {
  return (await UserMeta.get(userId, META_KEY)) as string | null;
}
