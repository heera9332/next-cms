"use client";

import { useCallback, useRef, useState } from "react";

export type MediaItem = {
  id: string;
  title: string;
  url: string;
  mime: string;
  size: number;
};

type UploadStatus = "idle" | "uploading" | "done" | "error";

type Props = {
  /** Called for each successfully uploaded file (created post type = "media"). */
  onUploaded?: (item: MediaItem) => void;
  /** Accept filter, e.g. "image/*,video/*". Default "image/*". */
  accept?: string;
  /** Allow multiple file selection. Default false. */
  multiple?: boolean;
  /** Max bytes per file (default 10 MB). */
  maxSize?: number;
  /** Optional className for container */
  className?: string;
};

export default function MediaUpload({
  onUploaded,
  accept = "image/*",
  multiple = false,
  maxSize = 10 * 1024 * 1024,
  className = "",
}: Props) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<{ name: string; url?: string }[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setStatus("idle");
    setError(null);
    setPreviews([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const validate = (file: File) => {
    if (file.size > maxSize) {
      throw new Error(
        `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB (max ${(maxSize / (1024 * 1024)).toFixed(0)}MB)`
      );
    }
  };

  const uploadOne = async (file: File) => {
    validate(file);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/media", {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || "Upload failed");
    }
    const j = await res.json();
    const item: MediaItem = {
      id: String(j?.media?.id ?? ""),
      title: j?.media?.title ?? file.name,
      url: j?.url ?? "",
      mime: j?.media?.mime ?? file.type,
      size: j?.media?.size ?? file.size,
    };
    onUploaded?.(item);
    return item;
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setStatus("uploading");
      setError(null);

      // show local previews for images
      const pv = Array.from(files).slice(0, multiple ? files.length : 1).map((f) => ({
        name: f.name,
        url: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      }));
      setPreviews(pv);

      try {
        const targets = Array.from(files).slice(0, multiple ? files.length : 1);
        for (const f of targets) {
          await uploadOne(f);
        }
        setStatus("done");
      } catch (e: any) {
        setStatus("error");
        setError(e?.message || "Upload failed");
      }
    },
    [multiple]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void handleFiles(e.target.files);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    void handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Dropzone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="rounded-lg border border-dashed p-6 text-center cursor-pointer hover:bg-muted/40"
        onClick={() => inputRef.current?.click()}
        role="button"
        aria-label="Upload media"
        tabIndex={0}
      >
        <p className="text-sm">Drag & drop file here, or click to browse</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Accept: {accept} · Max {(maxSize / (1024 * 1024)).toFixed(0)}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onInputChange}
          hidden
        />
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {previews.map((p, i) => (
            <div key={`${p.name}-${i}`} className="border rounded-lg overflow-hidden">
              {p.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.url} alt={p.name} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 flex items-center justify-center text-xs text-muted-foreground bg-muted">
                  {p.name}
                </div>
              )}
              <div className="p-2 text-xs truncate" title={p.name}>
                {p.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status / Errors */}
      {status === "uploading" && (
        <div className="text-sm text-muted-foreground">Uploading…</div>
      )}
      {status === "done" && (
        <div className="text-sm text-green-600">Upload complete.</div>
      )}
      {status === "error" && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {/* Controls */}
      {status !== "uploading" && previews.length > 0 && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="px-3 py-1.5 text-sm rounded border hover:bg-muted"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
