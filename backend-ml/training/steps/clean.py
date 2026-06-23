
import pandas as pd


from features import TEAMS, normalize_team


def clean(matches: pd.DataFrame, deliveries: pd.DataFrame) -> pd.DataFrame:

    totals = (
        deliveries.groupby(["match_id", "inning"])
        .sum(numeric_only=True)["total_runs"]
        .reset_index()
    )
    totals = totals[totals["inning"] == 1]
    totals["target"] = totals["total_runs"] + 1

    match_df = matches.merge(
        totals[["match_id", "target"]], left_on="id", right_on="match_id"
    )

    # Normalize renamed franchises on the match team columns.
    for col in ["team1", "team2"]:
        match_df[col] = match_df[col].apply(normalize_team)

    # Keep only matches where both sides are canonical teams.
    match_df = match_df[match_df["team1"].isin(TEAMS) & match_df["team2"].isin(TEAMS)]

    print(f"  [clean] matches kept (canonical teams): {len(match_df)}")
    return match_df
