export const runtime = "nodejs";

import { axios } from "@/lib/axios"; // ← your axios instance
import Link from "next/link";
import { headers } from "next/headers";

type Post = { type?: string | null };
type User = Record<string, any>;

function asArray<T = unknown>(v: any): T[] {
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.data)) return v.data;
  return [];
}

function groupByType(posts: Post[]) {
  const byType = posts.reduce((acc, p) => {
    const key = (p?.type ?? "unknown").toString().trim() || "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));
}

// Helper for base URL (works in SSR)
function getBaseUrl() {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export const revalidate = 0; // live SSR always

export default async function Page() {
  let posts: any = [];
  let users: any = [];
  let errorMsg: string | null = null;

  try {
    const baseURL =
      process.env.NEXT_PUBLIC_API_BASE || getBaseUrl();

    const [postsRes, usersRes] = await Promise.all([
      axios.get(`${baseURL}/api/posts`, {
        withCredentials: true,
      }),
      axios.get(`${baseURL}/api/users`, {
        withCredentials: true,
      }),
    ]);

    posts = asArray(postsRes.data.docs);
    users = asArray(usersRes.data.docs);
  } catch (err: any) {
    console.error("Dashboard SSR fetch error:", err?.message);
    errorMsg = err?.message || "Failed to load dashboard data.";
  }

  const totalPosts = posts.length;
  const totalUsers = users.length;
  const postsByType = groupByType(posts);

  return (
    <div className="">
      <h1 className="font-bold text-2xl tracking-tight">Dashboard</h1>

      {errorMsg ? (
        <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Error</p>
          <p className="mt-1 opacity-90">{errorMsg}</p>
        </div>
      ) : (
        <>
          {/* --- Stats Cards --- */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
              <div className="p-5">
                <div className="text-sm text-muted-foreground">Total Posts</div>
                <div className="mt-2 text-3xl font-semibold">{totalPosts}</div>
                <div className="mt-4 text-xs">
                  <Link href="/posts" className="underline hover:opacity-80">
                    View all posts →
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
              <div className="p-5">
                <div className="text-sm text-muted-foreground">Total Users</div>
                <div className="mt-2 text-3xl font-semibold">{totalUsers}</div>
                <div className="mt-4 text-xs">
                  <Link href="/dashboard/users" className="underline hover:opacity-80">
                    View all users →
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
              <div className="p-5">
                <div className="text-sm text-muted-foreground">Data Freshness</div>
                <div className="mt-2 text-3xl font-semibold">Live</div>
                <div className="mt-4 text-xs text-muted-foreground">
                  SSR + <code>axios (no cache)</code>
                </div>
              </div>
            </div>
          </div>

          {/* --- Posts by Type --- */}
          <div className="mt-8 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Posts by Type</h2>
                <span className="text-xs text-muted-foreground">
                  {postsByType.length} types
                </span>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[400px] border-separate border-spacing-0">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="border-b p-3 font-medium">Type</th>
                      <th className="border-b p-3 font-medium">Count</th>
                      <th className="border-b p-3 font-medium">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {postsByType.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="p-4 text-sm text-muted-foreground"
                        >
                          No posts found.
                        </td>
                      </tr>
                    ) : (
                      postsByType.map(({ type, count }) => {
                        const pct =
                          totalPosts > 0
                            ? Math.round((count / totalPosts) * 100)
                            : 0;
                        return (
                          <tr key={type} className="text-sm">
                            <td className="border-b p-3 capitalize">
                              {type || "unknown"}
                            </td>
                            <td className="border-b p-3">{count}</td>
                            <td className="border-b p-3">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-32 overflow-hidden rounded bg-muted">
                                  <div
                                    className="h-2 rounded bg-foreground/60"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="tabular-nums text-xs text-muted-foreground">
                                  {pct}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* --- Quick Links --- */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/dashboard/posts/new"
              className="rounded-lg border p-4 transition hover:bg-muted/40"
            >
              <div className="text-sm text-muted-foreground">Action</div>
              <div className="mt-1 font-medium">Create New Post →</div>
            </Link>
            <Link
              href="/dashboard/users/invite"
              className="rounded-lg border p-4 transition hover:bg-muted/40"
            >
              <div className="text-sm text-muted-foreground">Action</div>
              <div className="mt-1 font-medium">Invite Users →</div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
