
TEAMS = [
    "Sunrisers Hyderabad",
    "Mumbai Indians",
    "Royal Challengers Bangalore",
    "Kolkata Knight Riders",
    "Kings XI Punjab",
    "Chennai Super Kings",
    "Rajasthan Royals",
    "Delhi Capitals",
]

RENAMES = {
    "Delhi Daredevils": "Delhi Capitals",
    "Deccan Chargers": "Sunrisers Hyderabad",
}


FEATURE_ORDER = [
    "batting_team",
    "bowling_team",
    "city",
    "runs_left",
    "balls_left",
    "wickets_left",
    "target",
    "crr",
    "rrr",
]


def normalize_team(name):
    """Map an old franchise name to its current identity (idempotent)."""
    return RENAMES.get(name, name)


def compute_match_state_features(*, target, current_score, balls_bowled, wickets_fallen):
  
    if balls_bowled <= 0:
        raise ValueError("balls_bowled must be > 0 to compute a run rate")
    if balls_bowled >= 120:
        raise ValueError("the innings is over (120 balls); nothing to predict")

    runs_left = target - current_score
    balls_left = 120 - balls_bowled
    wickets_left = 10 - wickets_fallen

    # Current run rate = runs per over = (runs * 6) / balls faced.
    crr = (current_score * 6) / balls_bowled
    # Required run rate = runs still needed per over over the balls remaining.
    rrr = (runs_left * 6) / balls_left if balls_left > 0 else 0.0

    return {
        "runs_left": runs_left,
        "balls_left": balls_left,
        "wickets_left": wickets_left,
        "crr": round(crr, 2),
        "rrr": round(rrr, 2),
    }


def overs_to_balls(overs):

    completed = int(overs)
    balls_part = round((overs - completed) * 10)
    if balls_part > 5:
        raise ValueError("invalid overs: the balls part must be 0-5 (max x.5)")
    return completed * 6 + balls_part
