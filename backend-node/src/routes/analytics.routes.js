import { Router } from "express";
import {
  getOverview,
  getTeamStandings,
  getHeadToHead,
  getTopBatsmen,
  getTopBowlers,
  getVenueStats,
  getSeasonTrend,
} from "../controllers/analytics.controller.js";

const router = Router();

// All analytics endpoints are public (read-only historical data). If you wanted
// to gate them behind login, you'd add verifyJWT here.
router.route("/overview").get(getOverview);
router.route("/team-standings").get(getTeamStandings);
router.route("/head-to-head").get(getHeadToHead);
router.route("/top-batsmen").get(getTopBatsmen);
router.route("/top-bowlers").get(getTopBowlers);
router.route("/venue-stats").get(getVenueStats);
router.route("/season-trend").get(getSeasonTrend);

export default router;
