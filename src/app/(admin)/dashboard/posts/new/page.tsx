// src/app/dashboard/media/new/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import MediaForm, { MediaInitial } from "@/components/media/MediaForm";

export default async function Page() {
  // No doc yet; form will create after upload
  const initial: MediaInitial | null = null;

  return (
    <div>
      <MediaForm initial={initial} />
    </div>
  );
}
