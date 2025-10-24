// components/sections/SectionNotes.tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import clsx from "clsx";

type NoteItem = { label: string; href: string };
type NoteGroup = { title: string; items: NoteItem[]; moreHref: string };
type SectionNotesProps = {
  title: string;
  groups: NoteGroup[]; // expect 4 groups for the layout in the screenshot
  maxItemsPerGroup?: number; // default 5 (like the screenshot)
};

export function SectionNotes({
  title,
  groups,
  maxItemsPerGroup = 5,
}: SectionNotesProps) {
  return (
    <section
      className={clsx(
        "relative mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-16"
      )}
    >
      {/* Title */}
      <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight md:text-4xl ">
        <span className="bg-gradient-to-r from-foreground/90 to-blue-600/60 bg-clip-text text-transparent">
          {title}
        </span>
      </h2>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group, idx) => (
          <Card
            key={idx}
            className="relative h-full overflow-hidden border bg-card text-card-foreground transition-all duration-300 hover:shadow-none"
          >
            {/* Subtle top gradient accent */}
            <div
              className={clsx(
                "pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r"
              )}
            />

            <CardHeader className="border-b/60">
              <h3 className="text-xl font-semibold leading-tight md:text-2xl">
                <span className="bg-gradient-to-r from-foreground/90 to-blue-600/60 bg-clip-text text-transparent hover:text-black">
                  {group.title}
                </span>
              </h3>
            </CardHeader>

            <CardContent className="pt-6">
              <ul className="mb-6 space-y-3">
                {group.items.slice(0, maxItemsPerGroup).map((item, i) => (
                  <li key={i} className="group flex items-start gap-3">
                    {/* custom bullet */}
                    <span className="mt-2 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-primary/80 ring-2 ring-primary/15" />
                    <Link
                      href={item.href}
                      className="flex-1 text-[0.97rem] leading-relaxed text-foreground/90 underline-offset-4 transition-all duration-200 hover:translate-x-0.5 hover:underline hover:text-blue-600"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <Link
                href={group.moreHref}
                className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                View More
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
