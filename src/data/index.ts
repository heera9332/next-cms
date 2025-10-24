export const app = {
  global: {
    siteTitle: "NextJS CMS",
    siteDescription: "",
  },
  sections: {
    team: {
      title: "Meet Our Team",
      members: [
        {
          name: "Heera Singh Lodhi",
          link: "https://www.linkedin.com/in/heera9331",
          description:
            "I am Heera Singh Lodhi, a passionate and dedicated software developer with a strong foundation in computer science and engineering.",
          avatarImage:
            "https://edevhindi.com/wp-content/uploads/2024/05/heera-singh-bg-e1715956177722.png.webp",
        },
        {
          name: "Rahul Sen",
          link: "https://www.linkedin.com/in/heera9331",
          description:
            "I have a keen interest in programming and possess solid knowledge of object-oriented programming, HTML, CSS, JavaScript, WordPress and wix studio.",
          avatarImage:
            "https://edevhindi.com/wp-content/uploads/2024/05/heera-singh-bg-e1715956177722.png.webp",
        },
        {
          name: "Rahul Sen",
          link: "https://www.linkedin.com/in/heera9331",
          description:
            "Greate knowledge of web development and drag & drop website builders like WordPress, Wix Studio and also HTML, CSS, JS",
          avatarImage:
            "https://edevhindi.com/wp-content/uploads/2024/05/heera-singh-bg-e1715956177722.png.webp",
        },
      ],
    },
    about: {
      title: "About us",
      subTitle: "Edebhindi",
      description:
        "edevhindi एक blogging website है जहाँ पर आप मिलते computer development सम्बन्धित articles मिलते है, जिनकी मदद से आप programming, कॉलेज, university आदि के लिए नोट्स प्राप्त कर सकते है।",
      points: [
        "edevhindi अभी एक developing website है, जिस पर blogs अभी बहुत कम है in future add करता रहूँगा।",
        "website एवं articles अच्छे लगे हो तो अपने friends के साथ share कर सकते और नोटिफिकेशन को चालू रखें latest update पाने के लिए।",
      ],
    },
    notes: {
      title: "Quick Link for Notes",
      groups: [
        {
          title: "Operating System Notes",
          items: [
            { label: "SJF (SHORTEST JOB FIRST) CPU SCHEDULING", href: "/notes/os/sjf" },
            { label: "FCFS CPU Scheduling", href: "/notes/os/fcfs" },
            { label: "Process And Process State Diagram", href: "/notes/os/process-states" },
            { label: "Types of Operating System", href: "/notes/os/types" },
            { label: "Introduction to Operating System", href: "/notes/os/intro" },
          ],
          moreHref: "/notes/os",
        },
        {
          title: "DBMS Notes",
          items: [
            { label: "API in Hindi", href: "/notes/dbms/api-hindi" },
            { label: "Normalization in DBMS in Hindi", href: "/notes/dbms/normalization-hindi" },
            { label: "Keys in DBMS (हिंदी)", href: "/notes/dbms/keys-hindi" },
            { label: "MySQL in hindi", href: "/notes/dbms/mysql-hindi" },
            { label: "Database Administrator in Hindi", href: "/notes/dbms/dba-hindi" },
          ],
          moreHref: "/notes/dbms",
        },
        {
          title: "PHP Notes",
          items: [
            { label: "API in Hindi", href: "/notes/php/api-hindi" },
            { label: "Difference Between GET and POST Methods in PHP", href: "/notes/php/get-vs-post" },
          ],
          moreHref: "/notes/php",
        },
        {
          title: "Random Notes",
          items: [
            { label: "What is Headless CMS?", href: "/notes/random/headless-cms" },
            { label: "Introduction to Java (हिंदी)", href: "/notes/random/java-intro-hindi" },
            { label: "Union in C", href: "/notes/random/union-in-c" },
            { label: "File handling in C", href: "/notes/random/file-handling-c" },
            { label: "Pointers in C", href: "/notes/random/pointers-c" },
          ],
          moreHref: "/notes",
        },
      ],
    }
  },
};
