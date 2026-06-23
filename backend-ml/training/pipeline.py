"""
pipeline.py — orchestrates the IPL win-predictor training pipeline.

Runs five stages in order:  ingest -> clean -> features -> train -> evaluate

This is intentionally a PLAIN-PYTHON pipeline, not ZenML. The companion
Predictive-Maintenance project uses ZenML + MLflow because there the ML lifecycle
IS the project. Here the focus is the product (the web app), so the training is
kept lightweight: a clear staged flow, driven by config.yaml, with no heavyweight
orchestration. Using the right weight of tooling for the job is the point.

Run from the backend-ml/ directory so the shared `features.py` is importable:

    cd backend-ml
    python training/pipeline.py
    # or with a custom config:
    python training/pipeline.py --config training/config.yaml
"""
import argparse
import os
import pickle
import sys

import yaml

# Ensure the backend-ml/ root (which holds the shared features.py) is importable,
# regardless of where the script is invoked from.
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ML_ROOT = os.path.dirname(THIS_DIR)
sys.path.insert(0, BACKEND_ML_ROOT)
sys.path.insert(0, THIS_DIR)

from steps.ingest import ingest
from steps.clean import clean
from steps.features import build_features
from steps.train import train
from steps.evaluate import evaluate


def load_config(path):
    with open(path, "r") as f:
        return yaml.safe_load(f)


def run(config_path):
    cfg = load_config(config_path)

    # Resolve paths relative to the config file's directory so the pipeline works
    # no matter the current working directory.
    cfg_dir = os.path.dirname(os.path.abspath(config_path))

    def rel(p):
        return p if os.path.isabs(p) else os.path.normpath(os.path.join(cfg_dir, p))

    matches_csv = rel(cfg["data"]["matches_csv"])
    deliveries_csv = rel(cfg["data"]["deliveries_csv"])
    model_path = rel(cfg["output"]["model_path"])
    metrics_path = rel(cfg["output"]["metrics_path"])

    print("=== IPL win-predictor training pipeline ===")

    # 1. Ingest
    matches, deliveries = ingest(matches_csv, deliveries_csv)

    # 2. Clean
    match_df = clean(matches, deliveries)

    # 3. Features
    final_df = build_features(match_df, deliveries)

    # 4. Train
    pipe, X_test, y_test = train(final_df, cfg["split"], cfg["model"])

    # 5. Evaluate
    metrics = evaluate(pipe, X_test, y_test, metrics_path)

    # Persist the fitted pipeline for the FastAPI service to load.
    with open(model_path, "wb") as f:
        pickle.dump(pipe, f)
    print(f"  [save] model -> {model_path}")

    print(f"=== Done. accuracy={metrics['accuracy']} f1={metrics['f1']} ===")
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--config",
        default=os.path.join(THIS_DIR, "config.yaml"),
        help="path to config.yaml",
    )
    args = parser.parse_args()
    run(args.config)
