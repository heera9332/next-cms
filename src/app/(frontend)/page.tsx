import { app } from "@/data";
import { SectionAbout } from "@/sections/section-about";
import { SectionNotes } from "@/sections/section-notes";
import { SectionTeam } from "@/sections/section-team";

export default function Home() {
  const data = app.sections.notes;
  return (
    <div className="">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <SectionNotes title={data.title} groups={data.groups} />
        <SectionAbout />
        <SectionTeam />
      </main>
    </div>
  );
}
