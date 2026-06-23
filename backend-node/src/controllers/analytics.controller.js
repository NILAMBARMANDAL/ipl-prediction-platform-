import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Match } from "../models/match.model.js";
import { Delivery } from "../models/delivery.model.js";

// The 8 canonical teams the model knows about. We normalize old franchise names
// to their current identities so analytics aren't split across renamed teams.
const TEAM_ALIASES = {
  "Delhi Daredevils": "Delhi Capitals",
  "Deccan Chargers": "Sunrisers Hyderabad",
  "Kings XI Punjab": "Punjab Kings",
  "Royal Challengers Bangalore": "Royal Challengers Bengaluru",
};

// A $switch expression usable inside aggregation to canonicalize a team field.
const canonicalize = (field) => ({
  $switch: {
    branches: Object.entries(TEAM_ALIASES).map(([from, to]) => ({
      case: { $eq: [field, from] },
      then: to,
    })),
    default: field,
  },
});

/**
 * GET /api/v1/analytics/overview
 * High-level numbers for the dashboard hero section.
 */
const getOverview = asyncHandler(async (req, res) => {
  const [matchCount, deliveryCount, seasons] = await Promise.all([
    Match.countDocuments(),
    Delivery.estimatedDocumentCount(),
    Match.distinct("season"),
  ]);

  // Toss → win correlation: of matches where a winner exists, how often did the
  // toss winner also win the match? A classic IPL talking point.
  const tossAgg = await Match.aggregate([
    { $match: { winner: { $ne: null }, tossWinner: { $ne: null } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        tossWins: {
          $sum: { $cond: [{ $eq: ["$tossWinner", "$winner"] }, 1, 0] },
        },
      },
    },
  ]);

  const toss = tossAgg[0] || { total: 0, tossWins: 0 };
  const tossWinPct = toss.total ? (toss.tossWins / toss.total) * 100 : 0;

  return res.status(200).json(
    new ApiResponse(200, {
      totalMatches: matchCount,
      totalDeliveries: deliveryCount,
      totalSeasons: seasons.filter(Boolean).length,
      tossWinPct: Math.round(tossWinPct * 10) / 10,
    })
  );
});

/**
 * GET /api/v1/analytics/team-standings
 * Wins per team across all seasons, normalized for renamed franchises.
 */
const getTeamStandings = asyncHandler(async (req, res) => {
  const standings = await Match.aggregate([
    { $match: { winner: { $ne: null } } },
    { $project: { team: canonicalize("$winner") } },
    { $group: { _id: "$team", wins: { $sum: 1 } } },
    { $sort: { wins: -1 } },
    { $project: { _id: 0, team: "$_id", wins: 1 } },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, standings, "Team standings by total wins"));
});

/**
 * GET /api/v1/analytics/head-to-head?team1=...&team2=...
 * Full head-to-head record between two teams, handling franchise renames on
 * both sides. Demonstrates a non-trivial aggregation with computed matchups.
 */
const getHeadToHead = asyncHandler(async (req, res) => {
  const { team1, team2 } = req.query;
  if (!team1 || !team2) {
    throw new ApiError(400, "Both team1 and team2 query params are required");
  }

  // Build the set of historical names that map to each requested canonical team,
  // so "Delhi Capitals" also matches old "Delhi Daredevils" rows.
  const aliasesFor = (canonical) => {
    const names = [canonical];
    for (const [from, to] of Object.entries(TEAM_ALIASES)) {
      if (to === canonical) names.push(from);
    }
    return names;
  };
  const t1Names = aliasesFor(team1);
  const t2Names = aliasesFor(team2);

  const result = await Match.aggregate([
    {
      $match: {
        $or: [
          { team1: { $in: t1Names }, team2: { $in: t2Names } },
          { team1: { $in: t2Names }, team2: { $in: t1Names } },
        ],
      },
    },
    { $project: { winnerCanon: canonicalize("$winner") } },
    {
      $group: {
        _id: null,
        totalMatches: { $sum: 1 },
        team1Wins: {
          $sum: { $cond: [{ $eq: ["$winnerCanon", team1] }, 1, 0] },
        },
        team2Wins: {
          $sum: { $cond: [{ $eq: ["$winnerCanon", team2] }, 1, 0] },
        },
      },
    },
  ]);

  const h2h = result[0] || { totalMatches: 0, team1Wins: 0, team2Wins: 0 };
  delete h2h._id;

  return res.status(200).json(
    new ApiResponse(200, {
      team1,
      team2,
      ...h2h,
      noResult: h2h.totalMatches - h2h.team1Wins - h2h.team2Wins,
    })
  );
});

/**
 * GET /api/v1/analytics/top-batsmen?limit=10
 * Highest run-scorers across all seasons — from the ball-by-ball deliveries.
 */
const getTopBatsmen = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  const batsmen = await Delivery.aggregate([
    { $match: { batter: { $ne: null } } },
    {
      $group: {
        _id: "$batter",
        runs: { $sum: "$batsmanRuns" },
        balls: { $sum: 1 },
      },
    },
    { $sort: { runs: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        batter: "$_id",
        runs: 1,
        balls: 1,
        // Strike rate = runs per 100 balls, rounded to 1 decimal.
        strikeRate: {
          $round: [
            { $multiply: [{ $divide: ["$runs", "$balls"] }, 100] },
            1,
          ],
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, batsmen, "Top run-scorers all-time"));
});

/**
 * GET /api/v1/analytics/top-bowlers?limit=10
 * Most wickets across all seasons. Only counts dismissals credited to the bowler
 * (run-outs etc. are excluded by filtering dismissal kinds).
 */
const getTopBowlers = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  // Dismissal kinds NOT credited to the bowler.
  const notBowler = ["run out", "retired hurt", "obstructing the field", "retired out"];

  const bowlers = await Delivery.aggregate([
    {
      $match: {
        isWicket: 1,
        bowler: { $ne: null },
        dismissalKind: { $nin: notBowler },
      },
    },
    { $group: { _id: "$bowler", wickets: { $sum: 1 } } },
    { $sort: { wickets: -1 } },
    { $limit: limit },
    { $project: { _id: 0, bowler: "$_id", wickets: 1 } },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, bowlers, "Top wicket-takers all-time"));
});

/**
 * GET /api/v1/analytics/venue-stats?limit=15
 * Per-venue: matches hosted and average 1st-innings total. Joins matches to
 * their 1st-innings deliveries via $lookup — a more advanced aggregation that
 * shows you can relate two collections.
 */
const getVenueStats = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 15, 50);

  // First compute 1st-innings totals per match from deliveries.
  const firstInningsTotals = await Delivery.aggregate([
    { $match: { inning: 1 } },
    { $group: { _id: "$matchId", total: { $sum: "$totalRuns" } } },
  ]);
  // Map matchId -> 1st innings total for quick joining in JS (avoids a heavy
  // cross-collection $lookup over 260k docs).
  const totalByMatch = new Map(firstInningsTotals.map((d) => [d._id, d.total]));

  const matches = await Match.find({ venue: { $ne: null } })
    .select("matchId venue")
    .lean();

  const byVenue = {};
  for (const m of matches) {
    const t = totalByMatch.get(m.matchId);
    if (t === undefined) continue;
    if (!byVenue[m.venue]) byVenue[m.venue] = { matches: 0, runsSum: 0 };
    byVenue[m.venue].matches += 1;
    byVenue[m.venue].runsSum += t;
  }

  const venueStats = Object.entries(byVenue)
    .map(([venue, v]) => ({
      venue,
      matches: v.matches,
      avgFirstInnings: Math.round(v.runsSum / v.matches),
    }))
    .sort((a, b) => b.matches - a.matches)
    .slice(0, limit);

  return res
    .status(200)
    .json(new ApiResponse(200, venueStats, "Venue stats: matches & avg 1st-innings score"));
});

/**
 * GET /api/v1/analytics/season-trend
 * Matches played per season — a simple time series for a line chart.
 */
const getSeasonTrend = asyncHandler(async (req, res) => {
  const trend = await Match.aggregate([
    { $match: { season: { $ne: null } } },
    { $group: { _id: "$season", matches: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, season: "$_id", matches: 1 } },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, trend, "Matches per season"));
});

export {
  getOverview,
  getTeamStandings,
  getHeadToHead,
  getTopBatsmen,
  getTopBowlers,
  getVenueStats,
  getSeasonTrend,
};
