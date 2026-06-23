// index.js: the bootstrap. Order matters here — we load environment variables
// FIRST, then connect to MongoDB, and only once the DB is connected do we start
// the HTTP server. This guarantees the app never serves a request before its
// data layer is ready.
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 8001;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(` Node backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
