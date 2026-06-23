import mongoose, { Schema } from "mongoose";

// Match schema — mirrors the columns in matches.csv. Each document is one IPL
// match. Fields are typed so aggregation queries (winners, venues, head-to-head)
// are reliable. We index the columns we filter/group on most for speed.
const matchSchema = new Schema(
  {
    matchId: { type: Number, required: true, unique: true, index: true }, // from "id"
    season: { type: String, index: true },
    city: { type: String, index: true },
    date: { type: Date },
    matchType: { type: String },
    playerOfMatch: { type: String },
    venue: { type: String, index: true },
    team1: { type: String, index: true },
    team2: { type: String, index: true },
    tossWinner: { type: String },
    tossDecision: { type: String }, // "bat" | "field"
    winner: { type: String, index: true },
    result: { type: String }, // "runs" | "wickets" | "tie" | "no result"
    resultMargin: { type: Number },
    targetRuns: { type: Number },
    targetOvers: { type: Number },
    superOver: { type: String }, // "Y" | "N"
    method: { type: String }, // e.g. "D/L" or NA
    umpire1: { type: String },
    umpire2: { type: String },
  },
  { timestamps: true }
);

// Compound index for head-to-head queries (matches between two specific teams).
matchSchema.index({ team1: 1, team2: 1 });

export const Match = mongoose.model("Match", matchSchema);
