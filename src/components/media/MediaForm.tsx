"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { axios } from "@/lib/axios";
import { slugify } from "@/lib/slugify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import MediaUpload, { MediaItem } from "@/components/media/MediaUpload";
import { MediaPreview } from "./MediaPreview";

type Status = "draft" | "published" | "private" | "archived";
type Visibility = "public" | "private" | "password";

export type MediaInitial = {
  // null means create-mode and we don’t yet have a doc until upload
  id: string | null;
  title: string;
  slug: string;
  status: Status;
  visibility: Visibility;
  // File metadata lives in content
  url: string;
  mime: string;
  size: number;
  // extra fields
  alt: string; // meta: alt
  caption: string; // meta: caption
  description: string; // meta: description
};

type Props = {
  initial: MediaInitial | null;
};

export default function MediaForm({ initial }: Props) {
  const router = useRouter();

  // If new: we start without a post id; upload will create the doc then we switch to edit state
  const isNew = !initial?.id;

  const [id, setId] = useState<string | null>(initial?.id ?? null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [status, setStatus] = useState<Status>(initial?.status ?? "published");
  const [visibility, setVisibility] = useState<Visibility>(
    initial?.visibility ?? "public"
  );

  const [url, setUrl] = useState(initial?.url ?? "");
  const [mime, setMime] = useState(initial?.mime ?? "");
  const [size, setSize] = useState(initial?.size ?? 0);

  const [alt, setAlt] = useState(initial?.alt ?? "");
  const [caption, setCaption] = useState(initial?.caption ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  const [saving, setSaving] = useState(false);
  const [replacing, setReplacing] = useState(false);

  /** Called when a file is uploaded successfully.
   *  The upload route already creates a media post, so we receive media.id & url.
   */
  const onUploaded = useCallback(
    (m: MediaItem) => {
      // set all file fields
      setUrl(m.url);
      setMime(m.mime);
      setSize(m.size);

      // if it’s a brand-new media, capture the created id and seed title/slug
      if (!id && m.id) {
        setId(m.id);
        if (!title) setTitle(m.title || "");
        if (!slug) setSlug(slugify(m.title || ""));
        toast.success("Created media");
      } else {
        toast.success("File uploaded");
      }
    },
    [id, slug, title]
  );

  /** Replace file for existing media (re-uploads, keeps same doc id, then PATCH content). */
  const replaceFile = useCallback(
    async (file: File) => {
      if (!id) return;
      setReplacing(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        if (!res.ok) throw new Error("Upload failed");
        const j = await res.json();

        // Update UI with new file info
        const newUrl = j?.url as string;
        const newMime = j?.media?.mime as string;
        const newSize = Number(j?.media?.size ?? 0);

        setUrl(newUrl || url);
        setMime(newMime || mime);
        setSize(newSize || size);

        // Persist to the same post id
        await axios.patch(`/api/posts/${id}`, {
          content: {
            url: newUrl,
            type: newMime,
            size: newSize,
            name: j?.media?.title ?? "",
          },
        });

        toast.success("File replaced");
        router.refresh();
      } catch (e: any) {
        toast.error(e?.message || "Replace failed");
      } finally {
        setReplacing(false);
      }
    },
    [id, mime, router, size, url]
  );

  const onReplaceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void replaceFile(f);
    e.currentTarget.value = "";
  };

  const canSave = !!id && !!url;

  const save = useCallback(async () => {
    if (!id) {
      toast.error("Upload a file first");
      return;
    }
    setSaving(true);
    try {
      await axios.patch(`/api/posts/${id}`, {
        title: title.trim(),
        slug: slugify(slug || title),
        status,
        visibility,
        // optional: keep canonical metadata in meta[]
        meta: [
          { key: "alt", value: alt },
          { key: "caption", value: caption },
          { key: "description", value: description },
        ],
        // content holds the file specifics
        content: {
          url,
          type: mime,
          size,
          name: title || "",
          alt,
          caption,
          description,
        },
      });
      toast.success("Saved");
      router.refresh();
      // if it was “new”, after first save redirect to edit route
      if (isNew && id) router.replace(`/dashboard/media/${id}/edit`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }, [
    alt,
    caption,
    description,
    id,
    isNew,
    mime,
    router,
    size,
    slug,
    status,
    title,
    url,
    visibility,
  ]);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isNew ? "Add Media" : "Edit Media"}
        </h1>
        <div className="flex gap-2">
          <Button onClick={save} disabled={!canSave || saving} className="px-6">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Upload / Preview */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-3 md:col-span-1">
          <label className="block text-sm font-medium">File</label>

          {url ? (
            <>
              <MediaPreview
                url={url}
                mime={mime}
                title={title || "Media"}
                height={224}
              />

              <div className="text-xs text-muted-foreground">
                {mime || "file"}{" "}
                {size ? `· ${(size / (1024 * 1024)).toFixed(2)} MB` : ""}
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-block">
                  <input type="file" onChange={onReplaceInput} hidden />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!id || replacing}
                  >
                    {replacing ? "Replacing…" : "Replace file"}
                  </Button>
                </label>
              </div>
            </>
          ) : (
            <MediaUpload
              multiple={false}
              onUploaded={onUploaded}
              accept="image/*,video/*,audio/*,application/pdf"
            />
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-4 md:col-span-2">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto from title"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as Status)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
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
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alt">Alt text</Label>
              <Input
                id="alt"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Describe the image"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Short caption"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
