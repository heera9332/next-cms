import { app } from "@/data/index";

export const SectionAbout = () => {
  const sectionData = app.sections.about;

  return (
    <section
      id="section-about"
      className="overflow-hidden relative 2xl:max-w-8xl max-w-7xl mx-auto py-4 md:py-16 px-4"
    >
      <h2 className="text-3xl md:text-4xl font-semibold text-center mb-6 md:mb-12">
        {sectionData.title}
      </h2>
      <div className="content">
        <p className="mb-4">{sectionData.description}</p>
        <ul className="list-disc ml-4">
          {sectionData.points.map((item, idx: number) => {
            return (
              <li key={idx} className="">
                {item}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
