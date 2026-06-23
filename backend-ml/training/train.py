
import argparse
import pickle

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

# The 8 franchises the model reasons about. Old names are folded into current ones.
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


def build_dataset(matches_path: str, deliveries_path: str) -> pd.DataFrame:
    matches = pd.read_csv(matches_path)
    deliveries = pd.read_csv(deliveries_path)

    # 1st-innings total per match -> target (runs + 1).
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

    # Normalize team names on BOTH the match columns and (below) the delivery columns.
    for col in ["team1", "team2"]:
        for old, new in RENAMES.items():
            match_df[col] = match_df[col].str.replace(old, new)
    match_df = match_df[match_df["team1"].isin(TEAMS) & match_df["team2"].isin(TEAMS)]

    # Join back to deliveries and keep only the chase (2nd innings).
    delivery_df = match_df.merge(deliveries, left_on="id", right_on="match_id")
    delivery_df = delivery_df[delivery_df["inning"] == 2].copy()

    # Normalize the delivery-level team columns too (the notebook missed this;
    # doing it here keeps training consistent with the 8-team UI).
    for col in ["batting_team", "bowling_team"]:
        for old, new in RENAMES.items():
            delivery_df[col] = delivery_df[col].str.replace(old, new)
    delivery_df = delivery_df[
        delivery_df["batting_team"].isin(TEAMS)
        & delivery_df["bowling_team"].isin(TEAMS)
    ]

    # Feature engineering.
    delivery_df["current_score"] = delivery_df.groupby("id")["total_runs"].cumsum()
    delivery_df["runs_left"] = delivery_df["target"] - delivery_df["current_score"]
    delivery_df["balls_left"] = 120 - (delivery_df["over"] * 6 + delivery_df["ball"])

    delivery_df["player_dismissed"] = (
        delivery_df["player_dismissed"].fillna("0").apply(lambda x: 0 if x == "0" else 1)
    )
    wickets = delivery_df.groupby("id")["player_dismissed"].cumsum().values
    delivery_df["wickets_left"] = 10 - wickets

    delivery_df["crr"] = (delivery_df["current_score"] * 6) / (120 - delivery_df["balls_left"])
    delivery_df["rrr"] = (delivery_df["runs_left"] * 6) / delivery_df["balls_left"]

    delivery_df["result"] = delivery_df.apply(
        lambda r: 1 if r["batting_team"] == r["winner"] else 0, axis=1
    )

    final_df = delivery_df[
        [
            "batting_team",
            "bowling_team",
            "city",
            "runs_left",
            "balls_left",
            "wickets_left",
            "target",
            "crr",
            "rrr",
            "result",
        ]
    ].dropna()
    final_df = final_df[final_df["balls_left"] != 0]
    return final_df


def train(final_df: pd.DataFrame):
    X = final_df.drop("result", axis=1)
    y = final_df["result"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=1
    )

    trf = ColumnTransformer(
        [
            (
                "trf",
                OneHotEncoder(sparse_output=False, drop="first"),
                ["batting_team", "bowling_team", "city"],
            )
        ],
        remainder="passthrough",
    )
    pipe = Pipeline(steps=[("step1", trf), ("step2", LogisticRegression(solver="liblinear"))])
    pipe.fit(X_train, y_train)

    acc = pipe.score(X_test, y_test)
    return pipe, acc


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--matches", default="data/matches.csv")
    parser.add_argument("--deliveries", default="data/deliveries.csv")
    parser.add_argument("--out", default="pipe.pkl")
    args = parser.parse_args()

    print("Building dataset...")
    final_df = build_dataset(args.matches, args.deliveries)
    print(f"  training rows: {len(final_df)}")

    print("Training...")
    pipe, acc = train(final_df)
    print(f"  test accuracy: {acc:.4f}")

    with open(args.out, "wb") as f:
        pickle.dump(pipe, f)
    print(f"Saved model to {args.out}")


if __name__ == "__main__":
    main()
