
import pandas as pd

from features import TEAMS, normalize_team, FEATURE_ORDER


def build_features(match_df: pd.DataFrame, deliveries: pd.DataFrame) -> pd.DataFrame:
    # Join match-level info (incl. target, winner) onto each delivery.
    df = match_df.merge(deliveries, left_on="id", right_on="match_id")

    # Only the chase (2nd innings) is what the model predicts.
    df = df[df["inning"] == 2].copy()

    # Normalize the delivery-level team columns too (the original notebook missed
    # this, leaking old names like "Deccan Chargers" into training).
    for col in ["batting_team", "bowling_team"]:
        df[col] = df[col].apply(normalize_team)
    df = df[df["batting_team"].isin(TEAMS) & df["bowling_team"].isin(TEAMS)]

    # --- Feature math (vectorized form of features.compute_match_state_features) ---
    df["current_score"] = df.groupby("id")["total_runs"].cumsum()
    df["runs_left"] = df["target"] - df["current_score"]

    balls_bowled = df["over"] * 6 + df["ball"]
    df["balls_left"] = 120 - balls_bowled

    df["player_dismissed"] = (
        df["player_dismissed"].fillna("0").apply(lambda x: 0 if x == "0" else 1)
    )
    wickets = df.groupby("id")["player_dismissed"].cumsum().values
    df["wickets_left"] = 10 - wickets

    # crr = (score*6)/balls_bowled ; rrr = (runs_left*6)/balls_left
    df["crr"] = (df["current_score"] * 6) / balls_bowled
    df["rrr"] = (df["runs_left"] * 6) / df["balls_left"]

    # Label: did the batting team go on to win?
    df["result"] = df.apply(
        lambda r: 1 if r["batting_team"] == r["winner"] else 0, axis=1
    )

    final = df[FEATURE_ORDER + ["result"]].dropna()
    # Drop the last ball of completed innings (balls_left == 0 -> div issues).
    final = final[final["balls_left"] != 0]

    print(f"  [features] training rows: {len(final)}")
    return final
