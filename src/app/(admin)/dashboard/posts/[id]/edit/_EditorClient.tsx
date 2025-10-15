"use client";
import { slugify } from "@/lib/slugify";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { axios } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import toast from "react-hot-toast";

type EditorJS = typeof import("@editorjs/editorjs").default;

type Initial = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "private" | "archived";
  visibility: "public" | "private" | "password";
  excerpt: string;
  menuOrder: number;
  parentId: string | null;
  content: { time?: number; blocks: any[]; version?: string };
};

const EditorJSDynamic = dynamic(() => import("@editorjs/editorjs").then(m => m.default), { ssr: false });

// Tools (lazy imports to keep bundle small)
async function tools() {
  const [Header, List, Paragraph, Table, Embed, Code, Quote, Checklist, Marker, InlineCode, LinkTool, ImageTool] =
    await Promise.all([
      import("@editorjs/header").then(m => m.default),
      import("@editorjs/list").then(m => m.default),
      import("@editorjs/paragraph").then(m => m.default),
      import("@editorjs/table").then(m => m.default),
      import("@editorjs/embed").then(m => m.default),
      import("@editorjs/code").then(m => m.default),
      import("@editorjs/quote").then(m => m.default),
      import("@editorjs/checklist").then(m => m.default),
      import("@editorjs/marker").then(m => m.default),
      import("@editorjs/inline-code").then(m => m.default),
      import("@editorjs/link").then(m => m.default),
      import("@editorjs/image").then(m => m.default),
    ]);

  return {
    header: Header,
    paragraph: { class: Paragraph, inlineToolbar: true },
    list: { class: List, inlineToolbar: true },
    table: Table,
    embed: Embed,
    code: Code,
    quote: Quote,
    checklist: Checklist,
    marker: Marker,
    inlineCode: InlineCode,
    linkTool: {
      class: LinkTool,
      config: {
        endpoint: "/api/link/preview", // implement if you want link previews
      },
    },
    image: {
      class: ImageTool,
      config: {
        uploader: {
          async uploadByFile(file: File) {
            // 1) ask server for a signed upload OR just post the file
            const form = new FormData();
            form.append("file", file);
            const { data } = await axios.post("/api/media/upload", form, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            // EditorJS expects { success: 1, file: { url: string } }
            return { success: 1, file: { url: data.url } };
          },
        },
      },
    },
  };
}

export default function EditorClient({ initial }: { initial: Initial }) {
  const router = useRouter();
  const ejRef = useRef<EditorJS | null>(null);
  const holderId = useMemo(() => `editorjs-${initial.id}`, [initial.id]);

  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [status, setStatus] = useState<Initial["status"]>(initial.status);
  const [visibility, setVisibility] = useState<Initial["visibility"]>(initial.visibility);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [menuOrder, setMenuOrder] = useState(initial.menuOrder);
  const [saving, setSaving] = useState(false);

  // init Editor.js once
  useEffect(() => {
    let mounted = true;
    (async () => {
      const T = await tools();
      const Editor = (await import("@editorjs/editorjs")).default;
      if (!mounted) return;

      ejRef.current = new Editor({
        holder: holderId,
        autofocus: true,
        tools: T,
        data: initial.content ?? { time: Date.now(), blocks: [], version: "2.x" },
        placeholder: "Write your content here…",
        onReady: () => {},
      });
    })();

    return () => {
      mounted = false;
      // @ts-ignore
      if (ejRef.current && typeof ejRef.current.destroy === "function") ejRef.current.destroy();
      ejRef.current = null;
    };
  }, [holderId, initial.content]);

  const save = useCallback(async () => {
    if (!ejRef.current) return;
    setSaving(true);
    try {
      const data = await ejRef.current.save();
      // Send minimal patch expected by your /api/posts/[id] route
      await axios.patch(`/api/posts/${initial.id}`, {
        title: title.trim(),
        slug: slugify(slug || title),
        status,
        visibility,
        excerpt,
        menuOrder: Number(menuOrder) || 0,
        content: data, // { time, blocks, version } matches zEditorJs
      });
      toast.success("Saved");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  }, [excerpt, menuOrder, router, slug, status, title, visibility, initial.id]);

  // Ctrl/Cmd+S
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
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div id={holderId} className="min-h-[320px] rounded border p-3 bg-white" />

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Input id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
              <SelectTrigger><SelectValue placeholder="Visibility" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="password">Password</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">Menu order</Label>
            <Input id="order" type="number" value={menuOrder} onChange={(e) => setMenuOrder(Number(e.target.value))} />
          </div>

          <Separator />
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
 