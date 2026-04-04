import mongoose from "mongoose";
import { env } from "../config/env";

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    return mongoose.connection;
  }

  await mongoose.connect(process.env.MONGO_URI ?? env.MONGO_URI);
  isConnected = true;

  return mongoose.connection;
}

export async function disconnectDatabase() {
  if (!isConnected) {
    return;
  }

  await mongoose.disconnect();
  isConnected = false;
}
