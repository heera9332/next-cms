import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI!;
let isConnected = false;

export async function connectMongo() {
  if (isConnected) return;

  if (mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }

  await mongoose.connect(MONGO_URI, { dbName: process.env.MONGO_DB || "nextcms" });
  isConnected = true;

  console.log("Mongo connected:", mongoose.connection.name);
}
