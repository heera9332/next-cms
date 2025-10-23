"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw } from "lucide-react";

export default function PostsControls({
  qDefault = "",
  statusDefault = "all",
  typeDefault = "media",
  limitDefault = "20",
}: {
  qDefault?: string;
  statusDefault?: string;
  typeDefault?: string;
  limitDefault?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(qDefault);
  const [status, setStatus] = useState(statusDefault);
  const [type, setType] = useState(typeDefault);
  const [limit, setLimit] = useState(limitDefault);

  const buildUrl = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams(sp.toString());
      const next = {
        q,
        status,
        type,
        limit,
        page: "1",
        ...Object.fromEntries(params.entries()),
        ...overrides,
      };
      Object.entries(next).forEach(([k, v]) => {
        if (!v || v === "all") params.delete(k);
        else params.set(k, v);
      });
      return `${pathname}?${params.toString()}`;
    },
    [sp, pathname, q, status, type, limit]
  );

  const push = useCallback(
    (overrides: Record<string, string | undefined> = {}) => {
      startTransition(() => router.replace(buildUrl(overrides)));
    },
    [router, buildUrl]
  );

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => push({ q }), 300);
    return () => clearTimeout(t);
  }, [q, push]);

  const resetAll = () => {
    setQ("");
    setStatus("all");
    setType("post");
    setLimit("20");
    push({ q: "", status: "all", type: "post", limit: "20", page: "1" });
  };

  return (
    <div className="rounded-lg border bg-card/40 backdrop-blur-sm">
      <div className="p-3 md:p-4">
        {/* Row layout on md+, stacked on mobile */}
        <div className="grid gap-3 md:grid-cols-12">
          {/* Search */}
          <div className="md:col-span-5">
            <Label htmlFor="search" className="text-[11px] font-medium text-muted-foreground">
              Search
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title or content…"
                className="pl-9 h-12"
                aria-label="Search posts"
              />
            </div>
          </div>

          {/* Status */}
          <div className="md:col-span-2">
            <Label className="text-[11px] font-medium text-muted-foreground">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                push({ status: v, page: "1" });
              }}
            >
              <SelectTrigger className="w-full h-9 mt-1">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type */}
          <div className="md:col-span-2">
            <Label className="text-[11px] font-medium text-muted-foreground">Type</Label>
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v);
                push({ type: v, page: "1" });
              }}
            >
              <SelectTrigger className="w-full h-9 mt-1">
                <SelectValue placeholder="post" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="post">Post</SelectItem>
                <SelectItem value="page">Page</SelectItem>
                <SelectItem value="media">Media</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Limit */}
          <div className="md:col-span-2">
            <Label className="text-[11px] font-medium text-muted-foreground">Per page</Label>
            <Select
              value={limit}
              onValueChange={(v) => {
                setLimit(v);
                push({ limit: v, page: "1" });
              }}
            >
              <SelectTrigger className="w-full h-9 mt-1">
                <SelectValue placeholder="20" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset */}
          <div className="md:col-span-1 flex items-end">
            <Button
              variant="outline"
              size="lg"
              onClick={resetAll}
              className="w-full h-12 gap-2 mt-1"
              aria-busy={isPending}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
