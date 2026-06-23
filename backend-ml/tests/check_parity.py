
import os
import sys

# Make the shared module importable.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from features import compute_match_state_features, overs_to_balls


def vectorized_reference(target, current_score, balls_bowled, wickets_fallen):
    """A standalone re-implementation matching steps/features.py's row math,
    used purely to cross-check the shared serving function."""
    runs_left = target - current_score
    balls_left = 120 - balls_bowled
    wickets_left = 10 - wickets_fallen
    crr = (current_score * 6) / balls_bowled
    rrr = (runs_left * 6) / balls_left if balls_left > 0 else 0.0
    return {
        "runs_left": runs_left,
        "balls_left": balls_left,
        "wickets_left": wickets_left,
        "crr": round(crr, 2),
        "rrr": round(rrr, 2),
    }


SAMPLES = [
    # (target, current_score, overs, wickets_fallen)
    (180, 132, 15.0, 4),
    (200, 95, 10.3, 2),
    (150, 40, 5.0, 1),
    (170, 169, 19.5, 9),
    (220, 100, 12.2, 5),
]


def main():
    failures = 0
    for target, score, overs, wkts in SAMPLES:
        balls = overs_to_balls(overs)
        serving = compute_match_state_features(
            target=target,
            current_score=score,
            balls_bowled=balls,
            wickets_fallen=wkts,
        )
        reference = vectorized_reference(target, score, balls, wkts)

        if serving != reference:
            failures += 1
            print(f"  MISMATCH for target={target}, score={score}, overs={overs}:")
            print(f"    serving={serving}")
            print(f"    training={reference}")
        else:
            print(f"  OK  target={target} score={score} overs={overs} -> {serving}")

    if failures:
        print(f"\nFAILED: {failures} mismatch(es) — train/serve skew detected!")
        sys.exit(1)
    print("\nPASSED: training and serving features agree on all samples.")


if __name__ == "__main__":
    main()
