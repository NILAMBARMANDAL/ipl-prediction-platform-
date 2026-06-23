/**
 * seedIplData.js — loads matches.csv and deliveries.csv into MongoDB.
 *
 * WHY STREAMING + BATCHING:
 * deliveries.csv has ~260,000 rows. Two naive approaches both fail:
 *   1. Read the whole file into memory, JSON.parse → huge memory spike.
 *   2. insert one document per row → 260k separate DB round-trips, painfully slow.
 *
 * Instead we STREAM the file row-by-row (constant memory) and accumulate rows
 * into BATCHES, flushing each batch with insertMany (one round-trip per ~5000
 * rows). This is the realistic way to bulk-load data and is a real backend skill.
 *
 * Run with:  npm run seed
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import csv from "csv-parser";
import mongoose from "mongoose";
import connectDB from "../src/db/index.js";
import { Match } from "../src/models/match.model.js";
import { Delivery } from "../src/models/delivery.model.js";

dotenv.config({ path: "./.env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "..", "data");

const BATCH_SIZE = 5000;

// "NA"/empty strings in the CSV should become null/undefined, not the literal
// string "NA". This helper normalizes those.
const clean = (v) => (v === undefined || v === "" || v === "NA" ? null : v);
const num = (v) => {
  const c = clean(v);
  return c === null ? null : Number(c);
};

// Generic streaming loader: reads a CSV, maps each row via rowMapper, and
// inserts in batches into the given Mongoose model.
function loadCsv(filePath, Model, rowMapper, label) {
  return new Promise((resolve, reject) => {
    let batch = [];
    let total = 0;
    const stream = fs.createReadStream(filePath).pipe(csv());

    // Pause/resume around async insertMany so we don't overrun the DB: we stop
    // reading while a batch is being written, then resume.
    stream.on("data", (row) => {
      batch.push(rowMapper(row));
      if (batch.length >= BATCH_SIZE) {
        stream.pause();
        const toInsert = batch;
        batch = [];
        Model.insertMany(toInsert, { ordered: false })
          .then(() => {
            total += toInsert.length;
            process.stdout.write(`\r  ${label}: inserted ${total} rows...`);
            stream.resume();
          })
          .catch(reject);
      }
    });

    stream.on("end", async () => {
      try {
        if (batch.length) {
          await Model.insertMany(batch, { ordered: false });
          total += batch.length;
        }
        process.stdout.write(`\r  ${label}: inserted ${total} rows. Done.\n`);
        resolve(total);
      } catch (err) {
        reject(err);
      }
    });

    stream.on("error", reject);
  });
}

// Map a matches.csv row to a Match document.
const mapMatch = (r) => ({
  matchId: num(r.id),
  season: clean(r.season),
  city: clean(r.city),
  date: clean(r.date) ? new Date(r.date) : null,
  matchType: clean(r.match_type),
  playerOfMatch: clean(r.player_of_match),
  venue: clean(r.venue),
  team1: clean(r.team1),
  team2: clean(r.team2),
  tossWinner: clean(r.toss_winner),
  tossDecision: clean(r.toss_decision),
  winner: clean(r.winner),
  result: clean(r.result),
  resultMargin: num(r.result_margin),
  targetRuns: num(r.target_runs),
  targetOvers: num(r.target_overs),
  superOver: clean(r.super_over),
  method: clean(r.method),
  umpire1: clean(r.umpire1),
  umpire2: clean(r.umpire2),
});

// Map a deliveries.csv row to a Delivery document.
const mapDelivery = (r) => ({
  matchId: num(r.match_id),
  inning: num(r.inning),
  battingTeam: clean(r.batting_team),
  bowlingTeam: clean(r.bowling_team),
  over: num(r.over),
  ball: num(r.ball),
  batter: clean(r.batter),
  bowler: clean(r.bowler),
  nonStriker: clean(r.non_striker),
  batsmanRuns: num(r.batsman_runs),
  extraRuns: num(r.extra_runs),
  totalRuns: num(r.total_runs),
  extrasType: clean(r.extras_type),
  isWicket: num(r.is_wicket),
  playerDismissed: clean(r.player_dismissed),
  dismissalKind: clean(r.dismissal_kind),
  fielder: clean(r.fielder),
});

async function seed() {
  await connectDB();

  const matchesPath = path.join(DATA_DIR, "matches.csv");
  const deliveriesPath = path.join(DATA_DIR, "deliveries.csv");

  if (!fs.existsSync(matchesPath) || !fs.existsSync(deliveriesPath)) {
    console.error(
      `\nCSV files not found in ${DATA_DIR}.\n` +
        `Place matches.csv and deliveries.csv there, then re-run.\n`
    );
    process.exit(1);
  }

  // Wipe existing data so re-seeding is idempotent (safe to run repeatedly).
  console.log("Clearing existing collections...");
  await Match.deleteMany({});
  await Delivery.deleteMany({});

  console.log("Seeding matches...");
  await loadCsv(matchesPath, Match, mapMatch, "matches");

  console.log("Seeding deliveries (this is the big one)...");
  await loadCsv(deliveriesPath, Delivery, mapDelivery, "deliveries");

  console.log("\nSeed complete.");
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("\nSeeding failed:", err);
  process.exit(1);
});
