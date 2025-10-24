/* eslint-disable @next/next/no-img-element */
import React, { useMemo } from "react";

export function humanSize(bytes?: number) {
  if (typeof bytes !== "number") return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  const fixed = n >= 10 || i === 0 ? 0 : 1;
  return `${n.toFixed(fixed)} ${units[i]}`;
}

function kindFromMime(mime?: string) {
  if (!mime) return "other" as const;
  if (mime.startsWith("image/")) return "image" as const;
  if (mime.startsWith("video/")) return "video" as const;
  if (mime.startsWith("audio/")) return "audio" as const;
  if (mime === "application/pdf") return "pdf" as const;
  return "other" as const;
}

export type MediaPreviewProps = {
  url: string;
  mime?: string;
  title?: string;
  size?: number;
  /** fixed height for image/video frame; defaults to 224px if not given */
  height?: number;
  /** show a small footer line with mime + size */
  footer?: boolean;
};

export function MediaPreview({
  url,
  mime,
  title = "Media",
  size,
  height = 224,
  footer = false,
}: MediaPreviewProps) {
  const kind = useMemo(() => kindFromMime(mime), [mime]);

  return (
    <div className="rounded border overflow-hidden bg-background">
      <div className="p-2">
        {kind === "image" && (
          <img
            src={url}
            alt={title || "image"}
            style={{ maxHeight: height, width: "100%", objectFit: "contain" }}
          />
        )}

        {kind === "video" && (
          <video
            src={url}
            controls
            style={{ maxHeight: height, width: "100%", display: "block" }}
          />
        )}

        {kind === "audio" && (
          <audio src={url} controls style={{ width: "100%" }} />
        )}

        {kind === "pdf" && (
          <iframe
            src={url}
            title={title || "PDF"}
            style={{ width: "100%", height: height + 200 }}
          />
        )}

        {kind === "other" && (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium text-sm truncate" title={title}>
                {title}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {mime || "file"}
                {typeof size === "number" ? ` · ${humanSize(size)}` : ""}
              </div>
            </div>
            <a
              className="shrink-0 text-sm rounded border px-3 py-1.5 hover:bg-muted"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              Open
            </a>
          </div>
        )}
      </div>

      {footer && (
        <div className="border-t px-3 py-2 text-xs text-muted-foreground">
          {mime || "file"}
          {typeof size === "number" ? ` · ${humanSize(size)}` : ""}
        </div>
      )}
    </div>
  );
}
