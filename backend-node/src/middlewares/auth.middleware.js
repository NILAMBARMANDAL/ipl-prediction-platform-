import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

// verifyJWT: route guard for protected endpoints. It reads the access token from
// the httpOnly cookie (or Authorization header as a fallback), verifies it, loads
// the user, and attaches it to req.user so downstream controllers know who's calling.
export const verifyJWT = asyncHandler(async (req, _res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired access token");
  }

  const user = await User.findById(decoded?._id).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(401, "Invalid access token");
  }

  req.user = user;
  next();
});
// attachUserIfPresent: "soft" auth for routes that work for everyone but do
// something extra for logged-in users. Unlike verifyJWT, this NEVER blocks the
// request — if a valid token is present it sets req.user, otherwise it quietly
// continues with req.user undefined. The predictor uses this: anyone can predict,
// but a logged-in user also gets their prediction saved to history.
export const attachUserIfPresent = asyncHandler(async (req, _res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return next(); // anonymous — that's fine, carry on
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded?._id).select("-password -refreshToken");
    if (user) req.user = user;
  } catch {
    // Invalid/expired token on an optional route is not an error — just treat the
    // caller as anonymous rather than rejecting the request.
  }

  next();
});