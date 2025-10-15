export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const usernameFromEmail = (email: string) =>
  email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase();
