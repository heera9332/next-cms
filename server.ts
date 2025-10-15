// server.ts
import next from "next";
import http from "http";
import mongoose from "mongoose";
import { connectMongo } from "@/packages/core/db/connection";

// const dev = process.env.NODE_ENV !== "production";
const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT || 3000);


function graceful() {
  const close = async (sig: string) => {
    console.log(`\n${sig} received. Closing…`);
    await mongoose.connection.close();
    process.exit(0);
  };
  ["SIGINT", "SIGTERM"].forEach((s) => process.on(s, () => close(s)));
}

async function main() {
  await connectMongo();
  graceful();

  const app = next({ dev });
  const handle = app.getRequestHandler();
  await app.prepare();

  http.createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`🚀 Next on http://localhost:${port}`);
  });
}

main().catch((e) => {
  console.error("Fatal start error:", e);
  process.exit(1);
});
