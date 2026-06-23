import mongoose, { Schema } from "mongoose";

// Delivery schema — mirrors deliveries.csv. Each document is ONE ball bowled.
// This is the large collection (~260k docs), so indexing matters: we index the
// fields our analytics group/filter on (match, batter, bowler, teams).
const deliverySchema = new Schema(
  {
    matchId: { type: Number, required: true, index: true },
    inning: { type: Number },
    battingTeam: { type: String, index: true },
    bowlingTeam: { type: String, index: true },
    over: { type: Number },
    ball: { type: Number },
    batter: { type: String, index: true },
    bowler: { type: String, index: true },
    nonStriker: { type: String },
    batsmanRuns: { type: Number },
    extraRuns: { type: Number },
    totalRuns: { type: Number },
    extrasType: { type: String },
    isWicket: { type: Number }, // 0 | 1
    playerDismissed: { type: String },
    dismissalKind: { type: String },
    fielder: { type: String },
  },
  { timestamps: false } // 260k rows — skip timestamps to keep docs lean
);

export const Delivery = mongoose.model("Delivery", deliverySchema);
