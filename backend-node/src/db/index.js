import mongoose from "mongoose";

// DB_NAME: the database name appended to your Atlas connection string.
// Keeping it as a constant (rather than hardcoding in the URI) means you can
// point the same cluster at different DBs (e.g. dev vs test) cleanly.
const DB_NAME = "ipl_analytics";

// connectDB: establishes the single shared Mongoose connection at startup.
// We await this in index.js BEFORE starting the HTTP server, so the app never
// accepts requests it can't serve. On failure we exit the process — a server
// with no database is useless, so failing loudly is correct.
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `\n MongoDB connected. Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB connection FAILED:", error);
    process.exit(1);
  }
};

export default connectDB;
