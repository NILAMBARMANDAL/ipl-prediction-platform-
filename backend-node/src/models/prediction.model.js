
import mongoose, { Schema } from "mongoose";

// Prediction schema — stores a saved win-probability prediction made by a logged-in
// user. This is what gives authentication a real purpose: signed-in users get their
// prediction history saved and can review it later. (Anonymous users can still use
// the predictor; their results just aren't persisted.)
const predictionSchema = new Schema(
  {
    // Which user made this prediction. Indexed because we always query by user.
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // The match situation the user entered.
    battingTeam: { type: String, required: true },
    bowlingTeam: { type: String, required: true },
    city: { type: String, required: true },
    target: { type: Number, required: true },
    currentScore: { type: Number, required: true },
    overs: { type: Number, required: true },
    wickets: { type: Number, required: true },

    // The model's output we want to show in history.
    winProbability: { type: Number, required: true }, // percentage for the batting team
    lossProbability: { type: Number, required: true },
  },
  { timestamps: true } // createdAt lets us show "when" and sort newest-first
);

export const Prediction = mongoose.model("Prediction", predictionSchema);