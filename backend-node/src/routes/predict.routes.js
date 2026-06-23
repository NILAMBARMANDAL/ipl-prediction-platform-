import { Router } from "express";
import { predictWin, getHistory } from "../controllers/predict.controller.js";
import { verifyJWT, attachUserIfPresent } from "../middlewares/auth.middleware.js";

const router = Router();

// Predict is open to everyone. attachUserIfPresent is "soft" auth: it doesn't
// block anonymous users, but if the caller IS logged in, it sets req.user so the
// controller can save the prediction to their history.
router.route("/").post(attachUserIfPresent, predictWin);

// History is private — only a logged-in user can see their own saved predictions.
router.route("/history").get(verifyJWT, getHistory);

export default router;