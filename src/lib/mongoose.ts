import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI!
if (!MONGODB_URI) throw new Error("MONGODB_URI missing")

type GlobalWithMongoose = typeof globalThis & { _mongoose?: Promise<typeof mongoose> }

let cached = (global as GlobalWithMongoose)._mongoose
if (!cached) {
  cached = mongoose.connect(MONGODB_URI, { dbName: undefined })
  ;(global as GlobalWithMongoose)._mongoose = cached
}

export async function dbConnect() {
  return cached
}
