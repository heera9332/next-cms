export const runtime = "nodejs";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PostModel } from "@/packages/core/models/posts/post.model";
import { format } from "date-fns";
import PostsControls from "./page.client";

type SearchParams = {
  q?: string;
  status?: "draft" | "published" | "private" | "archived" | "all";
  page?: string;       // 1-based
  limit?: string;      // default 20
  type?: string;       // "post" | "page" | custom
};

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const {
    q = "",
    status = "all",
    page = "1",
    limit = "20",
    type = "post",
  } = searchParams || {};

  const pageNum = Math.max(1, parseInt(page || "1", 10) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(limit || "20", 10) || 20));

  const filter: any = { type, isDeleted: false };
  if (q) filter.$text = { $search: q };
  if (status !== "all") filter.status = status;

  const [items, total] = await Promise.all([
    PostModel.find(filter)
      .sort({ status: 1, publishedAt: -1, updatedAt: -1 })
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .lean({ virtuals: true }),
    PostModel.countDocuments(filter),
  ]);

  console.log(items)

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const statusColor: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
    draft: "secondary",
    published: "default",
    private: "outline",
    archived: "destructive",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-bold text-2xl">Posts</h1>
        <Link href="/dashboard/posts/new">
          <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus size={18} />
            Add New Post
          </Button>
        </Link>
      </div>

      <PostsControls
        qDefault={q}
        statusDefault={status}
        typeDefault={type}
        limitDefault={String(perPage)}
      /> 

      {/* Table on md+, cards on small screens */}
      <div className="hidden md:block overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3">S.No.</th>
              <th className="p-3 w-[40%]">Title</th>
              <th className="p-3">Status</th>
              <th className="p-3">Type</th>
              <th className="p-3">Updated</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p, idx: number) => (
              <tr key={p.id} className="border-t">
                <td className="p-3 uppercase text-xs">{idx+1}</td>
                <td className="p-3">
                  <Link
                    href={`/dashboard/posts/${p._id}/edit`}
                    className="font-medium hover:underline"
                  >
                    {p.title || "(Untitled)"}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {p.slug}
                  </div>
                </td>
                <td className="p-3">
                  <Badge variant={statusColor[p.status] || "secondary"}>
                    {p.status}
                  </Badge>
                </td>
                <td className="p-3 uppercase text-xs">{p.type}</td>
                <td className="p-3">
                  {p.updatedAt
                    ? format(new Date(p.updatedAt), "dd MMM yyyy, HH:mm")
                    : "—"}
                </td>
                <td className="p-3 text-right">
                  <Link href={`/dashboard/posts/${p._id}/edit`} className="text-blue-700 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No posts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {items.map((p) => (
          <div key={p._id} className="rounded border p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/dashboard/posts/${p.id}/page`} className="font-medium hover:underline">
                  {p.title || "(Untitled)"}
                </Link>
                <div className="text-xs text-muted-foreground">/{p.slug}</div>
              </div>
              <Badge variant={statusColor[p.status] || "secondary"}>{p.status}</Badge>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {p.updatedAt ? format(new Date(p.updatedAt), "dd MMM yyyy, HH:mm") : "—"} · {p.type}
            </div>
            <div className="mt-2">
              <Link href={`/dashboard/posts/${p.id}/page`} className="text-blue-700 text-sm hover:underline">
                Edit
              </Link>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded border p-6 text-center text-muted-foreground">
            No posts found.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <PageLink page={pageNum - 1} disabled={pageNum <= 1} label="Prev" />
          <span className="text-sm text-muted-foreground">
            Page {pageNum} of {totalPages}
          </span>
          <PageLink page={pageNum + 1} disabled={pageNum >= totalPages} label="Next" />
        </div>
      )}
    </div>
  );
}

/** Simple server-side pagination link component */
function PageLink({ page, disabled, label }: { page: number; disabled?: boolean; label: string }) {
  const href = page < 1 ? "#" : `?page=${page}`;
  return disabled ? (
    <Button variant="outline" disabled size="sm">{label}</Button>
  ) : (
    <Link href={href}><Button variant="outline" size="sm">{label}</Button></Link>
  );
}
