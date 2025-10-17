/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";
import "./editor.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import EditorJS, { OutputData } from "@editorjs/editorjs";
import { axios } from "@/lib/axios";
import { slugify } from "@/lib/slugify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import toast from "react-hot-toast";

type Status = "draft" | "published" | "private" | "archived";
type Visibility = "public" | "private" | "password";

type Initial = {
  id: string;
  title: string;
  slug: string;
  status: Status;
  visibility: Visibility;
  excerpt: string;
  menuOrder: number;
  parentId: string | null;
  content: OutputData | null;
};

type EditorTools = Record<string, EditorJS.ToolSettings>;

async function loadTools(): Promise<EditorTools> {
  const [Header, List, Paragraph, Table, Embed, Code, Quote, Checklist] =
    await Promise.all([
      import("@editorjs/header").then((m) => m.default),
      import("@editorjs/list").then((m) => m.default),
      import("@editorjs/paragraph").then((m) => m.default),
      import("@editorjs/table").then((m) => m.default),
      import("@editorjs/code").then((m) => m.default),
      import("@editorjs/quote").then((m) => m.default),
      import("@editorjs/inline-code").then((m) => m.default),
      import("@editorjs/image").then((m) => m.default),
    ]);

  return {
    header: {
      class: Header,
      inlineToolbar: true,
      config: { levels: [2, 3, 4], defaultLevel: 2 },
    },
    paragraph: { class: Paragraph, inlineToolbar: true },
    list: { class: List, inlineToolbar: true },
    table: { class: Table },
    embed: { class: Embed },
    code: { class: Code },
    quote: { class: Quote, inlineToolbar: true },
    checklist: { class: Checklist },
  };
}

export default function EditorClient({ initial }: { initial: Initial }) {
  const router = useRouter();
  const ejRef = useRef<EditorJS | null>(null);
  const holderId = useMemo(() => `editorjs-${initial.id}`, [initial.id]);

  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [status, setStatus] = useState<Status>(initial.status);
  const [visibility, setVisibility] = useState<Visibility>(initial.visibility);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [menuOrder, setMenuOrder] = useState<number>(initial.menuOrder);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const tools = await loadTools();
      if (cancelled) return;

      ejRef.current = new EditorJS({
        holder: holderId,
        autofocus: true,
        tools,
        placeholder: "Write your content here…",
        data:
          initial.content ??
          ({
            time: Date.now(),
            blocks: [],
            version: "2.0",
          } satisfies OutputData),
        onReady: () => {},
        // Optional: reduce noise in console during dev
        // @ts-expect-error — logLevel exists in recent Editor.js builds
        logLevel: "ERROR",
      });
    })();

    return () => {
      cancelled = true;
      // EditorJS#destroy is present on recent versions; guard for safety
      const instance = ejRef.current;
      ejRef.current = null;
      instance?.destroy?.();
    };
  }, [holderId, initial.content]);

  const save = useCallback(async () => {
    if (!ejRef.current) return;
    setSaving(true);
    try {
      const data: OutputData = await ejRef.current.save();
      await axios.patch(`/api/posts/${initial.id}`, {
        title: title.trim(),
        slug: slugify(slug || title),
        status,
        visibility,
        excerpt,
        menuOrder: Number.isFinite(menuOrder) ? menuOrder : 0,
        content: data,
      });
      toast.success("Saved");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }, [excerpt, menuOrder, router, slug, status, title, visibility, initial.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div
            id={holderId}
            className="min-h-[320px] rounded-xl border p-4 bg-white prose max-w-none"
          />

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Input
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as Status)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent >
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select
              value={visibility}
              onValueChange={(v) => setVisibility(v as Visibility)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="password">Password</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">Menu order</Label>
            <Input
              id="order"
              type="number"
              inputMode="numeric"
              value={menuOrder}
              onChange={(e) => setMenuOrder(Number(e.target.value))}
            />
          </div>

          <Separator />
          <div className="flex gap-2 justify-end">
            <Button onClick={save} disabled={saving} className="px-6">
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
