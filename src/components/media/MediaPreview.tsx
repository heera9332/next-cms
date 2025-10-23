"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  url: string;
  mime?: string;
  title?: string;
  className?: string;
  height?: number;
  allowFullscreen?: boolean;
};

const EXT_MIME_MAP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogv": "video/ogg",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".pdf": "application/pdf",
};

function guessMime(url: string, fallback?: string) {
  try {
    const lower = url.split("?")[0].toLowerCase();
    const ext = lower.slice(lower.lastIndexOf("."));
    return EXT_MIME_MAP[ext] || fallback || "";
  } catch {
    return fallback || "";
  }
}

export function MediaPreview({
  url,
  mime,
  title,
  className,
  height = 224,
  allowFullscreen = false,
}: Props) {
  const detected = mime || guessMime(url, "");
  const isImg = detected.startsWith("image/");
  const isVideo = detected.startsWith("video/");
  const isAudio = detected.startsWith("audio/");
  const isPdf = detected === "application/pdf";

  const boxClasses =
    "w-full rounded border overflow-hidden bg-background flex items-center justify-center";

  if (!url) {
    return (
      <div className={cn(boxClasses, className)} style={{ height }}>
        <div className="text-sm text-muted-foreground">No file</div>
      </div>
    );
  }

  if (isImg) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <div className={cn("relative", boxClasses, className)} style={{ height }}>
        <img
          src={url}
          alt={title || "image"}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className={cn(boxClasses, className)} style={{ height }}>
        <video
          src={url}
          controls
          className="w-full h-full object-contain bg-black"
          preload="metadata"
        />
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className={cn(boxClasses, className)} style={{ height }}>
        <audio src={url} controls className="w-full" />
      </div>
    );
  }

  if (isPdf) {
    // PDF inside iframe; most browsers render this inline
    return (
      <div className={cn(boxClasses, className)} style={{ height }}>
        <iframe
          src={`${url}#view=FitH`}
          className="w-full h-full"
          loading="lazy"
          sandbox="allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
          allowFullScreen={allowFullscreen}
          title={title || "document"}
        />
      </div>
    );
  }

  // Fallback: unknown/other types
  const fileName = (() => {
    try {
      const p = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
      return decodeURIComponent(p.pathname.split("/").pop() || "");
    } catch {
      return url.split("/").pop() || url;
    }
  })();

  return (
    <div className={cn("space-y-2", className)}>
      <div className={cn(boxClasses)} style={{ height }}>
        <div className="text-sm text-muted-foreground px-4 text-center">
          <div className="font-medium truncate max-w-[280px] mx-auto">{title || fileName}</div>
          <div className="mt-1 text-xs opacity-80">{detected || "file"}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-sm rounded border hover:bg-muted"
        >
          Open
        </a>
        <a
          href={url}
          download={fileName}
          className="px-3 py-1.5 text-sm rounded border hover:bg-muted"
        >
          Download
        </a>
      </div>
    </div>
  );
}
