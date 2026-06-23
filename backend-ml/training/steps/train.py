
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


def train(final_df: pd.DataFrame, split_cfg: dict, model_cfg: dict):
    """Returns (fitted_pipeline, X_test, y_test) so the evaluate step can score it."""
    X = final_df.drop("result", axis=1)
    y = final_df["result"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=split_cfg["test_size"],
        random_state=split_cfg["random_state"],
    )


    transformer = ColumnTransformer(
        [
            (
                "ohe",
                OneHotEncoder(sparse_output=False, drop="first", handle_unknown="ignore"),
                ["batting_team", "bowling_team", "city"],
            )
        ],
        remainder="passthrough",
    )

    pipe = Pipeline(
        steps=[
            ("preprocess", transformer),
            (
                "model",
                LogisticRegression(
                    solver=model_cfg["solver"],
                    C=model_cfg["C"],
                    max_iter=model_cfg["max_iter"],
                ),
            ),
        ]
    )

    pipe.fit(X_train, y_train)
    print(f"  [train] fitted on {len(X_train)} rows")
    return pipe, X_test, y_test
