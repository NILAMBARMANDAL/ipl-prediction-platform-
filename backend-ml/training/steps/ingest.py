
import pandas as pd


def ingest(matches_csv: str, deliveries_csv: str):
    """Read the two source CSVs. Kept deliberately thin: ingestion just loads;
    cleaning and feature work happen in later steps so each stage has one job."""
    matches = pd.read_csv(matches_csv)
    deliveries = pd.read_csv(deliveries_csv)
    print(f"  [ingest] matches={matches.shape}, deliveries={deliveries.shape}")
    return matches, deliveries
