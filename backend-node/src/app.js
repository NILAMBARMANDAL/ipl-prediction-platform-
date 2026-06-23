import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/ApiError.js";

const app = express();

// --- Core middleware ---

// CORS: the browser blocks cross-origin requests unless the server opts in.
// Because we use httpOnly cookies for auth, we MUST set credentials:true AND
// echo back the specific requesting origin (a wildcard "*" is not allowed with
// credentials).
//
// We accept a COMMA-SEPARATED list in CORS_ORIGIN (so you can allow both a local
// and a deployed frontend), and we always allow localhost:5173 in development as
// a safety net. The function form lets us validate each incoming origin and gives
// a clear error if one isn't allowed.
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, "")) // trim spaces + any trailing slash
  .filter(Boolean);

// Always permit the local Vite dev server, even if .env is misconfigured.
if (!allowedOrigins.includes("http://localhost:5173")) {
  allowedOrigins.push("http://localhost:5173");
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no Origin header), e.g. curl/Postman/health checks.
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// Parse incoming JSON bodies (with a sane size limit) and URL-encoded forms.
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Parse cookies so we can read the httpOnly auth cookie on protected routes.
app.use(cookieParser());

// --- Routes ---
// Imported here and mounted under /api/v1 so the API is versioned from day one,
// matching MedFlow. (Route files are added in later stages.)
import analyticsRouter from "./routes/analytics.routes.js";
import predictRouter from "./routes/predict.routes.js";
import userRouter from "./routes/user.routes.js";

app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/predict", predictRouter);
app.use("/api/v1/users", userRouter);

// Simple health check — handy for Docker/monitoring to confirm the app is up.
app.all("/api/v1/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "ipl-node-backend" });
});
// --- Central error handler ---
// Express identifies error middleware by its FOUR arguments. Every error thrown
// in any asyncHandler-wrapped controller lands here. We translate ApiError into
// its proper status/shape, and fall back to 500 for anything unexpected.
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
      success: err.success,
      errors: err.errors,
    });
  }

  console.error("UNHANDLED ERROR:", err);
  return res.status(500).json({
    statusCode: 500,
    message: "Internal Server Error",
    success: false,
    errors: [],
  });
});

export { app };