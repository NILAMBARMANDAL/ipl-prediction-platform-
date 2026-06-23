import axios from "axios";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Prediction } from "../models/prediction.model.js";

const predictWin = asyncHandler(async (req, res) => {
  const {
    battingTeam,
    bowlingTeam,
    city,
    target,
    currentScore,
    overs,
    wickets,
  } = req.body;

  // Validate presence (fast feedback; FastAPI validates types/ranges again).
  const required = { battingTeam, bowlingTeam, city, target, currentScore, overs, wickets };
  for (const [k, v] of Object.entries(required)) {
    if (v === undefined || v === null || v === "") {
      throw new ApiError(400, `Missing required field: ${k}`);
    }
  }
  if (battingTeam === bowlingTeam) {
    throw new ApiError(400, "Batting and bowling teams must be different");
  }

  // Forward raw match state to the ML service. FastAPI does the feature math with
  // the shared module and returns probabilities + the engineered features.
  const mlUrl = `${process.env.ML_SERVICE_URL}/predict`;
  let mlResponse;
  try {
    mlResponse = await axios.post(
      mlUrl,
      {
        batting_team: battingTeam,
        bowling_team: bowlingTeam,
        city,
        target: Number(target),
        current_score: Number(currentScore),
        overs: Number(overs),
        wickets: Number(wickets),
      },
      { timeout: 8000 }
    );
  } catch (err) {
    // Surface the ML service's own validation message when it 4xx's, else a 502.
    const status = err.response?.status;
    const detail =
      err.response?.data?.detail || err.message || "ML service unreachable";
    if (status && status >= 400 && status < 500) {
      throw new ApiError(status, detail);
    }
    throw new ApiError(502, `Prediction service error: ${detail}`);
  }

  const { win_probability, loss_probability, features } = mlResponse.data;

  // Map the ML service's snake_case features to camelCase for the JS frontend.
  // This is a legitimate gateway job: presenting a clean, JS-idiomatic API to the
  // client while the Python service speaks its own conventions internally.
  const camelFeatures = {
    runsLeft: features.runs_left,
    ballsLeft: features.balls_left,
    wicketsLeft: features.wickets_left,
    crr: features.crr,
    rrr: features.rrr,
  };

  const winPct = Math.round(win_probability * 1000) / 10;
  const lossPct = Math.round(loss_probability * 1000) / 10;

  // If the caller is logged in (attachUserIfPresent set req.user), save this
  // prediction to their history. This is what makes signing in worthwhile —
  // anonymous users still get the prediction below, it just isn't persisted.
  // We don't let a history-save failure break the prediction response, so it's
  // wrapped defensively.
  if (req.user) {
    try {
      await Prediction.create({
        user: req.user._id,
        battingTeam,
        bowlingTeam,
        city,
        target: Number(target),
        currentScore: Number(currentScore),
        overs: Number(overs),
        wickets: Number(wickets),
        winProbability: winPct,
        lossProbability: lossPct,
      });
    } catch (e) {
      console.error("Failed to save prediction history:", e.message);
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        battingTeam,
        bowlingTeam,
        winProbability: winPct,
        lossProbability: lossPct,
        features: camelFeatures,
        saved: Boolean(req.user), 
      },
      "Win probability computed"
    )
  );
});

/**
 * GET /api/v1/predict/history
 *
 * Returns the logged-in user's saved predictions, newest first. This route is
 * protected (verifyJWT) because a user should only see their OWN history — it's
 * the payoff for signing in.
 */
const getHistory = asyncHandler(async (req, res) => {
  const predictions = await Prediction.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, predictions, "Your recent predictions"));
});

export { predictWin, getHistory };
