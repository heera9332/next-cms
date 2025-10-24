import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { app } from "@/data/index";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const SectionTeam = () => {
  const sectionData = app.sections.team;

  return (
    <section
      id="section-team"
      className="overflow-hidden relative 2xl:max-w-8xl max-w-7xl mx-auto py-4 md:py-16 px-4"
    >
      <h2 className="text-3xl md:text-4xl font-semibold text-center mb-6 md:mb-12">
        {sectionData.title}
      </h2>
      <div className="content">
        <div className="team-members grid md:grid-cols-3 gap-4 md:gap-8">
          {sectionData.members.map((member, idx: number) => {
            return (
              <Card
                id=""
                className="member hover:shadow-none transition-all"
                key={idx}
              >
                <CardHeader>
                  <div className="rounded-full overflow-hidden">
                    <Image
                      src={member.avatarImage}
                      alt="image"
                      width={1000}
                      height={1000}
                      className="w-56 rounded-full"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-2xl mb-4 hover:text-blue-600 transition-colors cursor-pointer ">
                    <Link
                      className="flex justify-start items-center gap-2 group"
                      href={member.link}
                      target="_blank"
                    >
                      {member.name}
                      <ArrowRight className="rotate-[300deg] group-hover:scale-x-105 hidden group-hover:block" />
                    </Link>
                  </h3>
                  <p>{member.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
