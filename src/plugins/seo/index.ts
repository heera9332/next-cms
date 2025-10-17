import { addFilter, addAction } from "@/packages/core/hooks";

addFilter("render:html", async (html: string) => {
  // inject meta tags if missing
  return html;
});

addAction("post:created", async () => {
  // ping search engine webhook, etc.
});