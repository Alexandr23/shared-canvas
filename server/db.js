import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: "../.env" });

export const connectDB = () => {
  const USER = process.env.MONGO_DB_USER;
  const PASSWORD = process.env.MONGO_DB_PASSWORD;

  const uri = `mongodb+srv://${USER}:${PASSWORD}@cluster0.nhrydsy.mongodb.net/shared-canvas?retryWrites=true&w=majority`;

  mongoose.connect(uri);
};
